const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const env = require('../config/env');

// Fields we're safe to return for a user — never include passwordHash
const USER_SAFE_FIELDS = {
  id: true,
  email: true,
  name: true,
  firstName: true,
  lastName: true,
  phone: true,
  city: true,
  country: true,
  bio: true,
  avatarUrl: true,
  languagePref: true,
  role: true,
  createdAt: true,
};

/**
 * Register a new user.
 * Throws 409 if the email is already taken.
 */
const register = async ({ email, password, name, firstName, lastName, phone, city, country, bio }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email is already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      ...(firstName !== undefined && { firstName }),
      ...(lastName  !== undefined && { lastName }),
      ...(phone     !== undefined && { phone }),
      ...(city      !== undefined && { city }),
      ...(country   !== undefined && { country }),
      ...(bio       !== undefined && { bio }),
    },
    select: USER_SAFE_FIELDS,
  });

  return user;
};

/**
 * Login with email + password.
 * Returns { accessToken, refreshToken, user }.
 * Stores the refresh token in the DB so it can be revoked on logout.
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use the same error message for wrong email and wrong password —
  // avoids leaking which one is incorrect (user enumeration defence).
  const authError = new Error('Invalid email or password');
  authError.statusCode = 401;

  if (!user || user.deletedAt) throw authError;

  const passwordMatch = await comparePassword(password, user.passwordHash);
  if (!passwordMatch) throw authError;

  const payload = { id: user.id, role: user.role };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store refresh token with its expiry so it can be validated and pruned
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  // Return user without passwordHash
  const { passwordHash: _omit, ...safeUser } = user;

  return { accessToken, refreshToken, user: safeUser };
};

/**
 * Issue a new access token from a valid, unexpired refresh token.
 * Does NOT rotate the refresh token (rotation can be added later).
 */
const refresh = async (token) => {
  if (!token) {
    const err = new Error('Refresh token missing');
    err.statusCode = 401;
    throw err;
  }

  // Check the token is in the DB (not logged out) and not expired
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error('Refresh token invalid or expired');
    err.statusCode = 401;
    throw err;
  }

  // Verify the JWT signature as a second layer of validation
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error('Refresh token invalid');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = signAccessToken({ id: payload.id, role: payload.role });
  return { accessToken };
};

/**
 * Logout: delete the refresh token from the DB.
 * The short-lived access token will expire on its own.
 */
const logout = async (token) => {
  if (!token) return; // already logged out — no-op
  // deleteMany to avoid throwing if the token doesn't exist
  await prisma.refreshToken.deleteMany({ where: { token } });
};

module.exports = { register, login, refresh, logout };
