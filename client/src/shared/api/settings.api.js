import { request } from './client.js';

// ─── Payment Methods ───────────────────────────────────────────────────────────

// Returns: { payment_methods: [{ method, is_enabled, upi_id }] }
// Always returns all 3 rows: cash, card, upi
export const getPaymentMethods = () =>
  request('/settings/payment-methods');

// Body: [{ method, is_enabled, upi_id }, ...]
// Returns: { payment_methods: [...] } — fresh state from DB
export const updatePaymentMethods = (methods) =>
  request('/settings/payment-methods', { method: 'PUT', body: methods });

// ─── App Settings (round-2 — do not implement yet) ────────────────────────────
// export const getAppSettings    = () => request('/settings');
// export const updateAppSettings = (data) => request('/settings', { method: 'PUT', body: data });
