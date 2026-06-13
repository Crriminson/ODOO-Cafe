import assert from 'node:assert/strict';
import { test } from 'node:test';

const loadModule = async (t, namedExports) => {
  t.mock.module('../config/db.js', { namedExports });
  return import(`./loyalty.service.js?test=${encodeURIComponent(t.name)}`);
};

test('redeemPoints redeems successfully', async (t) => {
  const calls = [];
  const client = {
    query: async (text, params) => {
      calls.push({ text, params });

      if (text === 'BEGIN' || text === 'COMMIT') {
        return {};
      }

      if (text === 'ROLLBACK') {
        throw new Error('ROLLBACK should not be called');
      }

      if (text.includes('SELECT loyalty_points')) {
        return { rows: [{ loyalty_points: 120 }] };
      }

      return { rows: [] };
    },
    release: t.mock.fn(() => {}),
  };

  const { redeemPoints } = await loadModule(t, {
    getClient: async () => client,
  });

  const result = await redeemPoints(9, 40, 99);

  assert.deepEqual(result, {
    discountAmount: '40.00',
    newBalance:     80,
  });

  assert.equal(calls[1].params[0], 9);
  assert.deepEqual(calls[2].params, [40, 9]);
  assert.deepEqual(calls[3].params, [9, 99, 40]);
});

test('redeemPoints throws insufficient loyalty points with the expected code', async (t) => {
  const calls = [];
  const client = {
    query: async (text) => {
      calls.push(text);

      if (text === 'BEGIN' || text === 'ROLLBACK') {
        return {};
      }

      if (text.includes('SELECT loyalty_points')) {
        return { rows: [{ loyalty_points: 10 }] };
      }

      return {};
    },
    release: t.mock.fn(() => {}),
  };

  const { redeemPoints } = await loadModule(t, {
    getClient: async () => client,
  });

  await assert.rejects(
    () => redeemPoints(1, 25, 4),
    (error) => error.code === 'INSUFFICIENT_LOYALTY_POINTS'
  );

  assert.ok(calls.includes('ROLLBACK'));
});

test('redeemPoints rolls back the transaction when a write fails', async (t) => {
  const calls = [];
  const client = {
    query: async (text) => {
      calls.push(text);

      if (text === 'BEGIN' || text === 'ROLLBACK') {
        return {};
      }

      if (text.includes('SELECT loyalty_points')) {
        return { rows: [{ loyalty_points: 50 }] };
      }

      if (text.includes('UPDATE customers')) {
        throw new Error('update failed');
      }

      return {};
    },
    release: t.mock.fn(() => {}),
  };

  const { redeemPoints } = await loadModule(t, {
    getClient: async () => client,
  });

  await assert.rejects(() => redeemPoints(1, 20, 7), /update failed/);
  assert.ok(calls.includes('ROLLBACK'));
  assert.equal(calls.includes('COMMIT'), false);
});

test('creditPoints returns null immediately when customerId is null', async (t) => {
  const queryMock = t.mock.fn(async () => {
    throw new Error('query should not be called');
  });
  const { creditPoints } = await loadModule(t, { query: queryMock });

  const result = await creditPoints(null, '100.00', 8);

  assert.equal(result, null);
  assert.equal(queryMock.mock.calls.length, 0);
});

test('creditPoints earns points correctly', async (t) => {
  const calls = [];
  const query = async (text, params) => {
    calls.push({ text, params });

    if (text.includes("WHERE key = 'loyalty_points_rate'")) {
      return { rows: [{ value: '10' }] };
    }

    if (text.includes('UPDATE customers')) {
      return { rows: [{ loyalty_points: 16 }] };
    }

    if (text.includes('INSERT INTO loyalty_transactions')) {
      return { rows: [] };
    }

    throw new Error(`Unexpected query: ${text}`);
  };
  const { creditPoints } = await loadModule(t, { query });

  const result = await creditPoints(5, '125.00', 44);

  assert.deepEqual(result, {
    pointsEarned: 12,
    newBalance:   16,
  });
  assert.deepEqual(calls[1].params, [12, 5]);
  assert.deepEqual(calls[2].params, [5, 44, 12]);
});

test('creditPoints skips the transaction insert when no points are earned', async (t) => {
  const calls = [];
  const query = async (text) => {
    calls.push(text);

    if (text.includes("WHERE key = 'loyalty_points_rate'")) {
      return { rows: [{ value: '10' }] };
    }

    if (text.includes('UPDATE customers')) {
      return { rows: [{ loyalty_points: 3 }] };
    }

    throw new Error(`Unexpected query: ${text}`);
  };
  const { creditPoints } = await loadModule(t, { query });

  const result = await creditPoints(5, '9.00', 44);

  assert.deepEqual(result, {
    pointsEarned: 0,
    newBalance:   3,
  });
  assert.equal(
    calls.some((text) => text.includes('INSERT INTO loyalty_transactions')),
    false
  );
});
