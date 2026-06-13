-- ============================================================
--  [CUSTOMER]  customers
--  First-class customer entity with loyalty point balance.
-- ============================================================

CREATE TABLE customers (
    id             SERIAL        PRIMARY KEY,
    name           VARCHAR(100)  NOT NULL,
    email          VARCHAR(150),
    phone          VARCHAR(20),
    address        TEXT,
    loyalty_points INTEGER       NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customers_email   UNIQUE (email),
    CONSTRAINT chk_customers_loyalty CHECK (loyalty_points >= 0)
);

COMMENT ON COLUMN customers.loyalty_points IS 'Running balance; credited on paid orders, debited on redemption. Never goes negative.';
COMMENT ON COLUMN customers.email          IS 'Used for receipt delivery; optional but unique when provided';

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_customers_email     ON customers (email);
CREATE INDEX idx_customers_phone     ON customers (phone);
-- Trigram for name search in POS customer lookup
CREATE INDEX idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);


-- ============================================================
--  [CUSTOMER]  loyalty_transactions
--  Immutable audit trail for all loyalty point movements.
--  The customers.loyalty_points balance is the authoritative
--  running total; this table provides the full audit history.
-- ============================================================

CREATE TABLE loyalty_transactions (
    id          SERIAL      PRIMARY KEY,
    customer_id INTEGER     NOT NULL,
    order_id    INTEGER     NOT NULL, -- FK constraint added in 006
    type        VARCHAR(20) NOT NULL,
    points      INTEGER     NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_lt_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT chk_lt_type    CHECK (type IN ('earned', 'redeemed')),
    CONSTRAINT chk_lt_points  CHECK (points > 0)
);

COMMENT ON TABLE  loyalty_transactions      IS 'Immutable insert-only log. Never UPDATE or DELETE rows.';
COMMENT ON COLUMN loyalty_transactions.type IS 'earned: points added after order payment | redeemed: points spent as a discount';
COMMENT ON COLUMN loyalty_transactions.points IS 'Always positive. The type column determines the direction of the movement.';

-- Indexes
CREATE INDEX idx_lt_customer ON loyalty_transactions (customer_id);
CREATE INDEX idx_lt_order    ON loyalty_transactions (order_id);
