import * as db from '../config/db.js';

export const redeemPoints = async (customerId, pointsToRedeem, orderId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT loyalty_points
       FROM customers
       WHERE id = $1
       FOR UPDATE`,
      [customerId]
    );

    const currentBalance = rows[0]?.loyalty_points ?? 0;

    if (pointsToRedeem > currentBalance) {
      const err = new Error('Insufficient loyalty points');
      err.code = 'INSUFFICIENT_LOYALTY_POINTS';
      throw err;
    }

    await client.query(
      `UPDATE customers
       SET loyalty_points = loyalty_points - $1
       WHERE id = $2`,
      [pointsToRedeem, customerId]
    );

    await client.query(
      `INSERT INTO loyalty_transactions (
         customer_id,
         order_id,
         type,
         points
       )
       VALUES ($1, $2, 'redeemed', $3)`,
      [customerId, orderId, pointsToRedeem]
    );

    await client.query('COMMIT');

    return {
      discountAmount: pointsToRedeem.toFixed(2),
      newBalance:     currentBalance - pointsToRedeem,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const creditPoints = async (customerId, orderTotal, orderId) => {
  if (customerId == null) {
    return null;
  }

  const { rows } = await db.query(
    `SELECT value
     FROM app_settings
     WHERE key = 'loyalty_points_rate'`
  );

  const loyaltyPointsRate = Number(rows[0].value);
  const pointsEarned = Math.floor(parseFloat(orderTotal) / loyaltyPointsRate);

  const { rows: customerRows } = await db.query(
    `UPDATE customers
     SET loyalty_points = loyalty_points + $1
     WHERE id = $2
     RETURNING loyalty_points`,
    [pointsEarned, customerId]
  );

  if (pointsEarned > 0) {
    await db.query(
      `INSERT INTO loyalty_transactions (
         customer_id,
         order_id,
         type,
         points
       )
       VALUES ($1, $2, 'earned', $3)`,
      [customerId, orderId, pointsEarned]
    );
  }

  return {
    pointsEarned,
    newBalance: customerRows[0].loyalty_points,
  };
};
