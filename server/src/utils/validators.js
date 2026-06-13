const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateSignup = ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) {
    return 'Name, email, password, and role are required';
  }

  if (!isValidEmail(email)) {
    return 'A valid email is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (!['admin', 'employee'].includes(role)) {
    return 'Invalid role';
  }

  return null;
};

const validateLogin = ({ email, password }) => {
  if (!email || !password) {
    return 'Email and password are required';
  }

  if (!isValidEmail(email)) {
    return 'A valid email is required';
  }

  return null;
};

module.exports = {
  validateLogin,
  validateSignup
};
