import { db } from '../../config/db.js';

/**
 * Find an active user by email.
 * Returns the full row including password_hash (needed for bcrypt comparison).
 */
export const findUserByEmail = async (email) => {
  const rows = await db('users')
    .select('id', 'name', 'email', 'password_hash', 'role', 'is_active')
    .where({ email, is_active: true })
    .limit(1);
  return { rows };
};

/**
 * Find a user by id — excludes password_hash (safe for client response).
 */
export const findUserById = async (id) => {
  const rows = await db('users')
    .select('id', 'name', 'email', 'role', 'is_active', 'created_at')
    .where({ id })
    .limit(1);
  return { rows };
};

/**
 * Insert a new user. Returns the safe (no password_hash) columns.
 */
export const createUser = async (name, email, passwordHash, role) => {
  const rows = await db('users')
    .insert({
      name,
      email,
      password_hash: passwordHash,
      role,
    })
    .returning(['id', 'name', 'email', 'role', 'created_at']);
  return { rows };
};

/**
 * Returns true if an account with this email already exists (any role, any status).
 */
export const emailExists = async (email) => {
  const rows = await db('users')
    .where({ email })
    .limit(1)
    .select(1);
  return rows.length > 0;
};
