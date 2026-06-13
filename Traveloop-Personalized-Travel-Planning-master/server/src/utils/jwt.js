const jwt = require('jsonwebtoken');
const env  = require('../config/env');

/**
 * Sign a short-lived access token (15m by default).
 * Payload is kept minimal — only userId and role to reduce token size.
 */
const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });

/**
 * Sign a long-lived refresh token (7d by default).
 * The raw token string is stored in the DB so it can be revoked.
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY });

const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
