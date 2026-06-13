import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';

const setupMocks = (t) => {
  const dbMock = {
    namedExports: {
      query: async (sql, params) => {
        if (globalThis.mockQuery) {
          return globalThis.mockQuery(sql, params);
        }
        return { rows: [] };
      },
    },
  };
  t.mock.module('../config/db.js', dbMock);

  t.mock.module('../utils/jwt.js', {
    namedExports: {
      signToken: () => 'mocked_token',
      verifyToken: (token) => {
        if (token === 'admin_token') {
          return { userId: 1, role: 'admin', name: 'Admin User' };
        }
        if (token === 'employee_token') {
          return { userId: 2, role: 'employee', name: 'Employee User' };
        }
        throw new Error('Invalid token');
      },
    },
  });

  t.mock.module('../websocket/kds.emitter.js', {
    namedExports: {
      emitStageUpdated: (...args) => {
        if (globalThis.mockEmitStageUpdated) {
          return globalThis.mockEmitStageUpdated(...args);
        }
      },
      emitItemCompleted: (...args) => {
        if (globalThis.mockEmitItemCompleted) {
          return globalThis.mockEmitItemCompleted(...args);
        }
      },
    },
  });
};

const makeRequest = async (path, method = 'GET', body = null) => {
  // Bust cache by importing app dynamically with query param to ensure mocks are respected
  const { default: app } = await import(`../app.js?test=${Date.now()}_${Math.random()}`);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const response = await fetch(`http://localhost:${port}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : null,
    });
    const data = await response.json();
    return { status: response.status, data };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

// ─── GET /kds/orders tests ───────────────────────────────────────────────────

test('GET /kds/orders is open (returns 200 without Authorization)', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async () => ({
    rows: [
      {
        order_id: 5,
        order_type: 'dine_in',
        order_status: 'sent',
        table_id: 3,
        table_number: 2,
        session_id: 1,
        customer_id: 8,
        customer_name: 'Alice',
        order_created_at: new Date('2024-06-13T10:30:00.000Z'),
        subtotal: '240.00',
        tax_total: '12.00',
        discount_total: '0.00',
        tip: '0.00',
        total: '252.00',
        item_id: 1,
        product_id: 1,
        product_name: 'Espresso',
        category_id: 1,
        category_name: 'Coffee',
        category_color: '#FFD54F',
        quantity: 2,
        unit_price: '120.00',
        line_total: '240.00',
        kds_status: 'to_cook',
        is_item_completed: false,
        assigned_cook_id: 1,
        assigned_cook_name: 'Chef Raj',
        estimated_prep_time: 5,
      },
    ],
  });

  const res = await makeRequest('/api/v1/kds/orders');
  assert.equal(res.status, 200);
  assert.equal(res.data.orders.length, 1);
  assert.equal(res.data.orders[0].id, 5);
  assert.equal(res.data.orders[0].table_number, 2);
  assert.equal(res.data.orders[0].customer_name, 'Alice');
  assert.equal(res.data.orders[0].subtotal, '240.00');
  assert.equal(res.data.orders[0].total, '252.00');
  assert.equal(typeof res.data.orders[0].subtotal, 'string');
  assert.equal(res.data.orders[0].items.length, 1);
  assert.equal(res.data.orders[0].items[0].product_name, 'Espresso');
  assert.equal(res.data.orders[0].items[0].category_color, '#FFD54F');
  assert.equal(res.data.orders[0].items[0].category_name, 'Coffee');
  assert.equal(res.data.orders[0].items[0].line_total, '240.00');
  assert.equal(typeof res.data.orders[0].items[0].line_total, 'string');
  assert.equal(res.data.orders[0].items[0].estimated_prep_time, 5);
});

test('GET /kds/orders only returns status=sent orders and show_on_kds=true items', async (t) => {
  setupMocks(t);
  let capturedSql = '';
  globalThis.mockQuery = async (sql) => {
    capturedSql = sql;
    return { rows: [] };
  };

  await makeRequest('/api/v1/kds/orders');

  assert.ok(capturedSql.includes("o.status = 'sent'"));
  assert.ok(capturedSql.includes('pr.show_on_kds = TRUE'));
});

test('GET /kds/orders search, product_id, and category_id filters combine with AND', async (t) => {
  setupMocks(t);
  let capturedSql = '';
  let capturedParams = [];
  globalThis.mockQuery = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return { rows: [] };
  };

  // Single filters
  await makeRequest('/api/v1/kds/orders?search=Espresso');
  assert.ok(capturedSql.includes('pr_s.name ILIKE $1'));
  assert.equal(capturedParams[0], '%Espresso%');

  await makeRequest('/api/v1/kds/orders?product_id=42');
  assert.ok(capturedSql.includes('oi_p.product_id = $1'));
  assert.equal(capturedParams[0], 42);

  await makeRequest('/api/v1/kds/orders?category_id=5');
  assert.ok(capturedSql.includes('pr_c.category_id = $1'));
  assert.equal(capturedParams[0], 5);

  // Combined AND filters
  await makeRequest('/api/v1/kds/orders?search=Espresso&product_id=42&category_id=5');
  assert.ok(capturedSql.includes('pr_s.name ILIKE $1'));
  assert.ok(capturedSql.includes('oi_p.product_id = $2'));
  assert.ok(capturedSql.includes('pr_c.category_id = $3'));
  assert.equal(capturedParams[0], '%Espresso%');
  assert.equal(capturedParams[1], 42);
  assert.equal(capturedParams[2], 5);
});

test('GET /kds/orders returns unit_price as a string', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async () => ({
    rows: [
      {
        order_id: 5,
        order_type: 'dine_in',
        order_status: 'sent',
        table_id: 3,
        table_number: 2,
        session_id: 1,
        customer_id: 8,
        customer_name: 'Alice',
        order_created_at: new Date('2024-06-13T10:30:00.000Z'),
        subtotal: '240.00',
        tax_total: '12.00',
        discount_total: '0.00',
        tip: '0.00',
        total: '252.00',
        item_id: 1,
        product_id: 1,
        product_name: 'Espresso',
        category_id: 1,
        category_name: 'Coffee',
        category_color: '#FFD54F',
        quantity: 2,
        unit_price: 120, // number from DB mock
        line_total: '240.00',
        kds_status: 'to_cook',
        is_item_completed: false,
        assigned_cook_id: 1,
        assigned_cook_name: 'Chef Raj',
        estimated_prep_time: 5,
      },
    ],
  });

  const res = await makeRequest('/api/v1/kds/orders');
  assert.equal(res.status, 200);
  assert.equal(res.data.orders[0].items[0].unit_price, '120.00');
});

// ─── PUT /kds/orders/:id/stage tests ──────────────────────────────────────────

test('PUT /kds/orders/:id/stage advances mixed to_cook+preparing to preparing', async (t) => {
  setupMocks(t);
  let capturedUpdate = null;
  let capturedEmit = null;

  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('SELECT') && sql.includes('orders o')) {
      return {
        rows: [
          { order_id: 5, order_status: 'sent', kds_status: 'to_cook' },
          { order_id: 5, order_status: 'sent', kds_status: 'preparing' },
        ],
      };
    }
    if (sql.includes('UPDATE order_items')) {
      capturedUpdate = params;
      return { rows: [] };
    }
    return { rows: [] };
  };

  globalThis.mockEmitStageUpdated = (orderId, newStage) => {
    capturedEmit = { orderId, newStage };
  };

  const res = await makeRequest('/api/v1/kds/orders/5/stage', 'PUT');

  assert.equal(res.status, 200);
  assert.equal(res.data.order_id, 5);
  assert.equal(res.data.kds_status, 'preparing');
  assert.equal(capturedUpdate[0], 'preparing');
  assert.deepEqual(capturedEmit, { orderId: 5, newStage: 'preparing' });
});

test('PUT /kds/orders/:id/stage advances to_cook-only to preparing', async (t) => {
  setupMocks(t);
  let capturedUpdate = null;

  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('SELECT') && sql.includes('orders o')) {
      return {
        rows: [
          { order_id: 5, order_status: 'sent', kds_status: 'to_cook' },
        ],
      };
    }
    if (sql.includes('UPDATE order_items')) {
      capturedUpdate = params;
      return { rows: [] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/kds/orders/5/stage', 'PUT');

  assert.equal(res.status, 200);
  assert.equal(res.data.kds_status, 'preparing');
  assert.equal(capturedUpdate[0], 'preparing');
});

test('PUT /kds/orders/:id/stage advances preparing-only to completed', async (t) => {
  setupMocks(t);
  let capturedUpdate = null;

  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('SELECT') && sql.includes('orders o')) {
      return {
        rows: [
          { order_id: 5, order_status: 'sent', kds_status: 'preparing' },
        ],
      };
    }
    if (sql.includes('UPDATE order_items')) {
      capturedUpdate = params;
      return { rows: [] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/kds/orders/5/stage', 'PUT');

  assert.equal(res.status, 200);
  assert.equal(res.data.kds_status, 'completed');
  assert.equal(capturedUpdate[0], 'completed');
});

test('PUT /kds/orders/:id/stage returns 409 on already-completed order', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql) => {
    if (sql.includes('SELECT') && sql.includes('orders o')) {
      return {
        rows: [
          { order_id: 5, order_status: 'sent', kds_status: 'completed' },
        ],
      };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/kds/orders/5/stage', 'PUT');

  assert.equal(res.status, 409);
  assert.equal(res.data.error.code, 'ALREADY_COMPLETED');
});

test('PUT /kds/orders/:id/stage returns 409 on non-sent order', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql) => {
    if (sql.includes('SELECT') && sql.includes('orders o')) {
      return {
        rows: [
          { order_id: 5, order_status: 'draft', kds_status: 'to_cook' },
        ],
      };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/kds/orders/5/stage', 'PUT');

  assert.equal(res.status, 409);
  assert.equal(res.data.error.code, 'ORDER_NOT_SENT');
});

// ─── PUT /kds/items/:id/complete tests ────────────────────────────────────────

test('PUT /kds/items/:id/complete completes target item and emits item completed', async (t) => {
  setupMocks(t);
  let capturedUpdate = null;
  let capturedEmit = null;

  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('UPDATE order_items') && sql.includes('is_item_completed = TRUE')) {
      capturedUpdate = params;
      return { rows: [{ order_id: 10 }] };
    }
    return { rows: [] };
  };

  globalThis.mockEmitItemCompleted = (orderId, itemId) => {
    capturedEmit = { orderId, itemId };
  };

  const res = await makeRequest('/api/v1/kds/items/123/complete', 'PUT');

  assert.equal(res.status, 200);
  assert.equal(res.data.item_id, 123);
  assert.equal(res.data.is_item_completed, true);
  assert.equal(capturedUpdate[0], 123);
  assert.deepEqual(capturedEmit, { orderId: 10, itemId: 123 });
});
