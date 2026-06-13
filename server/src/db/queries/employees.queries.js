import { db } from '../../config/db.js';

/**
 * Fetch all employee accounts (excluding password hashes).
 */
export const getAllEmployees = async () => {
  const rows = await db('users')
    .where({ role: 'employee' })
    .select('id', 'name', 'email', 'is_active', 'created_at')
    .orderBy('id', 'asc');
  return { rows };
};

/**
 * Fetch a single employee by ID.
 */
export const getEmployeeById = async (id) => {
  const rows = await db('users')
    .where({ id, role: 'employee' })
    .select('id', 'name', 'email', 'is_active', 'created_at')
    .limit(1);
  return { rows };
};

/**
 * Create a new employee record.
 */
export const createEmployee = async ({ name, email, passwordHash }) => {
  const rows = await db('users')
    .insert({
      name,
      email,
      password_hash: passwordHash,
      role: 'employee',
      is_active: true,
    })
    .returning(['id', 'name', 'email', 'role', 'is_active', 'created_at']);
  return { rows };
};

/**
 * Update employee fields.
 */
export const updateEmployee = async (id, fields) => {
  const allowed = ['name', 'email', 'is_active', 'password_hash'];
  const updateFields = {};
  for (const col of allowed) {
    if (fields[col] !== undefined) {
      updateFields[col] = fields[col];
    }
  }
  updateFields.updated_at = db.fn.now();

  const rows = await db('users')
    .where({ id, role: 'employee' })
    .update(updateFields)
    .returning(['id', 'name', 'email', 'role', 'is_active', 'created_at']);
  return { rows };
};

/**
 * Hard-delete an employee user.
 */
export const deleteEmployee = async (id) => {
  const rows = await db('users')
    .where({ id, role: 'employee' })
    .del()
    .returning('id');
  return { rows };
};
