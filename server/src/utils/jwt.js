const jwt = require('jsonwebtoken');
const env = require('../config/env');

const getJwtSecret = () => {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  return env.jwtSecret;
};

const signAuthToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      role: user.role,
      name: user.name
    },
    getJwtSecret(),
    { expiresIn: '8h' }
  );

const verifyAuthToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = {
  signAuthToken,
  verifyAuthToken
};
