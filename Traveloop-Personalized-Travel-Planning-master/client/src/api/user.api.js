import axiosInstance from './axiosInstance';

/**
 * Get current user profile.
 * GET /api/v1/users/me
 */
export const getMe = async () => {
  const res = await axiosInstance.get('/users/me');
  return res.data;
};

/**
 * Update current user profile.
 * PUT /api/v1/users/me
 * Body: { firstName, lastName, phone, city, country, bio }
 */
export const updateMe = async (payload) => {
  const res = await axiosInstance.put('/users/me', payload);
  return res.data;
};

/**
 * Delete current user profile.
 * DELETE /api/v1/users/me
 */
export const deleteMe = async () => {
  const res = await axiosInstance.delete('/users/me');
  return res.data;
};
