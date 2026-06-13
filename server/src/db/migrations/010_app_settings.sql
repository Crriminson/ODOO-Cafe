-- ============================================================
--  [CONFIG]  app_settings
--  Global key-value configuration. Keeps business constants
--  configurable without redeploying code.
-- ============================================================

CREATE TABLE app_settings (
    id          SERIAL        PRIMARY KEY,
    key         VARCHAR(100)  NOT NULL,
    value       TEXT          NOT NULL,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_app_settings_key UNIQUE (key)
);

COMMENT ON TABLE app_settings IS 'Global key-value store. Avoids hardcoded business logic in application code.';

CREATE TRIGGER trg_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Seed app-wide configurable settings
INSERT INTO app_settings (key, value) VALUES
    ('loyalty_points_rate',     '10'),           -- ₹10 spent = 1 point earned
    ('loyalty_redemption_rate', '1'),            -- 1 point = ₹1 discount at redemption
    ('cafe_name',               'Odoo Cafe'),    -- used in UPI deep-link pn parameter
    ('receipt_footer',          'Thank you for visiting Odoo Cafe!');


-- ============================================================
--  REPORTING VIEWS
-- ============================================================

-- Full order context for dashboard and export queries
CREATE OR REPLACE VIEW v_order_summary AS
SELECT
    o.id                      AS order_id,
    o.created_at,
    o.status,
    o.order_type,
    o.subtotal,
    o.tax_total,
    o.discount_total,
    o.tip,
    o.total,
    o.loyalty_discount,
    o.loyalty_points_redeemed,
    s.id                      AS session_id,
    s.opened_at               AS session_opened_at,
    u.id                      AS employee_id,
    u.name                    AS employee_name,
    c.id                      AS customer_id,
    c.name                    AS customer_name,
    t.table_number,
    fl.name                   AS floor_name,
    p.method                  AS payment_method,
    p.amount                  AS payment_amount,
    p.tip                     AS payment_tip
FROM orders o
JOIN  sessions  s  ON s.id  = o.session_id
JOIN  users     u  ON u.id  = o.employee_id
LEFT JOIN customers c  ON c.id  = o.customer_id
LEFT JOIN tables    t  ON t.id  = o.table_id
LEFT JOIN floors    fl ON fl.id = t.floor_id
LEFT JOIN payments  p  ON p.order_id = o.id;

COMMENT ON VIEW v_order_summary IS 'Flattened order view for reporting queries. Avoids repeated joins in dashboard endpoints.';

-- ─────────────────────────────────────────────────────────────
-- KDS active orders — only in-progress items for KDS screen
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_kds_active_orders AS
SELECT
    o.id                      AS order_id,
    o.order_type,
    o.status                  AS order_status,
    t.table_number,
    fl.name                   AS floor_name,
    oi.id                     AS item_id,
    oi.quantity,
    oi.kds_status,
    oi.is_item_completed,
    oi.assigned_cook_id,
    pr.name                   AS product_name,
    pr.estimated_prep_time,
    cat.name                  AS category_name,
    cat.color                 AS category_color,
    ck.name                   AS cook_name
FROM orders o
JOIN  order_items oi  ON oi.order_id   = o.id
JOIN  products    pr  ON pr.id         = oi.product_id   AND pr.show_on_kds = TRUE
JOIN  categories  cat ON cat.id        = pr.category_id
LEFT JOIN tables  t   ON t.id          = o.table_id
LEFT JOIN floors  fl  ON fl.id         = t.floor_id
LEFT JOIN cooks   ck  ON ck.id         = oi.assigned_cook_id
WHERE o.status = 'sent'
  AND oi.kds_status != 'completed';

COMMENT ON VIEW v_kds_active_orders IS 'Real-time KDS feed. Returns only sent orders with non-completed KDS items for products flagged show_on_kds=true.';

-- ─────────────────────────────────────────────────────────────
-- Top products — quantity sold and revenue per product
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_top_products AS
SELECT
    pr.id                              AS product_id,
    pr.name                            AS product_name,
    cat.name                           AS category_name,
    SUM(oi.quantity)                   AS total_quantity,
    SUM(oi.line_total)                 AS total_revenue
FROM order_items oi
JOIN orders   o   ON o.id   = oi.order_id   AND o.status = 'paid'
JOIN products pr  ON pr.id  = oi.product_id
JOIN categories cat ON cat.id = pr.category_id
GROUP BY pr.id, pr.name, cat.name;

-- ─────────────────────────────────────────────────────────────
-- Top categories — category-wise revenue
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_top_categories AS
SELECT
    cat.id                             AS category_id,
    cat.name                           AS category_name,
    cat.color,
    COUNT(DISTINCT o.id)               AS total_orders,
    SUM(oi.line_total)                 AS total_revenue
FROM order_items oi
JOIN orders     o   ON o.id   = oi.order_id   AND o.status = 'paid'
JOIN products   pr  ON pr.id  = oi.product_id
JOIN categories cat ON cat.id = pr.category_id
GROUP BY cat.id, cat.name, cat.color;
