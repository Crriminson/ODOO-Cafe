import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';

const clientMock = {
  query: async (sql, params) => {
    if (globalThis.mockQuery) {
      return globalThis.mockQuery(sql, params);
    }
    return { rows: [] };
  },
  release: () => {},
};

const setupMocks = (t) => {
  const knexMock = (() => {
    const createTrx = () => {
      const trx = new Proxy(function() {}, {
        get(target, prop) {
          if (prop === 'commit' || prop === 'rollback') {
            return () => Promise.resolve();
          }
          const builder = new Proxy(function() {}, {
            get(t, p) {
              if (p === 'then') {
                return (resolve) => resolve([]);
              }
              return builder;
            },
            apply(t, thisArg, args) {
              return builder;
            }
          });
          return builder;
        },
        apply(target, thisArg, args) {
          const builder = new Proxy(function() {}, {
            get(t, p) {
              if (p === 'then') {
                return (resolve) => resolve([]);
              }
              return builder;
            },
            apply(t, thisArg, args) {
              return builder;
            }
          });
          return builder;
        }
      });
      return trx;
    };

    const handler = {
      get(target, prop) {
        if (prop === 'transaction') {
          const trx = createTrx();
          const transactionFn = () => trx;
          transactionFn.then = (resolve) => resolve(trx);
          return transactionFn;
        }
        if (prop === 'then') {
          return (resolve) => resolve([]);
        }
        return new Proxy(function() {}, handler);
      },
      apply(target, thisArg, args) {
        return new Proxy(function() {}, handler);
      }
    };
    return new Proxy(function() {}, handler);
  })();

  // Mock DB query & client (for transactions)
  const dbMock = {
    namedExports: {
      query: async (sql, params) => {
        if (globalThis.mockQuery) {
          return globalThis.mockQuery(sql, params);
        }
        return { rows: [] };
      },
      getClient: async () => {
        return clientMock;
      },
      db: knexMock,
    },
  };
  t.mock.module('../config/db.js', dbMock);

  // Mock JWT verification
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
      emitNewOrder: (...args) => globalThis.mockEmitNewOrder ? globalThis.mockEmitNewOrder(...args) : undefined,
      emitOrderPaid: (...args) => globalThis.mockEmitOrderPaid ? globalThis.mockEmitOrderPaid(...args) : undefined,
      emitCookAssigned: (...args) => globalThis.mockEmitCookAssigned ? globalThis.mockEmitCookAssigned(...args) : undefined,
      emitStageUpdated: (...args) => globalThis.mockEmitStageUpdated ? globalThis.mockEmitStageUpdated(...args) : undefined,
      emitItemCompleted: (...args) => globalThis.mockEmitItemCompleted ? globalThis.mockEmitItemCompleted(...args) : undefined,
    },
  });

  t.mock.module('../db/queries/orders.queries.js', {
    namedExports: {
      payOrder: async (orderId, paymentDetails) => {
        if (globalThis.mockPayOrder) {
          return globalThis.mockPayOrder(orderId, paymentDetails);
        }
        return {
          order: { id: orderId, status: 'paid' },
          change_due: '0.00',
        };
      },
      getOrders: (...args) => globalThis.mockGetOrders ? globalThis.mockGetOrders(...args) : ({ rows: [] }),
      createOrder: (...args) => globalThis.mockCreateOrder ? globalThis.mockCreateOrder(...args) : ({ rows: [] }),
      getOrderById: (...args) => globalThis.mockGetOrderById ? globalThis.mockGetOrderById(...args) : ({ rows: [] }),
      updateOrder: (...args) => globalThis.mockUpdateOrder ? globalThis.mockUpdateOrder(...args) : ({ rows: [] }),
      sendOrderToKitchen: (...args) => globalThis.mockSendOrderToKitchen ? globalThis.mockSendOrderToKitchen(...args) : ({ rows: [] }),
      deleteOrder: (...args) => globalThis.mockDeleteOrder ? globalThis.mockDeleteOrder(...args) : ({ rows: [] }),
    },
  });
};

