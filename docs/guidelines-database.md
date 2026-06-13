# Odoo Cafe POS — Database Schema Guidelines
### Companion to `schema.sql` and `Odoo_Cafe_POS_Spec.md`

These guidelines exist to keep the database consistent, auditable, and safe to build against in parallel. They assume `schema.sql` (v1.0) as the baseline — all 18 tables from Spec §9 plus the reporting views and seed data are already present and verified against the spec.

---

## 1. Price & Total Snapshots

Never write to `order_items.unit_price` or `order_items.line_total` after order creation. These are price snapshots — `unit_price` must be copied from `products.price` at the moment the item is added to the cart, not joined live from the products table. This is what keeps historical orders and reports immune to later price changes.

The same logic applies to `order_discounts.applied_amount`: compute and freeze it when the discount is applied, never recompute it later from the live coupon/promotion row.

---

## 2. Immutable Audit Tables

`order_discounts` and `loyalty_transactions` are insert-only audit logs. Application code must never issue `UPDATE` or `DELETE` against these tables. If a discount or loyalty redemption needs to be reversed, insert a compensating row rather than mutating history — this keeps the audit trail trustworthy for reporting and debugging.

---

## 3. Order Status State Machine

Valid flow: `draft → sent → paid`, or `cancelled` from `draft`/`sent`.

The CHECK constraint only validates allowed *values* (`draft`, `sent`, `paid`, `cancelled`), not allowed *transitions* — that logic belongs in the application layer. Rules to enforce:

- Only `draft` orders are editable or deletable.
- `sent` orders appear on KDS.
- `paid` orders are immutable and feed reporting — no further edits, including totals.

---

## 4. Denormalized Order Totals

`orders.subtotal`, `tax_total`, `discount_total`, and `total` are denormalized for fast reads (dashboards, order lists, receipts). They must be recalculated server-side, inside the same transaction, whenever:

- cart contents change (item added/removed/quantity adjusted),
- a coupon or promotion is applied or removed,
- loyalty points are redeemed.

Never trust a client-supplied total for any of these fields.

---

## 5. Loyalty Points — Transactional Updates

When an order is marked `paid`, the following must happen in **one transaction**:

1. Insert the relevant `loyalty_transactions` row(s) (`earned` and/or `redeemed`).
2. Update `customers.loyalty_points` accordingly.
3. Set `orders.status = 'paid'`.

The `loyalty_points >= 0` CHECK constraint is a safety net, not a substitute for validating the redemption amount against the customer's current balance *before* the update.

---

## 6. Session-Scoped Writes

Every order must belong to exactly one open session (`sessions.closed_at IS NULL`). This is backed by `idx_sessions_one_open_per_employee` (one open session per employee).

When closing a session:

- Populate `closing_total_orders`, `closing_total_revenue`, and `closing_breakdown` (JSONB keyed by `cash` / `card` / `upi`).
- Compute these **once, at close time**, by aggregating that session's paid orders — do not maintain them live throughout the session.

---

## 7. Coupons & Promotions — Logic Lives in the App

The schema stores the *result* (`order_discounts`) and the *rules* (`coupons`, `promotions.rules` JSONB). Matching a cart against promotion rules (minimum quantity for product-level promotions, minimum order amount for order-level promotions) is application logic, not database logic.

`promotions.rules` is the audit snapshot of the rule that was active when a discount fired. For historical accuracy, do not rejoin to the live `promotions` row — rules may change after the fact, and the snapshot is what should appear in reports/receipts for past orders.

---

## 8. Dine-In / Takeaway Constraint

`chk_orders_dinein_table` requires `table_id IS NOT NULL` when `order_type = 'dine_in'`. Order-creation flows must:

- Collect a table selection before allowing dine-in order submission.
- Explicitly pass `table_id = NULL` for takeaway orders.

---

## 9. Category Color Propagation

`categories.color` is joined live everywhere it's displayed (POS product cards, category filter tabs, order view, KDS). A single `UPDATE` to `categories.color` propagates automatically across all surfaces.

Do not cache or copy color values onto products, orders, or anywhere else — this would break the "update once, reflect everywhere" behavior the spec requires.

---

## 10. KDS Queries

All Kitchen Display queries should go through `v_kds_active_orders`, not raw joins. It already filters to:

- `orders.status = 'sent'`,
- `order_items.kds_status != 'completed'`,
- `products.show_on_kds = true`.

When an item is marked complete or a ticket advances stage:

- Update `order_items.is_item_completed` and/or `order_items.kds_status`.
- Emit the corresponding WebSocket event (`item:completed` / `order:stage_updated`) in the **same request handler**, so the database and real-time clients never drift out of sync.

---

## 11. Reporting Queries

Use the provided views — `v_order_summary`, `v_top_products`, `v_top_categories` — rather than re-deriving the joins per endpoint. This keeps `/reports/*` handlers thin, and means any future schema change (e.g., a new joined column) only needs updating in one place.

---

## 12. Coupon Lookup — Case Insensitivity

Always query coupons with:

```sql
WHERE LOWER(code) = LOWER($1) AND is_active = true
```

This uses `idx_coupons_active_ci`. Don't rely on application-side case-folding alone — the database-level unique index (`uq_coupons_code_ci`) is what actually prevents duplicate codes differing only by case, so queries must match that normalization to find them.

---

## 13. Migration Ordering

The creation order documented at the top of `schema.sql` exists for a reason — FKs are one-directional with no forward references:

```
users → categories → products → floors → tables → customers → sessions
→ cooks → cook_category_preferences → orders → order_items → payments
→ coupons → promotions → order_discounts → loyalty_transactions
→ payment_method_settings → app_settings → views → seed data
```

If new tables are added later, append them after their dependencies and update the "TABLE CREATION ORDER" comment block — it's the team's quick reference for migration sequencing and avoids merge conflicts in shared schema files.

---

## 14. Configurable Values via `app_settings`

Don't hardcode the loyalty point rate, cafe name, or receipt footer in application code. Read these from `app_settings` (`loyalty_points_rate`, `cafe_name`, `receipt_footer`) so configuration changes — including last-minute demo-day tweaks — don't require a redeploy.

---

## Quick Reference — Things That Must Always Happen in the Same Transaction

- Cart change → recalculate `orders.subtotal/tax_total/discount_total/total`
- Discount applied → insert `order_discounts` row + update order totals
- Payment confirmed → `orders.status = 'paid'` + `payments` insert + `loyalty_transactions` insert(s) + `customers.loyalty_points` update
- Session close → aggregate paid orders → write `closing_total_orders` / `closing_total_revenue` / `closing_breakdown`
- KDS stage/item update → `order_items` update + WebSocket emit
