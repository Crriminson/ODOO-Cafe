import { query, getClient } from './config/db.js';
import {
  getCurrentOpenSession,
  openSession,
  closeSession,
  getLastClosedSession,
} from './db/queries/sessions.queries.js';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../shared/constants/index.js';

async function runTests() {
  console.log('--- Starting Session Queries Tests ---');

  // 1. Get or create a test user (employee role)
  let employeeId = null;
  const userRes = await query("SELECT id FROM users WHERE role = 'employee' LIMIT 1");
  if (userRes.rows.length > 0) {
    employeeId = userRes.rows[0].id;
  } else {
    // Insert a dummy employee
    const insertUser = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Test Employee', 'test_employee_session@example.com', 'dummyhash', 'employee')
       RETURNING id`
    );
    employeeId = insertUser.rows[0].id;
  }
  console.log('Testing with employee ID:', employeeId);

  // Clean up any existing open sessions for this employee to start clean
  await query("UPDATE sessions SET closed_at = NOW() WHERE employee_id = $1 AND closed_at IS NULL", [employeeId]);

  // Check getCurrentOpenSession (expect null)
  let openSessionRow = await getCurrentOpenSession(employeeId);
  if (openSessionRow !== null) {
    throw new Error('Expected getCurrentOpenSession to return null, got: ' + JSON.stringify(openSessionRow));
  }
  console.log('✓ getCurrentOpenSession returned null initially.');

  // Open a new session
  const newSession = await openSession(employeeId);
  if (!newSession || newSession.employee_id !== employeeId || newSession.closed_at !== null) {
    throw new Error('Failed to open session: ' + JSON.stringify(newSession));
  }
  console.log('✓ openSession created a new session:', newSession.id);

  // Check getCurrentOpenSession (expect it to return the open session)
  openSessionRow = await getCurrentOpenSession(employeeId);
  if (!openSessionRow || openSessionRow.id !== newSession.id) {
    throw new Error('Expected getCurrentOpenSession to return open session, got: ' + JSON.stringify(openSessionRow));
  }
  console.log('✓ getCurrentOpenSession returned active session:', openSessionRow.id);

  // Check unique index violation on opening a second session
  let uniqueViolationCaught = false;
  try {
    await openSession(employeeId);
  } catch (err) {
    if (err.code === '23505') {
      uniqueViolationCaught = true;
    } else {
      throw err;
    }
  }
  if (!uniqueViolationCaught) {
    throw new Error('Expected openSession to fail with unique violation constraint.');
  }
  console.log('✓ openSession unique constraint caught successfully.');

  // Insert dummy orders for this session
  // Order 1: Paid, Takeaway, cash payment of 150.00
  const order1 = await query(
    `INSERT INTO orders (session_id, employee_id, order_type, status, total)
     VALUES ($1, $2, 'takeaway', $3, 150.00) RETURNING id`,
    [newSession.id, employeeId, ORDER_STATUS.PAID]
  );
  await query(
    `INSERT INTO payments (order_id, method, amount)
     VALUES ($1, $2, 150.00)`,
    [order1.rows[0].id, PAYMENT_METHODS.CASH]
  );

  // Order 2: Paid, Takeaway, card payment of 200.50
  const order2 = await query(
    `INSERT INTO orders (session_id, employee_id, order_type, status, total)
     VALUES ($1, $2, 'takeaway', $3, 200.50) RETURNING id`,
    [newSession.id, employeeId, ORDER_STATUS.PAID]
  );
  await query(
    `INSERT INTO payments (order_id, method, amount, transaction_reference)
     VALUES ($1, $2, 200.50, 'tx_123456')`,
    [order2.rows[0].id, PAYMENT_METHODS.CARD]
  );

  // Order 3: Draft (should be ignored), Takeaway, amount 500.00
  const order3 = await query(
    `INSERT INTO orders (session_id, employee_id, order_type, status, total)
     VALUES ($1, $2, 'takeaway', $3, 500.00) RETURNING id`,
    [newSession.id, employeeId, ORDER_STATUS.DRAFT]
  );
  await query(
    `INSERT INTO payments (order_id, method, amount)
     VALUES ($1, $2, 500.00)`,
    [order3.rows[0].id, PAYMENT_METHODS.UPI]
  );

  console.log('✓ Dummy orders and payments inserted.');

  // Close the session
  const closedSession = await closeSession(newSession.id);
  if (!closedSession || closedSession.closed_at === null) {
    throw new Error('Failed to close session: ' + JSON.stringify(closedSession));
  }

  // Validate closing stats
  console.log('Closed Session Row:', JSON.stringify(closedSession, null, 2));

  if (closedSession.closing_total_orders !== 2) {
    throw new Error(`Expected closing_total_orders to be 2, got ${closedSession.closing_total_orders}`);
  }
  if (closedSession.closing_total_revenue !== '350.50') {
    throw new Error(`Expected closing_total_revenue to be "350.50" (string), got ${JSON.stringify(closedSession.closing_total_revenue)}`);
  }

  const breakdown = closedSession.closing_breakdown;
  if (!breakdown || typeof breakdown !== 'object') {
    throw new Error('Expected closing_breakdown to be an object, got: ' + JSON.stringify(breakdown));
  }
  if (breakdown.cash !== '150.00') {
    throw new Error(`Expected breakdown.cash to be "150.00", got ${JSON.stringify(breakdown.cash)}`);
  }
  if (breakdown.card !== '200.50') {
    throw new Error(`Expected breakdown.card to be "200.50", got ${JSON.stringify(breakdown.card)}`);
  }
  if (breakdown.upi !== '0.00') {
    throw new Error(`Expected breakdown.upi to be "0.00", got ${JSON.stringify(breakdown.upi)}`);
  }

  console.log('✓ Session closing stats validated successfully.');

  // Test getLastClosedSession
  const lastClosed = await getLastClosedSession(employeeId);
  if (!lastClosed || lastClosed.id !== newSession.id) {
    throw new Error('Expected getLastClosedSession to return the closed session, got: ' + JSON.stringify(lastClosed));
  }
  console.log('✓ getLastClosedSession returned correct closed session:', lastClosed.id);

  // Clean up test data
  console.log('Cleaning up test records...');
  await query("DELETE FROM payments WHERE order_id IN ($1, $2, $3)", [order1.rows[0].id, order2.rows[0].id, order3.rows[0].id]);
  await query("DELETE FROM orders WHERE session_id = $1", [newSession.id]);
  await query("DELETE FROM sessions WHERE id = $1", [newSession.id]);
  // If we created a dummy user, clean it up
  const dummyUserCheck = await query("SELECT email FROM users WHERE email = 'test_employee_session@example.com'");
  if (dummyUserCheck.rows.length > 0) {
    await query("DELETE FROM users WHERE email = 'test_employee_session@example.com'");
  }

  console.log('--- All Session Queries Tests Passed Successfully! ---');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