const makeRequest = async (path, method = 'GET', body = null, token = 'admin_token') => {
  // Bust ESM cache dynamically to load clean mocks
  const { default: app } = await import(`../app.js?test=${Date.now()}_${Math.random()}`);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const headers = {};
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`http://localhost:${port}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, data };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

// ─── Customer Tests ──────────────────────────────────────────────────────────

test('GET /customers?search= matches name, email, and phone independently', async (t) => {
  setupMocks(t);
  const searchParams = [];
  globalThis.mockQuery = async (sql, params) => {
    searchParams.push(params[0]);
    // Verify that query uses OR logic for 3-field search
    assert.ok(sql.includes('name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1'));
    return {
      rows: [
        {
          id: 101,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123456',
          address: 'Main St',
          loyalty_points: '15',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
  };

  const resName = await makeRequest('/api/v1/customers?search=John', 'GET', null, 'employee_token');
  const resEmail = await makeRequest('/api/v1/customers?search=john@example.com', 'GET', null, 'employee_token');
  const resPhone = await makeRequest('/api/v1/customers?search=123456', 'GET', null, 'employee_token');

  assert.equal(resName.status, 200);
  assert.equal(resEmail.status, 200);
  assert.equal(resPhone.status, 200);
  assert.deepEqual(searchParams, ['%John%', '%john@example.com%', '%123456%']);

  // Assert loyalty_points is returned as an integer, not string/float
  const firstCustomer = resName.data.customers[0];
  assert.equal(typeof firstCustomer.loyalty_points, 'number');
  assert.equal(Number.isInteger(firstCustomer.loyalty_points), true);
  assert.equal(firstCustomer.loyalty_points, 15);
});

test('GET /customers/:id open to any authenticated role and returns integer loyalty_points', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql, params) => {
    return {
      rows: [
        {
          id: 101,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123456',
          address: 'Main St',
          loyalty_points: '20',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };
  };

  const res = await makeRequest('/api/v1/customers/101', 'GET', null, 'employee_token');
  assert.equal(res.status, 200);
  assert.equal(res.data.customer.id, 101);
  
  // Assert loyalty_points is returned as an integer
  assert.equal(typeof res.data.customer.loyalty_points, 'number');
  assert.equal(Number.isInteger(res.data.customer.loyalty_points), true);
  assert.equal(res.data.customer.loyalty_points, 20);
});

test('POST /customers and PUT /customers/:id support nullable fields (email, phone, address)', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('INSERT INTO customers')) {
      return {
        rows: [
          {
            id: 102,
            name: 'Nullable Doe',
            email: null,
            phone: null,
            address: null,
            loyalty_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };
    }
    if (sql.includes('cooks') || (sql.includes('SELECT') && sql.includes('id = $1'))) {
      return {
        rows: [
          {
            id: 102,
            name: 'Nullable Doe',
            email: null,
            phone: null,
            address: null,
            loyalty_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };
    }
    if (sql.includes('UPDATE customers')) {
      return {
        rows: [
          {
            id: 102,
            name: 'Updated Nullable Doe',
            email: null,
            phone: null,
            address: null,
            loyalty_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };
    }
    return { rows: [] };
  };

  // Create with nulls
  const createRes = await makeRequest('/api/v1/customers', 'POST', {
    name: 'Nullable Doe',
    email: null,
    phone: null,
    address: null,
  });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.customer.email, null);
  assert.equal(createRes.data.customer.phone, null);
  assert.equal(createRes.data.customer.address, null);

  // Update with nulls
  const updateRes = await makeRequest('/api/v1/customers/102', 'PUT', {
    name: 'Updated Nullable Doe',
    email: null,
    phone: null,
    address: null,
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.customer.email, null);
  assert.equal(updateRes.data.customer.phone, null);
  assert.equal(updateRes.data.customer.address, null);
});

test('POST /customers returns 409 EMAIL_EXISTS if email already exists', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('LOWER(email) = LOWER($1)')) {
      return { rows: [{ id: 50, email: 'john@example.com' }] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/customers', 'POST', {
    name: 'New John',
    email: 'john@example.com',
  });
  assert.equal(res.status, 409);
  assert.equal(res.data.error.code, 'EMAIL_EXISTS');
});

test('PUT /customers/:id returns 404 NOT_FOUND if customer does not exist', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql, params) => {
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/customers/999', 'PUT', {
    name: 'Ghost User',
  });
  assert.equal(res.status, 404);
  assert.equal(res.data.error.code, 'NOT_FOUND');
});

test('DELETE /customers/:id returns 404 NOT_FOUND if customer does not exist', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql, params) => {
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/customers/999', 'DELETE');
  assert.equal(res.status, 404);
  assert.equal(res.data.error.code, 'NOT_FOUND');
});

test('DELETE /customers/:id hard deletes from database', async (t) => {
  setupMocks(t);
  let deleteCalled = false;
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('customers') && sql.includes('id = $1') && (sql.includes('SELECT') || sql.includes('select'))) {
      return { rows: [{ id: 101, name: 'John' }] };
    }
    if (sql.includes('DELETE FROM customers') || sql.includes('delete from customers')) {
      deleteCalled = true;
      return { rows: [{ id: 101 }] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/customers/101', 'DELETE');
  assert.equal(res.status, 200);
  assert.equal(deleteCalled, true);
});

// ─── Cooks Tests ─────────────────────────────────────────────────────────────

test('GET /cooks resolves category preferences to full objects', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('FROM cooks')) {
      return {
        rows: [{ id: 1, name: 'Chef Raj', is_active: true }],
      };
    }
    if (sql.includes('FROM categories')) {
      return {
        rows: [{ id: 5, name: 'Coffee', color: '#3E2723' }],
      };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/cooks', 'GET', null, 'employee_token');
  assert.equal(res.status, 200);
  assert.equal(res.data.cooks.length, 1);
  assert.equal(res.data.cooks[0].category_preferences.length, 1);
  assert.equal(res.data.cooks[0].category_preferences[0].name, 'Coffee');
});

test('PUT /cooks/:id replaces preferences in join table and updates cook', async (t) => {
  setupMocks(t);
  let deletePreferencesCalled = false;
  let insertPreferenceCalled = false;

  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('cooks') && sql.includes('id = $1') && (sql.includes('SELECT') || sql.includes('select'))) {
      return { rows: [{ id: 1, name: 'Chef Raj', is_active: true }] };
    }
    if (sql.includes('DELETE FROM cook_category_preferences') || sql.includes('delete from cook_category_preferences')) {
      deletePreferencesCalled = true;
      return { rows: [] };
    }
    if (sql.includes('INSERT INTO cook_category_preferences') || sql.includes('insert into cook_category_preferences')) {
      insertPreferenceCalled = true;
      return { rows: [] };
    }
    if (sql.includes('UPDATE cooks') || sql.includes('update cooks')) {
      return { rows: [{ id: 1, name: 'Chef Raj New', is_active: true }] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/cooks/1', 'PUT', {
    name: 'Chef Raj New',
    category_preferences: [10],
  }, 'admin_token');

  assert.equal(res.status, 200);
  assert.equal(deletePreferencesCalled, true);
  assert.equal(insertPreferenceCalled, true);
});

test('DELETE /cooks/:id soft deletes (sets is_active = false)', async (t) => {
  setupMocks(t);
  let updateCalled = false;
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('cooks') && sql.includes('id = $1') && (sql.includes('SELECT') || sql.includes('select'))) {
      return { rows: [{ id: 1, name: 'Chef Raj', is_active: true }] };
    }
    if (sql.includes('UPDATE cooks SET is_active = FALSE') || sql.includes('update cooks set is_active = false') || sql.includes('is_active = FALSE') || sql.includes('is_active = false')) {
      updateCalled = true;
      return { rows: [{ id: 1, name: 'Chef Raj', is_active: false }] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/cooks/1', 'DELETE', null, 'admin_token');
  assert.equal(res.status, 200);
  assert.equal(updateCalled, true);
});

test('Cook writes restrict to admin (return 403 on employee)', async (t) => {
  setupMocks(t);
  const res = await makeRequest('/api/v1/cooks', 'POST', { name: 'Priya' }, 'employee_token');
  assert.equal(res.status, 403);
});
