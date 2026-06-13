# Frozen Contracts

> These files define the shared interface that all four feature tracks build against.
> **Do not modify any file below without a group discussion and a coordinated commit.**

---

| File | What It Locks |
|---|---|
| `shared/constants/roles.js` | The two valid role strings — `admin`, `employee`. Used in JWT payload, DB, and route guards. |
| `shared/constants/orderStatus.js` | The four order lifecycle values — `draft`, `sent`, `paid`, `cancelled`. Used in DB, API filters, and UI badges. |
| `shared/constants/orderType.js` | The two order types — `dine_in`, `takeaway`. Drives table-selection logic and KDS display. |
| `shared/constants/kdsStages.js` | The three KDS stages — `to_cook`, `preparing`, `completed` — and their progression order. Drives stage-advance logic and KDS card UI. |
| `shared/constants/paymentMethods.js` | The three payment method strings — `cash`, `card`, `upi`. Used in payment creation, settings toggles, and UPI QR flow. |
| `shared/constants/discountTypes.js` | The two discount calculation modes — `percentage`, `fixed`. Used in coupons, promotions, and `order_discounts`. |
| `shared/constants/unitOfMeasure.js` | The three unit strings — `piece`, `kg`, `litre`. Used in product management and cart display. |
| `shared/types/index.js` | JSDoc typedefs for every DB table — field names, types, nullability. These are the shapes all API responses and frontend components are typed against. |
| `docs/API-Contract.md` | The exact URL, method, request body, response JSON, and error shape for every endpoint. Backend implements routes against this; frontend implements `api/*.js` against this. Neither side references the other. |
| `docs/WebSocket-Events.md` | The exact Socket.IO event names and JSON payload shapes for all four real-time events: `order:new`, `order:stage_updated`, `item:completed`, `order:paid`. |
| `client/src/shared/api/client.js` | The axios instance — base URL, JWT attachment, error unwrapping, 401 redirect. All `api/*.js` files import and use this instance, never raw `axios`. |
| `client/src/shared/utils/format.js` | `formatCurrency` (₹, 2 decimals, en-IN locale) and `formatDateTime` (Asia/Kolkata). All currency and date display goes through these — never inline. |
| `client/.env.example` | `VITE_API_URL` and `VITE_SOCKET_URL` — the two env variables required by the client. |
