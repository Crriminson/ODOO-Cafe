import bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  emailExists,
} from '../db/queries/users.queries.js';

// ─── POST /api/v1/auth/signup ─────────────────────────────────────────────────

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body; // validated by zod

    if (await emailExists(email)) {
      return res.status(409).json({
        error: { message: 'Email already registered', code: 'EMAIL_EXISTS' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await createUser(name, email, passwordHash, role);
    const user = rows[0];

    const token = signToken({ userId: user.id, role: user.role, name: user.name });

    return res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // validated by zod

    const { rows } = await findUserByEmail(email);
    const user = rows[0];

    // Same error message for both "not found" and "wrong password"
    // to avoid leaking which emails are registered.
    const CRED_ERROR = {
      error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
    };

    if (!user) return res.status(401).json(CRED_ERROR);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json(CRED_ERROR);

    const token = signToken({ userId: user.id, role: user.role, name: user.name });

    return res.json({
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
// JWT is stateless — we have no server-side session to destroy.
// The client is responsible for discarding the token.

export const logout = (_req, res) => {
  res.json({ message: 'Logged out successfully' });
};

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────

export const me = async (req, res, next) => {
  try {
    const { rows } = await findUserById(req.user.userId);

    if (!rows[0]) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'NOT_FOUND' },
      });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};
