-- ============================================================
--  [VENUE]  floors
--  Physical floors of the cafe, each containing tables.
-- ============================================================

CREATE TABLE floors (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_floors_name UNIQUE (name)
);

CREATE TRIGGER trg_floors_updated_at
    BEFORE UPDATE ON floors
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ============================================================
--  [VENUE]  tables
--  Dine-in tables grouped under floors.
-- ============================================================

CREATE TABLE tables (
    id           SERIAL      PRIMARY KEY,
    floor_id     INTEGER     NOT NULL,
    table_number INTEGER     NOT NULL,
    seats        INTEGER     NOT NULL,
    is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tables_floor            FOREIGN KEY (floor_id) REFERENCES floors (id) ON DELETE RESTRICT,
    CONSTRAINT uq_tables_number_per_floor UNIQUE (floor_id, table_number),
    CONSTRAINT chk_tables_seats           CHECK (seats > 0),
    CONSTRAINT chk_tables_number         CHECK (table_number > 0)
);

COMMENT ON COLUMN tables.is_active    IS 'Inactive tables are hidden from the POS floor pop-up';
COMMENT ON COLUMN tables.table_number IS 'Unique per floor (enforced by composite unique constraint)';

CREATE TRIGGER trg_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_tables_floor_active ON tables (floor_id) WHERE is_active = TRUE;
