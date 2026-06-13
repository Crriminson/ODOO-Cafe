import axiosInstance from './axiosInstance';

/**
 * Create a new trip.
 * POST /api/v1/trips
 * Body: { name, description?, startDate?, endDate?, totalBudget? }
 * Returns: { success, data: { trip }, message }
 */
export const createTrip = async (payload) => {
  const res = await axiosInstance.post('/trips', payload);
  return res.data;
};

/**
 * Get all trips for the logged-in user.
 * GET /api/v1/trips
 * Returns: { success, data: { trips }, message }
 */
export const getTrips = async () => {
  const res = await axiosInstance.get('/trips');
  return res.data;
};

/**
 * Get a single trip by ID.
 * GET /api/v1/trips/:id
 */
export const getTripById = async (id) => {
  const res = await axiosInstance.get(`/trips/${id}`);
  return res.data;
};

/**
 * Update a trip.
 * PUT /api/v1/trips/:id
 */
export const updateTrip = async (id, payload) => {
  const res = await axiosInstance.put(`/trips/${id}`, payload);
  return res.data;
};

/**
 * Delete a trip.
 * DELETE /api/v1/trips/:id
 */
export const deleteTrip = async (id) => {
  const res = await axiosInstance.delete(`/trips/${id}`);
  return res.data;
};

/**
 * Fetch a publicly shared trip by its share token (no auth required).
 * GET /api/v1/trips/shared/:token
 */
export const getPublicTrip = async (token) => {
  const res = await axiosInstance.get(`/trips/shared/${token}`);
  return res.data;
};

/**
 * Clone (copy) a trip into the current user's account.
 * POST /api/v1/trips/:id/clone
 */
export const cloneTrip = async (id) => {
  const res = await axiosInstance.post(`/trips/${id}/clone`);
  return res.data;
};
