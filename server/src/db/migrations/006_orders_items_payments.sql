-- ============================================================
--  [ORDER]  orders
--  Core order record. One per transaction (dine-in or takeaway).
-- ============================================================

CREATE TABLE orders (
    id                      SERIAL        PRIMARY KEY,
    session_id              INTEGER       NOT NULL,
    employee_id             INTEGER       NOT NULL,
    customer_id             INTEGER,                        -- optional; NULL for anonymous orders
    table_id                INTEGER,                        -- NULL for takeaway
    order_type              VARCHAR(20)   NOT NULL,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'draft',
    subtotal                DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_total               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_total          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tip                     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total                   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    loyalty_points_redeemed INTEGER       NOT NULL DEFAULT 0,
    loyalty_discount        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_orders_session  FOREIGN KEY (session_id)  REFERENCES sessions  (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_employee FOREIGN KEY (employee_id) REFERENCES users      (id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers  (id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_table    FOREIGN KEY (table_id)    REFERENCES tables     (id) ON DELETE SET NULL,

    CONSTRAINT chk_orders_type          CHECK (order_type IN ('dine_in', 'takeaway')),
    CONSTRAINT chk_orders_status        CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    -- Dine-in orders must have a table; takeaway orders must not
    CONSTRAINT chk_orders_dinein_table  CHECK (
        NOT (order_type = 'dine_in'  AND table_id IS NULL)
    ),
    CONSTRAINT chk_orders_amounts       CHECK (
        subtotal >= 0
        AND tax_total >= 0
        AND discount_total >= 0
        AND tip >= 0
        AND total >= 0
        AND loyalty_discount >= 0
        AND loyalty_points_redeemed >= 0
    )
);

COMMENT ON COLUMN orders.status                  IS 'draft→sent (to kitchen)→paid / cancelled';
COMMENT ON COLUMN orders.subtotal                IS 'Sum of all order_items.line_total before tax and discounts';
COMMENT ON COLUMN orders.total                   IS 'subtotal + tax_total - discount_total - loyalty_discount + tip';
COMMENT ON COLUMN orders.table_id                IS 'NULL for takeaway; NOT NULL for dine_in (enforced by constraint)';
COMMENT ON COLUMN orders.loyalty_discount        IS 'Amount discounted by redeeming loyalty points';
COMMENT ON COLUMN orders.loyalty_points_redeemed IS 'Points spent on this order; deducted from customers.loyalty_points on payment';

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_orders_session   ON orders (session_id);
CREATE INDEX idx_orders_employee  ON orders (employee_id);
CREATE INDEX idx_orders_customer  ON orders (customer_id) WHERE customer_id IS NOT NULL;
-- Active table orders (for floor view: which tables are occupied)
CREATE INDEX idx_orders_table_active ON orders (table_id)
    WHERE table_id IS NOT NULL AND status NOT IN ('paid', 'cancelled');
CREATE INDEX idx_orders_status    ON orders (status);
-- Reporting: paid orders by date (primary query pattern for dashboards)
CREATE INDEX idx_orders_paid_date ON orders (created_at DESC) WHERE status = 'paid';


-- ============================================================
--  [ORDER]  order_items
--  Line items for each order. Price is snapshotted at creation.
-- ============================================================

CREATE TABLE order_items (
    id                SERIAL        PRIMARY KEY,
    order_id          INTEGER       NOT NULL,
    product_id        INTEGER       NOT NULL,
    quantity          INTEGER       NOT NULL,
    unit_price        DECIMAL(10,2) NOT NULL,   -- price snapshot, not affected by later product edits
    line_total        DECIMAL(10,2) NOT NULL,   -- quantity * unit_price (before any item-level discount)
    kds_status        VARCHAR(20)   NOT NULL DEFAULT 'to_cook',
    is_item_completed BOOLEAN       NOT NULL DEFAULT FALSE,
    assigned_cook_id  INTEGER,                  -- FK constraint added in 009
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)         REFERENCES orders   (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)       REFERENCES products (id) ON DELETE RESTRICT,

    CONSTRAINT chk_order_items_qty       CHECK (quantity > 0),
    CONSTRAINT chk_order_items_price     CHECK (unit_price >= 0),
    CONSTRAINT chk_order_items_total     CHECK (line_total >= 0),
    CONSTRAINT chk_order_items_kds      CHECK (kds_status IN ('to_cook', 'preparing', 'completed'))
);

COMMENT ON COLUMN order_items.unit_price        IS 'Price snapshot at order creation time — insulated from future product price changes';
COMMENT ON COLUMN order_items.kds_status        IS 'Whole-ticket stage on KDS: to_cook → preparing → completed';
COMMENT ON COLUMN order_items.is_item_completed IS 'Per-item strikethrough on KDS. Independent of kds_status.';
COMMENT ON COLUMN order_items.assigned_cook_id  IS 'Set by cook allocation algorithm; can be manually overridden on KDS';

CREATE TRIGGER trg_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);
-- KDS query: fetch all in-progress items efficiently
CREATE INDEX idx_order_items_kds_active ON order_items (kds_status, order_id)
    WHERE is_item_completed = FALSE;
-- Reporting: product sales aggregation (top products table)
CREATE INDEX idx_order_items_reporting ON order_items (product_id, line_total)
    INCLUDE (quantity);


-- ============================================================
--  [ORDER]  payments
--  One payment record per completed order.
--  Tip is captured separately for accurate revenue analytics.
-- ============================================================

CREATE TABLE payments (
    id                    SERIAL        PRIMARY KEY,
    order_id              INTEGER       NOT NULL,
    method                VARCHAR(20)   NOT NULL,
    amount                DECIMAL(10,2) NOT NULL,   -- order total charged (excluding tip for cleaner reporting)
    tip                   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    transaction_reference TEXT,                      -- required when method = 'card'
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_payments_order          FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT,
    CONSTRAINT chk_payments_method        CHECK (method IN ('cash', 'card', 'upi')),
    CONSTRAINT chk_payments_amount        CHECK (amount > 0),
    CONSTRAINT chk_payments_tip           CHECK (tip >= 0),
    -- Card payments must have a reference number
    CONSTRAINT chk_payments_card_ref      CHECK (method != 'card' OR transaction_reference IS NOT NULL)
);

COMMENT ON COLUMN payments.amount                IS 'Amount charged to customer = order total. Stored separately from tip for cleaner reporting.';
COMMENT ON COLUMN payments.transaction_reference IS 'Required for card payments (employee-entered); NULL for cash and UPI';
COMMENT ON COLUMN payments.tip                   IS 'Tip amount; added on top of order total at payment time';

-- Indexes
CREATE INDEX idx_payments_order        ON payments (order_id);
CREATE INDEX idx_payments_method_date  ON payments (method, created_at DESC);


-- ============================================================
--  ADD DEFERRED CONSTRAINTS
-- ============================================================

ALTER TABLE loyalty_transactions
    ADD CONSTRAINT fk_lt_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE;
