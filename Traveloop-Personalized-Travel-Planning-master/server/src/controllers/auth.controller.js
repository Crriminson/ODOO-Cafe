const authService = require('../services/auth.service');
const apiResponse = require('../utils/apiResponse');

// Shared cookie options for the httpOnly refresh token cookie
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                              // Not accessible via JS
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 days in ms
  path: '/api/v1/auth',                        // Scope cookie to auth routes only
};

/**
 * POST /api/v1/auth/register
 * Body: { email, password, name }
 * Returns: 201 with the new user object (no passwordHash)
 */
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json(apiResponse.success(user, 'Account created successfully'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 * Returns: 200 with { accessToken, user } + sets httpOnly refresh cookie
 */
const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body.email,
      req.body.password
    );

    // Refresh token travels only via httpOnly cookie — never in the JSON body
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json(apiResponse.success({ accessToken, user }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Reads the refreshToken httpOnly cookie.
 * Returns: 200 with a new { accessToken }
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const { accessToken } = await authService.refresh(token);
    res.status(200).json(apiResponse.success({ accessToken }, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/logout
 * Clears the httpOnly cookie and deletes the token from the DB.
 * Returns: 200 (always — no information leakage)
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    await authService.logout(token);

    res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 });
    res.status(200).json(apiResponse.success(null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout };
