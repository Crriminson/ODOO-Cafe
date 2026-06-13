import apiClient from './client.js';

/**
 * GET /orders
 * Retrieves orders, optionally filtered by session_id, status, search, or table_id.
 * @param {Object} [params] - Query parameters { session_id, status, search, table_id }
 * @returns {Promise<{ orders: Array }>}
 */
export const getOrders = (params) => apiClient.get('/orders', { params });

/**
 * POST /orders
 * Creates a new order.
 * @param {Object} body - Order creation payload
 * @returns {Promise<{ order: Object }>}
 */
export const createOrder = (body) => apiClient.post('/orders', body);

/**
 * GET /orders/:id
 * Retrieves a single order by ID.
 * @param {string|number} id - Order ID
 * @returns {Promise<{ order: Object }>}
 */
export const getOrderById = (id) => apiClient.get(`/orders/${id}`);

/**
 * PUT /orders/:id
 * Updates an existing order.
 * @param {string|number} id - Order ID
 * @param {Object} body - Order update payload
 * @returns {Promise<{ order: Object }>}
 */
export const updateOrder = (id, body) => apiClient.put(`/orders/${id}`, body);

/**
 * POST /orders/:id/send
 * Sends an order to the kitchen (KDS).
 * @param {string|number} id - Order ID
 * @returns {Promise<{ order: Object }>}
 */
export const sendToKitchen = (id) => apiClient.post(`/orders/${id}/send`);

/**
 * DELETE /orders/:id
 * Deletes/cancels an order.
 * @param {string|number} id - Order ID
 * @returns {Promise<{ message: string }>}
 */
export const deleteOrder = (id) => apiClient.delete(`/orders/${id}`);
