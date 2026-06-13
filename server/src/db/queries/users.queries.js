import { query } from '../../config/db.js';

/**
 * Find an active user by email.
 * Returns the full row including password_hash (needed for bcrypt comparison).
 */
export const findUserByEmail = (email) =>
  query(
    `SELECT id, name, email, password_hash, role, is_active
     FROM users
     WHERE email = $1 AND is_active = TRUE
     LIMIT 1`,
    [email]
  );

/**
 * Find a user by id — excludes password_hash (safe for client response).
 */
export const findUserById = (id) =>
  query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

/**
 * Insert a new user. Returns the safe (no password_hash) columns.
 */
export const createUser = (name, email, passwordHash, role) =>
  query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, passwordHash, role]
  );

/**
 * Returns true if an account with this email already exists (any role, any status).
 */
export const emailExists = async (email) => {
  const { rows } = await query(
    'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows.length > 0;
};
