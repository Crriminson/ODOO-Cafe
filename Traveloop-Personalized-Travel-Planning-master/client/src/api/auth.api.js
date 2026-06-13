import axiosInstance from './axiosInstance';

/**
 * Login an existing user.
 * Returns the server envelope: { success, data: { accessToken, user }, message }
 */
export const loginUser = async (email, password) => {
  const res = await axiosInstance.post('/auth/login', { email, password });
  // Axios puts the parsed JSON in res.data; server wraps everything in { success, data, message }
  return res.data; // → { success, data: { accessToken, user }, message }
};

/**
 * Register a new user account.
 * All fields after password are optional profile data.
 * Returns the server envelope: { success, data: { user }, message }
 */
export const registerUser = async (name, email, password, profileFields = {}) => {
  const res = await axiosInstance.post('/auth/register', {
    name,
    email,
    password,
    ...profileFields, // firstName, lastName, phone, city, country
  });
  return res.data; // → { success, data: { user }, message }
};
