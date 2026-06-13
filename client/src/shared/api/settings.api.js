import api from './client.js';

// ─── Payment Methods ──────────────────────────────────────────────────────────

export const getPaymentMethods = () =>
  api.get('/settings/payment-methods');
// Returns: { payment_methods: [{ method, is_enabled, upi_id }] }
// Always returns all 3 rows: cash, card, upi

export const updatePaymentMethods = (methods) =>
  api.put('/settings/payment-methods', methods);
// Body: [{ method, is_enabled, upi_id }, ...]
// Returns: { payment_methods: [...] } — fresh state from DB

// ─── App Settings (round-2 — do not implement yet) ───────────────────────────
// export const getAppSettings    = () => api.get('/settings');
// export const updateAppSettings = (data) => api.put('/settings', data);
