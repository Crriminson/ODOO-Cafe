import * as db from '../../config/db.js';

export const findValidCustomerByEmail = async (email) => {
  if (!email) return null;
  const { rows } = await db.query(
    `SELECT id, email
     FROM customers
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
};

export const getCustomerById = async (id) => {
  const { rows } = await db.query(
    `SELECT id, name, email, phone, address, loyalty_points, created_at, updated_at
     FROM customers
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
};

export const getAllCustomers = async ({ search } = {}) => {
  let sql = `
    SELECT id, name, email, phone, address, loyalty_points, created_at, updated_at
    FROM customers
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`;
  }

  sql += ` ORDER BY name ASC, id ASC`;

  const { rows } = await db.query(sql, params);
  return rows;
};

export const createCustomer = async (name, email, phone, address) => {
  const emailVal = email === '' ? null : email;
  const phoneVal = phone === '' ? null : phone;
  const addressVal = address === '' ? null : address;

  const { rows } = await db.query(
    `INSERT INTO customers (name, email, phone, address)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, address, loyalty_points, created_at, updated_at`,
    [name, emailVal, phoneVal, addressVal]
  );
  return rows[0];
};

export const updateCustomer = async (id, fields) => {
  const setKeys = [];
  const params = [];

  const allowedFields = ['name', 'email', 'phone', 'address'];
  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      let val = fields[key];
      if (val === '') val = null;
      params.push(val);
      setKeys.push(`${key} = $${params.length}`);
    }
  }

  if (setKeys.length === 0) {
    return getCustomerById(id);
  }

  params.push(id);
  const sql = `
    UPDATE customers
    SET ${setKeys.join(', ')}, updated_at = NOW()
    WHERE id = $${params.length}
    RETURNING id, name, email, phone, address, loyalty_points, created_at, updated_at
  `;

  const { rows } = await db.query(sql, params);
  return rows[0] ?? null;
};

export const deleteCustomer = async (id) => {
  const { rows } = await db.query(
    `DELETE FROM customers
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  return rows[0] ?? null;
};
