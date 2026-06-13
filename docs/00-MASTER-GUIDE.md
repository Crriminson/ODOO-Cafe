# Odoo Cafe POS — Team Master Guide
### Read this once, fully, before opening your own tracker file.

This folder has 5 files:

| File | Who reads it |
|---|---|
| `00-MASTER-GUIDE.md` | **Everyone** — read first, refer back at every checkpoint |
| `01-TRACKER-
P1-auth-shell.md` | Person 1 — Auth/JWT integration + app shell |
| `02-TRACKER-P2-catalog-venue.md` | Person 2 — Products, Categories, Payment Methods, Floors & Tables |
| `03-TRACKER-P3-pos-core.md` | Person 3 — Sessions, Order View, Payments |
| `04-TRACKER-P4-kds-engagement.md` | Person 4 — KDS, Customers/Loyalty, Coupons/Promotions, Cooks |

All 4 tracker files share the **same structure**, so once you know how to use one, you know how to use all of them.

---

## 1. How to use your tracker file

Each tracker is split into per-task blocks. For every task you do **3 things, in this order**:

1. **Before you prompt your AI** — skim the "Contract to follow" sub-section for that task. This is the exact shape (fields, wrapper keys, status codes, error codes) the output MUST match. Paste/reference it to your AI in your prompt.
2. **After your AI generates code** — go through the "Verification checklist" checkboxes one by one. Don't tick a box until you've actually looked at the code/output and confirmed it, not just assumed it.
3. **Log it** — add one row to the "AI Dev Log" table at the bottom of your tracker, *every time* you catch a deviation (don't bother logging when everything matched first try — only log catches, so the log stays a useful "what went wrong" history).

The point of step 3 is early detection: if you log "AI returned `price` as a number `120.00` instead of string `"120.00"`" the moment it happens, it gets fixed in 30 seconds. If it's not caught until P3 is consuming your endpoint 2 hours later, it's a cross-branch debugging session.

---

## 2. Branch & Git workflow

```
master                    ← always deployable, protected
 ├── feature/auth-shell        (P1)
 ├── feature/catalog-venue     (P2)
 ├── feature/pos-core          (P3)
 └── feature/kds-engagement    (P4)
```

Rules:

- **Create your branch from `master` now**, before writing any code: `git checkout -b feature/<your-track> master`.
- **Commit small, commit often** — every 30–45 min, even WIP. Small commits = small diffs = easy reviews = easy conflict resolution.
- **Rebase onto `master` before every push**, not after:
  ```bash
  git fetch origin
  git rebase origin/master
  # resolve any conflicts here, locally, while the context is fresh
  git push --force-with-lease
  ```
- **One reviewer approves before merging to `master`** (per README). For a hackathon pace, "review" can be a 2-minute skim — but it must happen, especially for the shared files in §4.
- **Never `git push --force` to `master`.** `--force-with-lease` on your own feature branch only.

---

## 3. Hour-0 Locked Contracts — agree on these BEFORE anyone codes

These three function signatures are the only real cross-person *backend logic* dependencies. P3 needs them to build the `/orders/:id/pay` endpoint; P4 owns the implementations. Lock these now, in a 15-minute call, so both sides can build against the agreed shape independently.

### 3.1 `services/promotion.service.js` (P4 builds, P3 calls)

```js
/**
 * Evaluate all active automated promotions against the current order.
 * Server-side only — client never sends promotion IDs (API-Contract.md #3).
 *
 * @param {{
 *   items: { product_id: number, quantity: number, unit_price: string, line_total: string }[],
 *   subtotal: string
 * }} order
 * @returns {Promise<Array<{
 *   promotion_id: number,
 *   discount_type: 'percentage' | 'fixed',
 *   discount_value: string,
 *   applied_amount: string   // actual ₹ deducted, already computed
 * }>>}
 */
export const evaluatePromotions = async (order) => { /* ... */ };
```

### 3.2 `services/loyalty.service.js` (P4 builds, P3 calls)

```js
/**
 * Redeem loyalty points as a discount on the CURRENT order.
 * Throws a typed error (`err.code = 'INSUFFICIENT_LOYALTY_POINTS'`) if
 * pointsToRedeem > customer's current balance — caller (P3) maps this to 400.
 *
 * @param {number} customerId
 * @param {number} pointsToRedeem
 * @returns {Promise<{ discountAmount: string, newBalance: number }>}
 */
export const redeemPoints = async (customerId, pointsToRedeem) => { /* ... */ };

/**
 * Credit loyalty points after a successful payment.
 * Reads `loyalty_points_rate` from app_settings. Inserts a
 * loyalty_transactions row (type='earned'). No-op if customerId is null.
 *
 * @param {number|null} customerId
 * @param {string} orderTotal   // e.g. "300.00"
 * @returns {Promise<{ pointsEarned: number, newBalance: number } | null>}
 */
export const creditPoints = async (customerId, orderTotal) => { /* ... */ };
```

### 3.3 `db/queries/coupons.queries.js` (P4 builds, P3 calls)

```js
/**
 * Case-insensitive lookup of an active coupon.
 * @param {string} code
 * @returns {Promise<{ id, code, discount_type, discount_value } | null>}
 */
export const findValidCouponByCode = async (code) => { /* ... */ };
```

**Also agree right now:**
- Nobody touches `server/src/db/migrations/*`. If you think the schema is missing something, post it to the group — don't add migration `011` solo.
- Both P3 and P4 should build a tiny local test for these 3 functions independently (P4 unit-tests the real implementation; P3 writes a fake/mock matching the signature so `/orders/:id/pay` can be built and tested without waiting). When P4's real version lands, P3 swaps the mock for the real import — should be a one-line change if the signature was followed.

---

## 4. Shared-file conflict matrix

These are the files more than one person will touch. Everything else in the repo is owned by exactly one person.

| File | Touched by | Rule |
|---|---|---|
| `server/src/routes/index.js` | Everyone (each replaces their own `stub('X')` line) | Edit **only your own line**. Rebase before push — non-adjacent single-line edits auto-merge. |
| `client/src/admin/routes.jsx` | P2 (Products/Categories/Floors/PaymentMethods), P4 (Cooks/CouponsPromotions) | P1 sets up the file first with one commented block per feature. Edit only your block. |
| `client/src/pos/routes.jsx` | P3 (Session/OrderType/FloorPopup/TableView/OrderView/Orders), P4 (Customers) | Same as above. |
| `server/src/routes/settings.routes.js` + controller + queries | P2 (payment-methods endpoints, build first), later round-2 owner (app settings / loyalty rate) | P2 merges first. Round-2 adds *new functions*, doesn't edit P2's. |
| `package.json` / `package-lock.json` (root, client, server) | Whoever adds a dependency | **Announce in chat before `npm install`**. Push immediately. Everyone else pulls before their next install. |
| `server/src/db/migrations/*` | Nobody | Frozen. Flag to the group if something's missing. |
| `shared/constants/*`, `client/src/shared/constants/index.js` | P1 sets up once | If you need a new constant, add it to the existing relevant file — don't restructure. |

---

## 5. Timeline & sync checkpoints

Adjust the absolute times to your actual session, but keep the **order and relative spacing**.

- **Block 0 (0:00–0:20) — Hour-0 sync.** All 4 people. Lock §3 contracts. Confirm §4 rules. Everyone branches off latest `master`.
- **Block 1 (0:20–1:30) — Backend-first, heads down.** Backend for your module has zero frontend dependency — start there. P1 starts on shared UI components + AuthProvider/router (also zero dependency on others).
- **Checkpoint A (~1:30).** P1 pushes the shell (layouts, route skeletons, shared components, AuthProvider) to `master`. P2/P3/P4 rebase onto it. If P1 isn't ready, others keep going on backend — don't block.
- **Block 2 (1:30–3:30) — Parallel feature build.** P2 pushes `api/*.js` clients early so P3 can swap mocks for real calls. P4 prioritizes the §3 contract functions in the first hour of this block.
- **Checkpoint B (~3:30) — 10-min status sync, all 4.** What's merged? What's blocked? Any contract drift from `docs/API-Contract.md`? If P2's products/categories are live, P3 swaps mocks now.
- **Block 3 (3:30–5:30) — Integration.** P3 + P4 jointly wire `/orders/:id/pay` (promotions, coupons, loyalty, UPI QR, receipt). P1 (now free) helps P3 or starts round-2 (Employees page). P2 wraps payment-method settings + floor/table integration.
- **Checkpoint C (~5:30) — Feature freeze for round 1.** Build-order items 1–7 merged and smoke-tested end to end: login → open session → order → send to kitchen → KDS updates → pay → receipt.
- **Block 4 (5:30→end) — Round 2 + polish.** Employees/User Management, Reports & Dashboard (+ PDF/XLS export), Settings page, Booking placeholder nav link. Distribute among whoever's free. Final pass against `docs/guidelines-design.md` §7–8 (accessibility + pre-ship checklist).

At every checkpoint, each person should have their tracker file open and be able to say, in one sentence per task: **done / in progress / blocked on X**.

---

## 6. Global "AI mistake" checklist — applies to EVERY task, every person

Your AI assistant doesn't have `docs/API-Contract.md` memorized as well as you think it does, and it will quietly drift toward "generic REST API" patterns instead of this project's conventions. The following are the **most common drift patterns** seen across this kind of build. Check for these on every endpoint/component you generate, regardless of which tracker task it's for:

- [ ] **Decimal fields are numeric strings**, e.g. `"price": "120.00"`, never `"price": 120` or `120.00`. This applies to `price`, `tax_rate`, `discount_value`, `subtotal`, `tax_total`, `discount_total`, `tip`, `total`, `amount`, `applied_amount`, `loyalty_discount`, `closing_total_revenue`. AI very commonly "helpfully" converts these to JS numbers — check the actual JSON response, not just the code.
- [ ] **Error envelope is always** `{ "error": { "message": "...", "code": "..." } }` — AI defaults often look like `{ "message": "..." }` or `{ "error": "..." }` (string, not object). Validation errors (422) additionally include `"fields": [...]`.
- [ ] **Response wrapper key matches the contract exactly** — e.g. `{ "products": [...] }`, not `{ "data": [...] }`, `{ "items": [...] }`, or `{ "results": [...] }`. AI defaults to generic wrapper names constantly.
- [ ] **Auth header is `Authorization: Bearer <jwt>`**, required on everything except `/auth/*` and `/kds/orders` (and the two KDS PUT endpoints) which are explicitly open per the contract.
- [ ] **Role guards match the contract** — `requireRole('admin')` vs `requireRole('admin','employee')` vs no role check. Double-check every admin-only write endpoint actually has the guard; AI sometimes writes the route correctly but forgets to apply the middleware.
- [ ] **Status codes**: `201` on create, `200` on read/update/delete-with-message, `404 NOT_FOUND`, `409` for conflicts (`EMAIL_EXISTS`, `NAME_EXISTS`, `CODE_EXISTS`, `HAS_PRODUCTS`, `ORDER_NOT_DRAFT`, `ORDER_NOT_SENT`, `SESSION_ALREADY_OPEN`, `ALREADY_COMPLETED`), `422 VALIDATION_ERROR`, `403 FORBIDDEN`, `401`/`TOKEN_INVALID`/`UNAUTHORIZED`.
- [ ] **Soft vs hard delete is per-resource, not uniform**: products/tables → soft delete (`is_active = false`); categories/coupons/promotions/customers/employees/orders(draft only) → hard delete (categories additionally fail with `409 HAS_PRODUCTS` if referenced).
- [ ] **Timestamps are UTC ISO 8601** — AI sometimes formats dates in local time or a different format. Display formatting (Kolkata timezone) happens **only** in `shared/utils/format.js` on the frontend — never bake timezone conversion into the API response.
- [ ] **IDs are integers**, not strings — `"id": 1` not `"id": "1"`.
- [ ] **Use `shared/constants/*` enums** (`ROLES`, `ORDER_STATUS`, `KDS_STAGES`, `PAYMENT_METHODS`, `DISCOUNT_TYPES`, `ORDER_TYPE`, `UNIT_OF_MEASURE`) instead of hardcoded string literals like `'admin'`, `'paid'`, `'cash'` scattered through new code. If AI hardcodes these, ask it to import from shared constants instead.
- [ ] **Validation lives in `utils/validators.js`** as zod schemas — AI should *add* a new exported schema for your resource, not inline ad-hoc validation in the controller, and not restructure the existing `signupSchema`/`loginSchema`.
- [ ] **WebSocket emits only via `websocket/kds.emitter.js`** exported functions (`emitNewOrder`, `emitStageUpdated`, `emitItemCompleted`, `emitOrderPaid`, `emitCookAssigned`). If AI writes a raw `io.emit(...)` somewhere else, redirect it to use/extend the emitter file.
- [ ] **Category color is read live from the category record, never hardcoded** — any UI showing a category color (product cards, filter tabs, KDS tickets) must pull `category.color` from the API response, so admin edits propagate automatically per spec §6.3.
- [ ] **No new npm packages without announcing** (see §4). If your AI suggests installing something (e.g. `qrcode`, `pdfkit`, `exceljs`, `recharts`), pause and check with the group first.
- [ ] **`routes/index.js`** — confirm your AI's diff touches *only* your `stub('X')` line, not the whole file (AI sometimes rewrites the entire file "for clarity" — reject that, keep the diff minimal).

If you catch any of the above, log it in your tracker's AI Dev Log — even a 1-line entry. These logs become the team's shared "known AI failure modes" list, which is genuinely useful at Checkpoint B/C when someone else hits the same pattern.

---

## 7. When to stop and ask the whole group (don't just push through)

- The schema seems to be missing a column/table you need.
- A response shape in `docs/API-Contract.md` seems wrong, ambiguous, or contradicts the spec sheet.
- You need to add a new npm dependency.
- You're about to edit a shared file (§4) outside your designated section.
- Your AI's fix for one bug breaks the contract for another module's consumer (e.g. changing an order field shape that P3 and P4 both depend on).

Five minutes of group discussion now is cheaper than an integration-day debugging session later.
