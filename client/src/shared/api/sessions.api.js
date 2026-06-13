import apiClient from './client.js';

/**
 * GET /sessions/current
 * Returns the current active session or null.
 * @returns {Promise<{ session: Object|null }>}
 */
export const getCurrentSession = () => apiClient.get('/sessions/current');

/**
 * POST /sessions/open
 * Opens a new POS session.
 * @returns {Promise<{ session: Object }>}
 */
export const openSession = () => apiClient.post('/sessions/open');

/**
 * POST /sessions/close
 * Closes the currently active POS session.
 * @returns {Promise<{ session: Object }>}
 */
export const closeSession = () => apiClient.post('/sessions/close');

/**
 * GET /sessions/last-closed
 * Returns the last closed session or null.
 * @returns {Promise<{ session: Object|null }>}
 */
export const getLastClosedSession = () => apiClient.get('/sessions/last-closed');
