import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import crypto from 'crypto';

import Razorpay from 'razorpay';

// Prototype monkey-patch for --test-isolation=none caching issues
try {
  const dummyInstance = new Razorpay({ key_id: 'dummy', key_secret: 'dummy' });
  const ApiClass = dummyInstance.api.constructor;
  ApiClass.prototype.post = async function(options, callback) {
    if (options.url === '/orders') {
      const payload = options.data;
      if (globalThis.mockRzpCreateOrder) {
        return globalThis.mockRzpCreateOrder(payload);
      }
      return {
        id: 'order_mock123',
        amount: payload.amount,
        currency: payload.currency,
        receipt: payload.receipt,
        notes: payload.notes,
      };
    }
    throw new Error(`Mock post called with unexpected url: ${options.url}`);
  };
} catch (err) {
  // Silent catch
}

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

  t.mock.module('../config/env.js', {
    namedExports: {
      env: {
        PORT: 5000,
        NODE_ENV: 'test',
        CLIENT_URL: 'http://localhost:5173',
        JWT: {
          secret: 'dev_fallback_secret_change_in_prod',
          expiresIn: '12h',
        },
        RAZORPAY: {
          keyId:     process.env.RAZORPAY_KEY_ID     || 'rzp_test_DUMMY_KEY_123',
          keySecret: process.env.RAZORPAY_KEY_SECRET || 'DUMMY_SECRET_XYZ',
        },
      },
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

  t.mock.module('razorpay', {
    defaultExport: class MockRazorpay {
      constructor() {
        this.orders = {
          create: async (payload) => {
            if (globalThis.mockRzpCreateOrder) {
              return globalThis.mockRzpCreateOrder(payload);
            }
            return {
              id: 'order_mock123',
              amount: payload.amount,
              currency: payload.currency,
              receipt: payload.receipt,
              notes: payload.notes,
            };
          },
        };
      }
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

test('POST /payments/razorpay/create-order returns 401 without auth', async (t) => {
  setupMocks(t);
  const res = await makeRequest('/api/v1/payments/razorpay/create-order', 'POST', {
    amount: 100,
    orderId: 1,
  }, null);
  assert.equal(res.status, 401);
});

test('POST /payments/razorpay/create-order returns 400 if missing body params', async (t) => {
  setupMocks(t);
  const res = await makeRequest('/api/v1/payments/razorpay/create-order', 'POST', {
    amount: 100,
  });
  assert.equal(res.status, 400);
  assert.equal(res.data.error.code, 'BAD_REQUEST');
});

test('POST /payments/razorpay/create-order calls Razorpay SDK and returns order details', async (t) => {
  setupMocks(t);
  let rzpCalled = false;
  globalThis.mockRzpCreateOrder = (payload) => {
    rzpCalled = true;
    assert.equal(payload.amount, 10000); // 100 INR in paise
    assert.equal(payload.receipt, 'pos_order_42');
    return { id: 'rzp_order_abc123' };
  };

  const res = await makeRequest('/api/v1/payments/razorpay/create-order', 'POST', {
    amount: 100,
    orderId: 42,
  });

  assert.equal(res.status, 200);
  assert.equal(rzpCalled, true);
  assert.equal(res.data.razorpayOrderId, 'rzp_order_abc123');
});

test('POST /payments/razorpay/verify returns 400 if signature invalid', async (t) => {
  setupMocks(t);
  const res = await makeRequest('/api/v1/payments/razorpay/verify', 'POST', {
    razorpayOrderId: 'rzp_order_abc123',
    razorpayPaymentId: 'rzp_pay_xyz',
    razorpaySignature: 'bad_signature',
    posOrderId: 42,
  });

  assert.equal(res.status, 400);
  assert.equal(res.data.error.code, 'RZP_SIG_INVALID');
});

test('POST /payments/razorpay/verify processes signature, completes payment, and triggers KDS emitter', async (t) => {
  setupMocks(t);

  const { env } = await import('../config/env.js');
  const keySecret = env.RAZORPAY.keySecret;
  const orderId = 'rzp_order_abc123';
  const paymentId = 'rzp_pay_xyz';
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  const signature = hmac.digest('hex');

  let payOrderCalled = false;
  let emitOrderPaidCalled = false;

  globalThis.mockPayOrder = async (posOrderId, paymentDetails) => {
    payOrderCalled = true;
    assert.equal(posOrderId, 42);
    assert.equal(paymentDetails.method, 'card');
    assert.equal(paymentDetails.transactionReference, paymentId);
    return {
      order: { id: 42, status: 'paid' },
      change_due: '0.00',
    };
  };

  globalThis.mockEmitOrderPaid = (posOrderId) => {
    emitOrderPaidCalled = true;
    assert.equal(posOrderId, 42);
  };

  const res = await makeRequest('/api/v1/payments/razorpay/verify', 'POST', {
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
    posOrderId: 42,
    couponCode: 'SAVE10',
    loyaltyPointsToRedeem: 10,
  });

  assert.equal(res.status, 200);
  assert.equal(payOrderCalled, true);
  assert.equal(emitOrderPaidCalled, true);
  assert.equal(res.data.success, true);
  assert.equal(res.data.paymentId, paymentId);
});
