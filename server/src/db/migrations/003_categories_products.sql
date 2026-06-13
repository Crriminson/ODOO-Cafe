-- ============================================================
--  [CATALOG]  categories
--  Color-coded product groups. Color propagates live to POS
--  cards, filter tabs, order view, and KDS.
-- ============================================================

CREATE TABLE categories (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7)   NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categories_name  UNIQUE (name),
    CONSTRAINT chk_categories_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE  categories       IS 'Product categories. Color propagates to all UI surfaces automatically.';
COMMENT ON COLUMN categories.color IS 'Valid 6-digit hex string e.g. #FF5733';

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
--  [CATALOG]  products
--  Menu items sold at the POS terminal.
-- ============================================================

CREATE TABLE products (
    id                  SERIAL        PRIMARY KEY,
    name                VARCHAR(150)  NOT NULL,
    category_id         INTEGER       NOT NULL,
    price               DECIMAL(10,2) NOT NULL,
    unit_of_measure     VARCHAR(20)   NOT NULL DEFAULT 'piece',
    tax_rate            DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    description         TEXT,
    estimated_prep_time INTEGER,                          -- minutes; drives cook allocation
    show_on_kds         BOOLEAN       NOT NULL DEFAULT TRUE,
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_products_category   FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,

    CONSTRAINT chk_products_price     CHECK (price >= 0),
    CONSTRAINT chk_products_tax_rate  CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_products_unit      CHECK (unit_of_measure IN ('piece', 'kg', 'litre')),
    CONSTRAINT chk_products_prep_time CHECK (estimated_prep_time IS NULL OR estimated_prep_time > 0)
);

COMMENT ON COLUMN products.estimated_prep_time IS 'Minutes per unit; used by cook allocation algorithm on KDS';
COMMENT ON COLUMN products.show_on_kds         IS 'Only TRUE products appear on the Kitchen Display';
COMMENT ON COLUMN products.is_active           IS 'false = soft-deleted; hidden from POS product cards';
COMMENT ON COLUMN products.tax_rate            IS 'Per-product tax percentage e.g. 5.00 = 5%';
COMMENT ON COLUMN products.price               IS 'Current catalogue price; order_items.unit_price is a snapshot at order time';

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_products_category_active ON products (category_id)  WHERE is_active = TRUE;
CREATE INDEX idx_products_kds             ON products (show_on_kds)   WHERE is_active = TRUE;
-- Full-text search for POS product search bar
CREATE INDEX idx_products_fts             ON products USING gin (to_tsvector('english', name));
-- Trigram index for partial / fuzzy matching
CREATE INDEX idx_products_name_trgm       ON products USING gin (name gin_trgm_ops);
