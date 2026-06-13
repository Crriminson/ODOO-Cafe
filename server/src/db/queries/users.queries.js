const db = require('../../config/db');

const publicUserFields = 'id, name, email, role, is_active, created_at, updated_at';

const normalizeEmail = (email) => email.trim().toLowerCase();

const findUserByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [normalizeEmail(email)]
  );

  return result.rows[0];
};

const createUser = async ({ name, email, passwordHash, role }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${publicUserFields}`,
    [name.trim(), normalizeEmail(email), passwordHash, role]
  );

  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await db.query(
    `SELECT ${publicUserFields} FROM users WHERE id = $1 AND is_active = true`,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
