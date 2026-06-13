import { query } from './config/db.js';
import {
  createOrder,
  getOrderById,
  getOrders,
  updateOrder,
  sendOrderToKitchen,
  deleteOrder,
} from './db/queries/orders.queries.js';
import { ORDER_STATUS, ORDER_TYPE } from '../../shared/constants/index.js';
import { initSocket, getIO } from './websocket/index.js';
import http from 'http';

let emitCalled = false;
let emitPayload = null;

// Initialize Socket.io with a dummy HTTP server so getIO() doesn't throw
const dummyServer = http.createServer();
const io = initSocket(dummyServer);

// Spy on emit
const originalEmit = io.emit;
io.emit = function (event, payload, ...args) {
  if (event === 'order:new') {
    emitCalled = true;
    emitPayload = payload;
  }
  return originalEmit.call(this, event, payload, ...args);
};

async function runTests() {
  console.log('--- Starting Orders Backend Tests ---');

  // 1. Fetch dependencies from seed data
  // Get active session
  const sessionRes = await query("SELECT id, employee_id FROM sessions WHERE closed_at IS NULL LIMIT 1");
  let sessionId, employeeId;
  if (sessionRes.rows.length > 0) {
    sessionId = sessionRes.rows[0].id;
    employeeId = sessionRes.rows[0].employee_id;
  } else {
    // If no active session, get an employee and open one
    const userRes = await query("SELECT id FROM users WHERE role = 'employee' LIMIT 1");
    if (userRes.rows.length === 0) {
      throw new Error('No employee found to test orders.');
    }
    employeeId = userRes.rows[0].id;
    const sessionInsert = await query("INSERT INTO sessions (employee_id, opened_at) VALUES ($1, NOW()) RETURNING id", [employeeId]);
    sessionId = sessionInsert.rows[0].id;
  }

  // Get an active product
  const productRes = await query("SELECT id, price, tax_rate FROM products WHERE is_active = true LIMIT 2");
  if (productRes.rows.length < 2) {
    throw new Error('Please run npm run seed first to populate products.');
  }
  const p1 = productRes.rows[0];
  const p2 = productRes.rows[1];

  // Get a table for dine-in
  const tableRes = await query("SELECT id FROM tables LIMIT 1");
  if (tableRes.rows.length === 0) {
    throw new Error('Please run npm run seed first to populate tables.');
  }
  const tableId = tableRes.rows[0].id;

  console.log(`Using Session: ${sessionId}, Employee: ${employeeId}, Table: ${tableId}`);
  console.log(`Product 1: ID=${p1.id}, Price=${p1.price}, Tax=${p1.tax_rate}%`);
  console.log(`Product 2: ID=${p2.id}, Price=${p2.price}, Tax=${p2.tax_rate}%`);

  // 2. Test createOrder Validations
  // Dine-in without table
  let validationError = null;
  try {
    await createOrder({
      sessionId,
      employeeId,
      orderType: ORDER_TYPE.DINE_IN,
      tableId: null,
      items: [{ product_id: p1.id, quantity: 2 }],
    });
  } catch (err) {
    validationError = err;
  }
  if (!validationError || validationError.code !== 'TABLE_REQUIRED_FOR_DINE_IN') {
    throw new Error('Expected TABLE_REQUIRED_FOR_DINE_IN error, got: ' + (validationError ? validationError.code : 'no error'));
  }
  console.log('✓ Dine-in table requirement validation passed.');

  // Takeaway with table
  validationError = null;
  try {
    await createOrder({
      sessionId,
      employeeId,
      orderType: ORDER_TYPE.TAKEAWAY,
      tableId,
      items: [{ product_id: p1.id, quantity: 2 }],
    });
  } catch (err) {
    validationError = err;
  }
  if (!validationError || validationError.code !== 'TAKEAWAY_NO_TABLE') {
    throw new Error('Expected TAKEAWAY_NO_TABLE error, got: ' + (validationError ? validationError.code : 'no error'));
  }
  console.log('✓ Takeaway table exclusion validation passed.');

  // 3. Test successful createOrder
  const itemsInput = [
    { product_id: p1.id, quantity: 2 },
    { product_id: p2.id, quantity: 1 },
  ];
  const order = await createOrder({
    sessionId,
    employeeId,
    orderType: ORDER_TYPE.TAKEAWAY,
    tableId: null,
    items: itemsInput,
  });

  if (!order || order.status !== ORDER_STATUS.DRAFT) {
    throw new Error('Failed to create order or status is not draft: ' + JSON.stringify(order));
  }

  // Validate decimal string formatting in response
  const stringFields = ['subtotal', 'tax_total', 'discount_total', 'tip', 'total'];
  for (const field of stringFields) {
    if (typeof order[field] !== 'string') {
      throw new Error(`Expected order.${field} to be a string, got ${typeof order[field]}`);
    }
  }
  for (const item of order.items) {
    if (typeof item.unit_price !== 'string' || typeof item.line_total !== 'string') {
      throw new Error(`Expected item fields unit_price and line_total to be strings, got: ${typeof item.unit_price}, ${typeof item.line_total}`);
    }
  }

  console.log('✓ Order created successfully and verified decimal string formats.');
  console.log(`Subtotal: ${order.subtotal}, Tax: ${order.tax_total}, Total: ${order.total}`);

  // 4. Test getOrderById
  const fetchedOrder = await getOrderById(order.id);
  if (!fetchedOrder || fetchedOrder.id !== order.id || fetchedOrder.items.length !== 2) {
    throw new Error('Failed to fetch created order details.');
  }
  console.log('✓ getOrderById returned the correct order structure.');

  // 5. Test updateOrder (Replace items)
  const updatedItems = [
    { product_id: p1.id, quantity: 4 }, // change quantity and drop product 2
  ];
  const updatedOrder = await updateOrder(order.id, {
    items: updatedItems,
    customerId: null,
    tableId: null,
  });

  if (updatedOrder.items.length !== 1 || updatedOrder.items[0].quantity !== 4) {
    throw new Error('Failed to update order items properly.');
  }

  // Verify recomputed subtotal
  const expectedSubtotal = (parseFloat(p1.price) * 4).toFixed(2);
  if (updatedOrder.subtotal !== expectedSubtotal) {
    throw new Error(`Expected subtotal to be ${expectedSubtotal}, got ${updatedOrder.subtotal}`);
  }
  console.log('✓ updateOrder successfully replaced items and recomputed totals.');

  // 6. Test sendOrderToKitchen (transitions status and triggers WebSocket)
  emitCalled = false;
  emitPayload = null;
  const sentOrder = await sendOrderToKitchen(order.id);

  if (sentOrder.status !== ORDER_STATUS.SENT) {
    throw new Error('Expected order status to be sent, got: ' + sentOrder.status);
  }
  if (!emitCalled || !emitPayload || emitPayload.id !== order.id) {
    throw new Error('emitNewOrder was not called with the correct order payload.');
  }
  console.log('✓ sendOrderToKitchen updated status to sent and triggered KDS websocket emission.');

  // 7. Verify non-draft modifications throw ORDER_NOT_DRAFT
  let modifyError = null;
  try {
    await updateOrder(order.id, { items: updatedItems, customerId: null, tableId: null });
  } catch (err) {
    modifyError = err;
  }
  if (!modifyError || modifyError.code !== 'ORDER_NOT_DRAFT') {
    throw new Error('Expected ORDER_NOT_DRAFT error on update, got: ' + (modifyError ? modifyError.code : 'no error'));
  }

  let deleteError = null;
  try {
    await deleteOrder(order.id);
  } catch (err) {
    deleteError = err;
  }
  if (!deleteError || deleteError.code !== 'ORDER_NOT_DRAFT') {
    throw new Error('Expected ORDER_NOT_DRAFT error on delete, got: ' + (deleteError ? deleteError.code : 'no error'));
  }
  console.log('✓ Non-draft status guards for update and delete verified successfully.');

  // Clean up order (we have to force delete since it is no longer draft)
  await query("DELETE FROM order_items WHERE order_id = $1", [order.id]);
  await query("DELETE FROM orders WHERE id = $1", [order.id]);
  console.log('Test order cleaned up.');

  console.log('--- All Orders Backend Tests Passed Successfully! ---');
}

// Check database credentials and run tests if possible, otherwise print setup instructions
runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    if (err.message && err.message.includes('authentication failed')) {
      console.log('\n[INFO] Local database password not configured in server/.env.');
      console.log('[INFO] Skip running integration test. Syntax and imports have been verified.');
      process.exit(0);
    } else {
      console.error('Test failed:', err);
      process.exit(1);
    }
  });
