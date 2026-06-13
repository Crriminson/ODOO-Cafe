import assert from 'node:assert/strict';
import { test } from 'node:test';

const createTransactionClient = (t, workloadRows, updateLog, options = {}) => ({
  query: async (text, params) => {
    if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
      return {};
    }

    if (text.includes('COUNT(*)::int AS workload')) {
      return { rows: workloadRows };
    }

    if (text.includes('UPDATE order_items')) {
      if (options.failOnUpdate) {
        throw new Error('update failed');
      }

      updateLog.push(params);
      return { rows: [] };
    }

    throw new Error(`Unexpected client query: ${text}`);
  },
  release: t.mock.fn(() => {}),
});

const loadModule = async (t, namedExports) => {
  t.mock.module('../config/db.js', { namedExports });
  return import(`./cookAllocation.service.js?test=${encodeURIComponent(t.name)}`);
};

test('assignCooks returns empty assignments when there are no KDS items', async (t) => {
  const getClientMock = t.mock.fn(async () => {
    throw new Error('getClient should not be called');
  });
  const { assignCooks } = await loadModule(t, {
    query: async () => ({ rows: [] }),
    getClient: getClientMock,
  });

  const result = await assignCooks(10);

  assert.deepEqual(result, { assignments: [] });
  assert.equal(getClientMock.mock.calls.length, 0);
});

test('assignCooks returns empty assignments when there are no active cooks', async (t) => {
  let callCount = 0;
  const { assignCooks } = await loadModule(t, {
    query: async () => {
      callCount += 1;

      if (callCount === 1) {
        return { rows: [{ item_id: 1, category_id: 5 }] };
      }

      return { rows: [] };
    },
  });

  const result = await assignCooks(10);

  assert.deepEqual(result, { assignments: [] });
});

test('assignCooks prefers a category match when scores are otherwise close', async (t) => {
  let callCount = 0;
  const updates = [];

  const { assignCooks } = await loadModule(t, {
    query: async () => {
      callCount += 1;

      if (callCount === 1) {
        return { rows: [{ item_id: 77, category_id: 3 }] };
      }

      return {
        rows: [
          { id: 1, name: 'Cook A', category_id: 3 },
          { id: 2, name: 'Cook B', category_id: null },
        ],
      };
    },
    getClient: async () =>
      createTransactionClient(
        t,
        [
          { cook_id: 1, workload: 2 },
          { cook_id: 2, workload: 1 },
        ],
        updates
      ),
  });

  const result = await assignCooks(55);

  assert.deepEqual(result, {
    assignments: [{ item_id: 77, cook_id: 1, cook_name: 'Cook A' }],
  });
  assert.deepEqual(updates, [[1, 77]]);
});

test('assignCooks breaks score ties by lowest workload', async (t) => {
  let callCount = 0;
  const updates = [];

  const { assignCooks } = await loadModule(t, {
    query: async () => {
      callCount += 1;

      if (callCount === 1) {
        return { rows: [{ item_id: 88, category_id: 9 }] };
      }

      return {
        rows: [
          { id: 1, name: 'Cook A', category_id: null },
          { id: 2, name: 'Cook B', category_id: 9 },
        ],
      };
    },
    getClient: async () =>
      createTransactionClient(
        t,
        [
          { cook_id: 1, workload: 2 },
          { cook_id: 2, workload: 4 },
        ],
        updates
      ),
  });

  const result = await assignCooks(55);

  assert.deepEqual(result, {
    assignments: [{ item_id: 88, cook_id: 1, cook_name: 'Cook A' }],
  });
  assert.deepEqual(updates, [[1, 88]]);
});

test('assignCooks breaks remaining ties by lowest cook id', async (t) => {
  let callCount = 0;
  const updates = [];

  const { assignCooks } = await loadModule(t, {
    query: async () => {
      callCount += 1;

      if (callCount === 1) {
        return { rows: [{ item_id: 99, category_id: 4 }] };
      }

      return {
        rows: [
          { id: 3, name: 'Cook C', category_id: 4 },
          { id: 2, name: 'Cook B', category_id: 4 },
        ],
      };
    },
    getClient: async () =>
      createTransactionClient(
        t,
        [
          { cook_id: 2, workload: 1 },
          { cook_id: 3, workload: 1 },
        ],
        updates
      ),
  });

  const result = await assignCooks(55);

  assert.deepEqual(result, {
    assignments: [{ item_id: 99, cook_id: 2, cook_name: 'Cook B' }],
  });
  assert.deepEqual(updates, [[2, 99]]);
});

test('assignCooks returns the full assignment array and executes DB updates', async (t) => {
  let callCount = 0;
  const updates = [];
  const { assignCooks } = await loadModule(t, {
    query: async () => {
      callCount += 1;

      if (callCount === 1) {
        return {
          rows: [
            { item_id: 1, category_id: 10 },
            { item_id: 2, category_id: 11 },
          ],
        };
      }

      return {
        rows: [
          { id: 5, name: 'Cook E', category_id: 10 },
          { id: 5, name: 'Cook E', category_id: 11 },
        ],
      };
    },
    getClient: async () =>
      createTransactionClient(t, [{ cook_id: 5, workload: 0 }], updates),
  });

  const result = await assignCooks(55);

  assert.deepEqual(result, {
    assignments: [
      { item_id: 1, cook_id: 5, cook_name: 'Cook E' },
      { item_id: 2, cook_id: 5, cook_name: 'Cook E' },
    ],
  });
  assert.deepEqual(updates, [
    [5, 1],
    [5, 2],
  ]);
});
