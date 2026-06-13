const bcrypt = require('bcrypt');
const { createUser, findUserByEmail, findUserById } = require('../db/queries/users.queries');
const { signAuthToken } = require('../utils/jwt');
const { validateLogin, validateSignup } = require('../utils/validators');

const cookieOptions = {
  httpOnly: true,          // Not accessible via JavaScript (prevents XSS theft)
  sameSite: 'strict',      // Only sent with same-origin requests (prevents CSRF)
  secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
  maxAge: 8 * 60 * 60 * 1000 // Expires in 8 hours
};

const signup = async (req, res, next) => {
  try {
    const validationError = validateSignup(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { name, email, password, role } = req.body;
    const existing = await findUserByEmail(email);

    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, passwordHash, role });

    return res.status(201).json({ message: 'Account created', user });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const validationError = validateLogin(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signAuthToken(user);
    res.cookie('accessToken', token, cookieOptions);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  });

  return res.json({ message: 'Logged out' });
};

module.exports = {
  login,
  logout,
  me,
  signup
};
