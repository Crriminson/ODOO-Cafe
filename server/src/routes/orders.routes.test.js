import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';

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

  t.mock.module('../config/db.js', {
    namedExports: {
      query: async () => ({ rows: [] }),
      getClient: async () => ({
        query: async () => ({ rows: [] }),
        release: () => {},
      }),
      db: knexMock,
    },
  });

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
          change_due: '10.00',
        };
      },
      getOrders: () => ({ rows: [] }),
      createOrder: () => ({ rows: [] }),
      getOrderById: () => ({ rows: [] }),
      updateOrder: () => ({ rows: [] }),
      sendOrderToKitchen: () => ({ rows: [] }),
      deleteOrder: () => ({ rows: [] }),
    },
  });
};

const makeRequest = async (path, method = 'GET', body = null, token = 'employee_token') => {
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

test('POST /orders/:id/pay returns 401 without auth', async (t) => {
  setupMocks(t);
  const res = await makeRequest('/api/v1/orders/1/pay', 'POST', {
    method: 'cash',
    amount: '50.00',
  }, null);
  assert.equal(res.status, 401);
});

test('POST /orders/:id/pay completes checkout, invokes emitter and returns change_due', async (t) => {
  setupMocks(t);

  let payOrderCalled = false;
  let emitOrderPaidCalled = false;

  globalThis.mockPayOrder = async (orderId, paymentDetails) => {
    payOrderCalled = true;
    assert.equal(orderId, 123);
    assert.equal(paymentDetails.method, 'cash');
    assert.equal(paymentDetails.amount, '50.00');
    assert.equal(paymentDetails.tip, '5.00');
    return {
      order: { id: 123, status: 'paid', total: '40.00' },
      change_due: '10.00',
    };
  };

  globalThis.mockEmitOrderPaid = (orderId) => {
    emitOrderPaidCalled = true;
    assert.equal(orderId, 123);
  };

  const res = await makeRequest('/api/v1/orders/123/pay', 'POST', {
    method: 'cash',
    amount: '50.00',
    tip: '5.00',
  });

  assert.equal(res.status, 200);
  assert.equal(payOrderCalled, true);
  assert.equal(emitOrderPaidCalled, true);
  assert.equal(res.data.change_due, '10.00');
  assert.equal(res.data.order.id, 123);
  assert.equal(res.data.order.status, 'paid');
});
