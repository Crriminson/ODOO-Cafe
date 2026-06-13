import * as db from '../../config/db.js';

export const getAllCooks = async ({ is_active } = {}) => {
  let sql = `
    SELECT id, name, is_active, created_at, updated_at
    FROM cooks
  `;
  const params = [];

  if (is_active !== undefined) {
    params.push(is_active);
    sql += ` WHERE is_active = $1`;
  }

  sql += ` ORDER BY name ASC, id ASC`;

  const { rows } = await db.query(sql, params);
  return rows;
};

export const getCookById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, name, is_active, created_at, updated_at
     FROM cooks
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
};

export const getCookCategoryPreferences = async (cookId) => {
  const { rows } = await db.query(
    `SELECT c.id, c.name, c.color
     FROM categories c
     JOIN cook_category_preferences ccp ON c.id = ccp.category_id
     WHERE ccp.cook_id = $1
     ORDER BY c.name ASC, c.id ASC`,
    [cookId]
  );
  return rows;
};

export const createCook = async (name, categoryIds = []) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO cooks (name, is_active)
       VALUES ($1, TRUE)
       RETURNING id, name, is_active, created_at, updated_at`,
      [name]
    );
    const cook = rows[0];

    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await client.query(
          `INSERT INTO cook_category_preferences (cook_id, category_id)
           VALUES ($1, $2)`,
          [cook.id, categoryId]
        );
      }
    }

    await client.query('COMMIT');
    return cook;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const updateCook = async (id, fields = {}, categoryIds) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const setKeys = [];
    const params = [];
    const allowedFields = ['name', 'is_active'];

    for (const key of allowedFields) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        setKeys.push(`${key} = $${params.length}`);
      }
    }

    let cook = null;
    if (setKeys.length > 0) {
      params.push(id);
      const { rows } = await client.query(
        `UPDATE cooks
         SET ${setKeys.join(', ')}, updated_at = NOW()
         WHERE id = $${params.length}
         RETURNING id, name, is_active, created_at, updated_at`,
        params
      );
      cook = rows[0] ?? null;
    } else {
      const { rows } = await client.query(
        `SELECT id, name, is_active, created_at, updated_at
         FROM cooks
         WHERE id = $1`,
        [id]
      );
      cook = rows[0] ?? null;
    }

    if (cook && categoryIds !== undefined) {
      // Delete existing preferences first
      await client.query(
        `DELETE FROM cook_category_preferences
         WHERE cook_id = $1`,
         [id]
      );

      // Insert new preferences
      if (categoryIds && categoryIds.length > 0) {
        for (const categoryId of categoryIds) {
          await client.query(
            `INSERT INTO cook_category_preferences (cook_id, category_id)
             VALUES ($1, $2)`,
            [id, categoryId]
          );
        }
      }
    }

    await client.query('COMMIT');
    return cook;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const softDeleteCook = async (id) => {
  const { rows } = await db.query(
    `UPDATE cooks
     SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, is_active, created_at, updated_at`,
    [id]
  );
  return rows[0] ?? null;
};
