import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Sign a JWT.
 * @param {{ userId: number, role: string, name: string }} payload
 * @returns {string}
 */
export const signToken = (payload) =>
  jwt.sign(payload, env.JWT.secret, { expiresIn: env.JWT.expiresIn });

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 * @param {string} token
 * @returns {{ userId: number, role: string, name: string, iat: number, exp: number }}
 */
export const verifyToken = (token) => jwt.verify(token, env.JWT.secret);
