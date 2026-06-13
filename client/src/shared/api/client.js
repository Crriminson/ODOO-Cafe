import axios from 'axios';

/**
 * Axios instance pre-configured for the Odoo Cafe API.
 *
 * - Base URL from VITE_API_URL (falls back to localhost:5000/api/v1)
 * - Attaches Authorization: Bearer <token> from localStorage on every request
 * - Response interceptor unwraps { error: { message, code } } into a thrown Error
 *   so callers can: try { await api.get(...) } catch(e) { e.message, e.code }
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ─── Request interceptor — attach JWT ────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — unwrap errors ────────────────────────────────────

api.interceptors.response.use(
  // Success — return the data directly so callers don't need .data
  (response) => response.data,

  // Error — unwrap the { error: { message, code } } envelope
  (err) => {
    const serverError = err?.response?.data?.error;

    const message = serverError?.message || err.message || 'Network error';
    const code    = serverError?.code    || 'NETWORK_ERROR';
    const fields  = serverError?.fields  || null;   // validation errors
    const status  = err?.response?.status || 0;

    const error       = new Error(message);
    error.code        = code;
    error.fields      = fields;
    error.status      = status;

    // Auto-clear token and reload on 401 (expired / invalid JWT)
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
