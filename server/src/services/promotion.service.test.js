import assert from 'node:assert/strict';
import { test } from 'node:test';

const loadModule = async (t, queryImpl) => {
  const knexMock = (() => {
    const builder = () => builder;
    builder.select = () => builder;
    builder.where = () => builder;
    builder.limit = () => builder;
    builder.orderBy = () => builder;
    builder.first = () => builder;
    builder.insert = () => builder;
    builder.returning = () => builder;
    builder.update = () => builder;
    builder.decrement = () => builder;
    builder.increment = () => builder;
    builder.del = () => builder;
    builder.then = (resolve) => resolve([]);
    return builder;
  })();

  t.mock.module('../config/db.js', {
    namedExports: {
      query: queryImpl,
      db: knexMock,
    },
  });

  return import(`./promotion.service.js?test=${encodeURIComponent(t.name)}`);
};

test('evaluatePromotions returns a matching promotion', async (t) => {
  const { evaluatePromotions } = await loadModule(t, async () => ({
    rows: [
      {
        id:             11,
        applies_to:     'product',
        product_id:     3,
        min_quantity:   2,
        discount_type:  'percentage',
        discount_value: '10.00',
      },
    ],
  }));

  const result = await evaluatePromotions({
    items: [
      {
        product_id: 3,
        quantity:   2,
        unit_price: '120.00',
        line_total: '240.00',
      },
    ],
    subtotal: '240.00',
  });

  assert.deepEqual(result, [
    {
      promotion_id:   11,
      discount_type:  'percentage',
      discount_value: '10.00',
      applied_amount: '24.00',
    },
  ]);
});

test('evaluatePromotions returns multiple matching promotions', async (t) => {
  const { evaluatePromotions } = await loadModule(t, async () => ({
    rows: [
      {
        id:               1,
        applies_to:       'product',
        product_id:       8,
        min_quantity:     2,
        min_order_amount: null,
        discount_type:    'fixed',
        discount_value:   '25.00',
      },
      {
        id:               2,
        applies_to:       'order',
        product_id:       null,
        min_quantity:     null,
        min_order_amount: '300.00',
        discount_type:    'percentage',
        discount_value:   '10.00',
      },
    ],
  }));

  const result = await evaluatePromotions({
    items: [
      {
        product_id: 8,
        quantity:   2,
        unit_price: '175.00',
        line_total: '350.00',
      },
    ],
    subtotal: '350.00',
  });

  assert.deepEqual(result, [
    {
      promotion_id:   1,
      discount_type:  'fixed',
      discount_value: '25.00',
      applied_amount: '25.00',
    },
    {
      promotion_id:   2,
      discount_type:  'percentage',
      discount_value: '10.00',
      applied_amount: '35.00',
    },
  ]);
});

test('evaluatePromotions returns an empty array when nothing matches', async (t) => {
  const { evaluatePromotions } = await loadModule(t, async () => ({
    rows: [
      {
        id:               3,
        applies_to:       'order',
        min_order_amount: '500.00',
        discount_type:    'fixed',
        discount_value:   '50.00',
      },
    ],
  }));

  const result = await evaluatePromotions({
    items: [],
    subtotal: '100.00',
  });

  assert.deepEqual(result, []);
});

test('evaluatePromotions never returns null', async (t) => {
  const { evaluatePromotions } = await loadModule(t, async () => ({ rows: [] }));

  const result = await evaluatePromotions({
    items: [],
    subtotal: '0.00',
  });

  assert.notEqual(result, null);
  assert.deepEqual(result, []);
});
