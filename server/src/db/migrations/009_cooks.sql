-- ============================================================
--  [KITCHEN]  cooks
--  Kitchen staff profiles used by the cook allocation system.
--  Defined before order_items to satisfy FK ordering.
-- ============================================================

CREATE TABLE cooks (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cooks IS 'Kitchen staff. Only active cooks receive auto-allocation assignments.';

CREATE TRIGGER trg_cooks_updated_at
    BEFORE UPDATE ON cooks
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_cooks_active ON cooks (is_active) WHERE is_active = TRUE;


-- ============================================================
--  [KITCHEN]  cook_category_preferences
--  Many-to-many: which product categories each cook prefers.
--  The allocation algorithm weights preferences when assigning
--  an incoming order to a cook.
-- ============================================================

CREATE TABLE cook_category_preferences (
    id          SERIAL  PRIMARY KEY,
    cook_id     INTEGER NOT NULL,
    category_id INTEGER NOT NULL,

    CONSTRAINT fk_ccp_cook     FOREIGN KEY (cook_id)     REFERENCES cooks      (id) ON DELETE CASCADE,
    CONSTRAINT fk_ccp_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    CONSTRAINT uq_ccp_pair     UNIQUE (cook_id, category_id)
);

COMMENT ON TABLE cook_category_preferences IS 'Cook preference matrix. Used alongside workload and estimated_prep_time to assign incoming orders.';

-- Indexes
CREATE INDEX idx_ccp_cook     ON cook_category_preferences (cook_id);
CREATE INDEX idx_ccp_category ON cook_category_preferences (category_id);


-- ============================================================
--  ADD DEFERRED CONSTRAINTS
-- ============================================================

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_items_cook FOREIGN KEY (assigned_cook_id) REFERENCES cooks (id) ON DELETE SET NULL;
