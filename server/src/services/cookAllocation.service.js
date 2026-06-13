import * as db from '../config/db.js';
import { KDS_STAGES } from '../../../shared/constants/kdsStages.js';

const buildCookMap = (rows) => {
  const cooks = new Map();

  for (const row of rows) {
    if (!cooks.has(row.id)) {
      cooks.set(row.id, {
        id:         row.id,
        name:       row.name,
        categories: [],
      });
    }

    if (row.category_id != null) {
      cooks.get(row.id).categories.push(row.category_id);
    }
  }

  return [...cooks.values()];
};

const pickCookForItem = (item, cooks, workloads, maxWorkload) => {
  let winner = null;

  for (const cook of cooks) {
    const workload = workloads.get(cook.id) ?? 0;
    const preferenceScore = cook.categories.includes(item.category_id) ? 2 : 0;
    const workloadScore = maxWorkload - workload;
    const totalScore = preferenceScore + workloadScore;

    if (!winner) {
      winner = { cook, workload, totalScore };
      continue;
    }

    if (totalScore > winner.totalScore) {
      winner = { cook, workload, totalScore };
      continue;
    }

    if (totalScore === winner.totalScore && workload < winner.workload) {
      winner = { cook, workload, totalScore };
      continue;
    }

    if (
      totalScore === winner.totalScore &&
      workload === winner.workload &&
      cook.id < winner.cook.id
    ) {
      winner = { cook, workload, totalScore };
    }
  }

  return winner?.cook ?? null;
};

export const assignCooks = async (orderId) => {
  const { rows: itemRows } = await db.query(
    `SELECT
       oi.id AS item_id,
       p.category_id
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
       AND p.show_on_kds = TRUE`,
    [orderId]
  );

  if (itemRows.length === 0) {
    return { assignments: [] };
  }

  const { rows: cookRows } = await db.query(
    `SELECT
       c.id,
       c.name,
       ccp.category_id
     FROM cooks c
     LEFT JOIN cook_category_preferences ccp
       ON ccp.cook_id = c.id
     WHERE c.is_active = TRUE
     ORDER BY c.id, ccp.category_id`
  );

  if (cookRows.length === 0) {
    return { assignments: [] };
  }

  const cooks = buildCookMap(cookRows);
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const cookIds = cooks.map((cook) => cook.id);
    const { rows: workloadRows } = await client.query(
      `SELECT
         assigned_cook_id AS cook_id,
         COUNT(*)::int AS workload
       FROM order_items
       WHERE assigned_cook_id = ANY($1::int[])
         AND kds_status = ANY($2::text[])
       GROUP BY assigned_cook_id`,
      [
        cookIds,
        [KDS_STAGES.TO_COOK, KDS_STAGES.PREPARING],
      ]
    );

    const workloads = new Map(cooks.map((cook) => [cook.id, 0]));

    for (const row of workloadRows) {
      workloads.set(row.cook_id, row.workload);
    }

    const maxWorkload =
      workloadRows.length > 0
        ? Math.max(...workloadRows.map((row) => row.workload))
        : 0;

    // Workloads are computed once before assignment.
    // Re-querying after every assignment is intentionally avoided.
    const assignments = [];

    for (const item of itemRows) {
      const winner = pickCookForItem(item, cooks, workloads, maxWorkload);

      if (!winner) {
        continue;
      }

      await client.query(
        `UPDATE order_items
         SET assigned_cook_id = $1
         WHERE id = $2`,
        [winner.id, item.item_id]
      );

      assignments.push({
        item_id:   item.item_id,
        cook_id:   winner.id,
        cook_name: winner.name,
      });
    }

    await client.query('COMMIT');

    return { assignments };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
