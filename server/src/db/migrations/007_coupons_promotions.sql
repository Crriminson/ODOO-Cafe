-- ============================================================
--  [DISCOUNT]  coupons
--  Manual discount codes entered by the employee at the POS.
-- ============================================================

CREATE TABLE coupons (
    id              SERIAL        PRIMARY KEY,
    code            VARCHAR(50)   NOT NULL,
    discount_type   VARCHAR(20)   NOT NULL,
    discount_value  DECIMAL(10,2) NOT NULL,
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_coupons_type     CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT chk_coupons_value    CHECK (discount_value > 0),
    CONSTRAINT chk_coupons_pct_max  CHECK (discount_type != 'percentage' OR discount_value <= 100)
);

COMMENT ON COLUMN coupons.code IS 'Case-insensitive; uniqueness enforced via functional index on LOWER(code)';

CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Case-insensitive uniqueness on code
CREATE UNIQUE INDEX uq_coupons_code_ci    ON coupons (LOWER(code));
-- Fast lookup at POS redemption time (only active coupons)
CREATE INDEX        idx_coupons_active_ci ON coupons (LOWER(code)) WHERE is_active = TRUE;


-- ============================================================
--  [DISCOUNT]  promotions
--  Automated promotions — no code entry needed.
--  Trigger either on product quantity or order amount.
--  Full rule config stored in JSONB for audit and extensibility.
-- ============================================================

CREATE TABLE promotions (
    id                SERIAL        PRIMARY KEY,
    name              VARCHAR(150)  NOT NULL,
    applies_to        VARCHAR(20)   NOT NULL,
    product_id        INTEGER,                    -- required if applies_to = 'product'
    min_quantity      INTEGER,                    -- required if applies_to = 'product'
    min_order_amount  DECIMAL(10,2),              -- required if applies_to = 'order'
    discount_type     VARCHAR(20)   NOT NULL,
    discount_value    DECIMAL(10,2) NOT NULL,
    rules             JSONB         NOT NULL DEFAULT '{}', -- full rule snapshot for audit
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_promotions_product   FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL,

    CONSTRAINT chk_promotions_applies  CHECK (applies_to IN ('product', 'order')),
    CONSTRAINT chk_promotions_type     CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT chk_promotions_value    CHECK (discount_value > 0),
    CONSTRAINT chk_promotions_pct_max  CHECK (discount_type != 'percentage' OR discount_value <= 100),
    -- Product promotions must specify a target product and minimum quantity
    CONSTRAINT chk_promotions_product_cfg CHECK (
        applies_to != 'product' OR (
            product_id IS NOT NULL
            AND min_quantity IS NOT NULL
            AND min_quantity > 0
        )
    ),
    -- Order promotions must specify a minimum cart amount
    CONSTRAINT chk_promotions_order_cfg CHECK (
        applies_to != 'order' OR (
            min_order_amount IS NOT NULL
            AND min_order_amount > 0
        )
    )
);

COMMENT ON COLUMN promotions.rules IS 'JSONB snapshot of the full rule config — stored for audit trail and future promotion engine extensibility';

CREATE TRIGGER trg_promotions_updated_at
    BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_promotions_product_active ON promotions (product_id)
    WHERE applies_to = 'product' AND is_active = TRUE;
CREATE INDEX idx_promotions_order_active   ON promotions (min_order_amount)
    WHERE applies_to = 'order' AND is_active = TRUE;


-- ============================================================
--  [DISCOUNT]  order_discounts
--  Immutable record of which coupon or promotion was applied
--  to an order, and the actual rupee amount deducted.
-- ============================================================

CREATE TABLE order_discounts (
    id              SERIAL        PRIMARY KEY,
    order_id        INTEGER       NOT NULL,
    coupon_id       INTEGER,                    -- set when source = manual coupon
    promotion_id    INTEGER,                    -- set when source = automated promotion
    discount_type   VARCHAR(20)   NOT NULL,
    discount_value  DECIMAL(10,2) NOT NULL,
    applied_amount  DECIMAL(10,2) NOT NULL,     -- actual ₹ deducted after applying type logic
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_od_order     FOREIGN KEY (order_id)     REFERENCES orders     (id) ON DELETE CASCADE,
    CONSTRAINT fk_od_coupon    FOREIGN KEY (coupon_id)    REFERENCES coupons    (id) ON DELETE SET NULL,
    CONSTRAINT fk_od_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE SET NULL,

    CONSTRAINT chk_od_type         CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT chk_od_value        CHECK (discount_value > 0),
    CONSTRAINT chk_od_applied      CHECK (applied_amount >= 0),
    -- Each row must reference exactly one discount source
    CONSTRAINT chk_od_single_source CHECK (
        (coupon_id IS NOT NULL AND promotion_id IS NULL) OR
        (coupon_id IS NULL AND promotion_id IS NOT NULL)
    )
);

COMMENT ON COLUMN order_discounts.applied_amount IS 'Actual ₹ deducted — for percentage types this may differ from discount_value (e.g. 10% of ₹500 = ₹50)';
COMMENT ON TABLE  order_discounts                IS 'Immutable audit of applied discounts. Do not update rows — insert only.';

-- Indexes
CREATE INDEX idx_od_order     ON order_discounts (order_id);
CREATE INDEX idx_od_coupon    ON order_discounts (coupon_id)    WHERE coupon_id    IS NOT NULL;
CREATE INDEX idx_od_promotion ON order_discounts (promotion_id) WHERE promotion_id IS NOT NULL;
