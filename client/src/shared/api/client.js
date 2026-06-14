/**
 * Shared HTTP client for all POS API calls.
 *
 * Mock fallback behaviour
 * ───────────────────────
 * getMockResponse() is ONLY invoked when:
 *   VITE_ENABLE_MOCKS=true   is set in the .env (or .env.local) file.
 *
 * Without that flag, every real backend error (5xx, network failure, auth
 * failure, etc.) surfaces immediately to the caller as a thrown Error so the
 * UI can show a real error message — no fake data silently masks the failure.
 *
 * To enable for local offline development:
 *   echo "VITE_ENABLE_MOCKS=true" >> client/.env.local
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ─── Gate flag ───────────────────────────────────────────────────────────────
// Cast to boolean — Vite env values are always strings.
const MOCKS_ENABLED = import.meta.env.VITE_ENABLE_MOCKS === 'true';

// ─── Response parser ─────────────────────────────────────────────────────────
const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    // payload.error may be an object { message, code } or a plain string
    const errorMessage =
      (typeof payload?.error === 'object'
        ? payload.error?.message
        : payload?.error) ||
      payload?.message ||
      `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return payload;
};

// ─── Mock data (only used when VITE_ENABLE_MOCKS=true) ───────────────────────
let mockOrder = null;

const getMockResponse = (path, options) => {
  const method = options.method || 'GET';

  if (path.startsWith('/auth/login')) {
    return { token: 'mock-jwt-token', user: { id: 1, name: 'Demo User', email: 'demo@odoo-cafe.com', role: 'employee' } };
  }
  if (path.startsWith('/sessions/current')) {
    return { session: { id: 42, employee_id: 1, opened_at: new Date().toISOString() } };
  }
  if (path.startsWith('/floors')) {
    return {
      floors: [
        {
          id: 1,
          name: 'Main Floor (offline)',
          tables: [
            { id: 101, table_number: 1, seats: 4, is_active: true,  has_active_order: false },
            { id: 102, table_number: 2, seats: 2, is_active: true,  has_active_order: false },
            { id: 103, table_number: 3, seats: 6, is_active: false, has_active_order: false },
          ],
        },
      ],
    };
  }
  if (path.startsWith('/categories')) {
    return {
      categories: [
        { id: 1, name: 'Coffee', color: '#F5C142' },
        { id: 2, name: 'Bakery', color: '#10B981' },
      ],
    };
  }
  if (path.startsWith('/products')) {
    return {
      products: [
        { id: 1, category_id: 1, name: 'Espresso',   price: '120.00', tax_rate: '5.00',  is_active: true },
        { id: 2, category_id: 1, name: 'Cappuccino',  price: '180.00', tax_rate: '5.00',  is_active: true },
        { id: 3, category_id: 2, name: 'Croissant',   price: '150.00', tax_rate: '18.00', is_active: true },
      ],
    };
  }
  if (path.startsWith('/orders')) {
    if (method === 'POST') {
      const body = options.body;
      mockOrder = {
        id: 501,
        session_id: 42,
        status: 'draft',
        order_type: body?.order_type || 'dine_in',
        table_id: body?.table_id || null,
        subtotal: '0.00',
        tax_total: '0.00',
        total: '0.00',
        items: [],
      };
      return { order: mockOrder };
    }
    if (method === 'PUT') {
      const body = options.body;
      const items = body?.items || [];
      const mockProducts = [
        { id: 1, name: 'Espresso',  price: 120.00, tax_rate: 5.00 },
        { id: 2, name: 'Cappuccino',price: 180.00, tax_rate: 5.00 },
        { id: 3, name: 'Croissant', price: 150.00, tax_rate: 18.00 },
      ];
      let subtotal = 0;
      let tax = 0;
      const orderItems = items.map((item, idx) => {
        const prod = mockProducts.find((p) => p.id === item.product_id);
        const lineTotal = prod.price * item.quantity;
        subtotal += lineTotal;
        tax += (lineTotal * prod.tax_rate) / 100;
        return {
          id: idx + 1,
          product_id: prod.id,
          product_name: prod.name,
          unit_price: prod.price.toFixed(2),
          quantity: item.quantity,
          line_total: lineTotal.toFixed(2),
          tax_rate: (prod.tax_rate / 100).toString(),
        };
      });
      mockOrder = {
        ...mockOrder,
        subtotal: subtotal.toFixed(2),
        tax_total: tax.toFixed(2),
        total: (subtotal + tax).toFixed(2),
        items: orderItems,
      };
      return { order: mockOrder };
    }
  }
  if (path.includes('/send')) {
    if (mockOrder) {
      mockOrder = { ...mockOrder, status: 'sent' };
      return { order: mockOrder };
    }
  }
  if (method === 'DELETE') {
    mockOrder = null;
    return { message: 'Order deleted successfully' };
  }
  return null;
};

// ─── Core request function ────────────────────────────────────────────────────
export const request = async (path, options = {}) => {
  const { body, headers, ...rest } = options;
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      // ── Mock fallback (5xx / DB error) — only in mock-enabled mode ──────
      if (MOCKS_ENABLED && response.status >= 500) {
        const mock = getMockResponse(path, options);
        if (mock) {
          console.warn(
            `[client.js] MOCK (5xx) for ${options.method || 'GET'} ${path}`,
          );
          return mock;
        }
      }

      // ── Real error — extract message from the structured error envelope ──
      const errorMessage =
        (typeof payload?.error === 'object'
          ? payload.error?.message
          : payload?.error) ||
        payload?.message ||
        `Request failed (${response.status})`;
      throw new Error(errorMessage);
    }

    return payload;
  } catch (err) {
    // Network-level failure (server unreachable, CORS, etc.)
    if (MOCKS_ENABLED) {
      const mock = getMockResponse(path, options);
      if (mock) {
        console.warn(
          `[client.js] MOCK (network error) for ${options.method || 'GET'} ${path}:`,
          err.message,
        );
        return mock;
      }
    }
    // No mock available (or mocks disabled) — let the error bubble up
    throw err;
  }
};

// ─── Convenience methods ──────────────────────────────────────────────────────
export const apiClient = {
  get: (path, options = {}) => {
    let url = path;
    if (options.params) {
      const qs = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          qs.set(key, String(val));
        }
      });
      const query = qs.toString();
      if (query) url += `?${query}`;
    }
    return request(url, { method: 'GET', ...options });
  },
  post:   (path, body, options = {}) => request(path, { method: 'POST',   body, ...options }),
  put:    (path, body, options = {}) => request(path, { method: 'PUT',    body, ...options }),
  delete: (path,       options = {}) => request(path, { method: 'DELETE',      ...options }),
};

export { API_BASE_URL };
export default apiClient;
