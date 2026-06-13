import assert from 'node:assert/strict';
import { test } from 'node:test';

const loadModule = async (t, queryImpl) => {
  t.mock.module('../../config/db.js', {
    namedExports: {
      query: queryImpl,
    },
  });

  return import(`./coupons.queries.js?test=${encodeURIComponent(t.name)}`);
};

test('findValidCouponByCode does a case-insensitive lookup', async (t) => {
  const calls = [];

  const { findValidCouponByCode } = await loadModule(t, async (text, params) => {
    calls.push({ text, params });
    return {
      rows: [
        {
          id:             1,
          code:           'SAVE10',
          discount_type:  'percentage',
          discount_value: '10.00',
        },
      ],
    };
  });

  const result = await findValidCouponByCode('save10');

  assert.equal(calls[0].params[0], 'save10');
  assert.ok(calls[0].text.includes('LOWER(code) = LOWER($1)'));
  assert.deepEqual(result, {
    id:             1,
    code:           'SAVE10',
    discount_type:  'percentage',
    discount_value: '10.00',
  });
});

test('findValidCouponByCode excludes inactive coupons in SQL', async (t) => {
  let capturedText = '';

  const { findValidCouponByCode } = await loadModule(t, async (text) => {
    capturedText = text;
    return { rows: [] };
  });

  await findValidCouponByCode('save10');

  assert.ok(capturedText.includes('AND is_active = TRUE'));
});

test('findValidCouponByCode returns null when no coupon matches', async (t) => {
  const { findValidCouponByCode } = await loadModule(t, async () => ({ rows: [] }));

  const result = await findValidCouponByCode('missing');

  assert.equal(result, null);
});
