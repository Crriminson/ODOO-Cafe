import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';

const setupMocks = (t) => {
  // Mock DB query
  const dbMock = {
    namedExports: {
      query: async (sql, params) => {
        if (globalThis.mockQuery) {
          return globalThis.mockQuery(sql, params);
        }
        return { rows: [] };
      },
      getClient: async () => ({
        query: async (sql, params) => {
          if (globalThis.mockQuery) {
            return globalThis.mockQuery(sql, params);
          }
          return { rows: [] };
        },
        release: () => {},
      }),
    },
  };
  t.mock.module('../config/db.js', dbMock);

  // Mock JWT verification and signing
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

const makeRequest = async (path, method = 'GET', body = null, token = 'admin_token') => {
  // Bust ESM cache dynamically to load clean mocks
  const { default: app } = await import(`../app.js?test=${Date.now()}_${Math.random()}`);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  try {
    const headers = { 'Content-Type': 'application/json' };
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

// ─── Coupons Tests ───────────────────────────────────────────────────────────

test('GET /coupons returns 200 with coupons key and string values', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async () => ({
    rows: [
      {
        id: 1,
        code: 'SALE10',
        discount_type: 'percentage',
        discount_value: 10,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  });

  const res = await makeRequest('/api/v1/coupons');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.coupons));
  assert.equal(res.data.coupons[0].discount_value, '10.00');
});

test('POST /coupons handles case-insensitive duplicates with 409 CODE_EXISTS', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async (sql) => {
    if (sql.includes('INSERT INTO coupons')) {
      const err = new Error('Duplicate key');
      err.code = '23505';
      throw err;
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/coupons', 'POST', {
    code: 'sale10',
    discount_type: 'percentage',
    discount_value: 10,
  });

  assert.equal(res.status, 409);
  assert.equal(res.data.error.code, 'CODE_EXISTS');
});

test('DELETE /coupons/:id hard-deletes from DB', async (t) => {
  setupMocks(t);
  let capturedSql = '';
  let capturedParams = [];
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('DELETE FROM coupons')) {
      capturedSql = sql;
      capturedParams = params;
      return { rows: [{ id: 5 }] };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/coupons/5', 'DELETE');
  assert.equal(res.status, 200);
  assert.equal(res.data.message, 'Coupon deleted successfully');
  assert.ok(capturedSql.includes('DELETE FROM coupons'));
  assert.equal(capturedParams[0], 5);
});

// ─── Promotions Tests ────────────────────────────────────────────────────────

test('POST /promotions missing product_id when applies_to=product returns 422', async (t) => {
  setupMocks(t);
  const res = await makeRequest('/api/v1/promotions', 'POST', {
    name: 'Buy 2 Get 10% Off',
    applies_to: 'product',
    min_quantity: 2,
    discount_type: 'percentage',
    discount_value: 10,
  });

  assert.equal(res.status, 422);
  assert.equal(res.data.error.code, 'VALIDATION_ERROR');
  assert.ok(res.data.error.fields.some((f) => f.field === 'product_id'));
});

test('POST /promotions populates rules column', async (t) => {
  setupMocks(t);
  let capturedRules = null;
  globalThis.mockQuery = async (sql, params) => {
    if (sql.includes('INSERT INTO promotions')) {
      capturedRules = params[7];
      return {
        rows: [
          {
            id: 1,
            name: params[0],
            applies_to: params[1],
            product_id: params[2],
            min_quantity: params[3],
            min_order_amount: params[4],
            discount_type: params[5],
            discount_value: params[6],
            rules: params[7],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      };
    }
    return { rows: [] };
  };

  const res = await makeRequest('/api/v1/promotions', 'POST', {
    name: 'Buy 2 Get 10% Off',
    applies_to: 'product',
    product_id: 1,
    min_quantity: 2,
    discount_type: 'percentage',
    discount_value: 10,
  });

  assert.equal(res.status, 201);
  assert.ok(capturedRules !== null);
  assert.equal(capturedRules.applies_to, 'product');
  assert.equal(capturedRules.product_id, 1);
});

test('GET /promotions?is_active=true filters correctly in DB query', async (t) => {
  setupMocks(t);
  let capturedParams = [];
  globalThis.mockQuery = async (sql, params) => {
    capturedParams = params;
    return { rows: [] };
  };

  await makeRequest('/api/v1/promotions?is_active=true');
  assert.equal(capturedParams[0], true);
});

// ─── General Auth & Error Handling Tests ──────────────────────────────────────

test('non-admin token returns 403 on writes for both resources', async (t) => {
  setupMocks(t);

  // POST coupon as employee
  let res = await makeRequest(
    '/api/v1/coupons',
    'POST',
    {
      code: 'SALE10',
      discount_type: 'percentage',
      discount_value: 10,
    },
    'employee_token'
  );
  assert.equal(res.status, 403);
  assert.equal(res.data.error.code, 'FORBIDDEN');

  // PUT promotion as employee
  res = await makeRequest(
    '/api/v1/promotions/1',
    'PUT',
    {
      name: 'Updated Name',
    },
    'employee_token'
  );
  assert.equal(res.status, 403);
  assert.equal(res.data.error.code, 'FORBIDDEN');
});

test('PUT/DELETE of nonexistent coupon returns 404', async (t) => {
  setupMocks(t);
  globalThis.mockQuery = async () => ({ rows: [] });

  let res = await makeRequest('/api/v1/coupons/999', 'PUT', {
    code: 'SALE10',
  });
  assert.equal(res.status, 404);
  assert.equal(res.data.error.code, 'NOT_FOUND');

  res = await makeRequest('/api/v1/coupons/999', 'DELETE');
  assert.equal(res.status, 404);
  assert.equal(res.data.error.code, 'NOT_FOUND');
});
