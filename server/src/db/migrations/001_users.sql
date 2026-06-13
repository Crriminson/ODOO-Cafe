-- ============================================================
--  EXTENSIONS & TRIGGER FUNCTION
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
--  [AUTH]  users
--  All admin and employee accounts in one table.
-- ============================================================

CREATE TABLE users (
    id            SERIAL        PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL,
    password_hash TEXT          NOT NULL,
    role          VARCHAR(20)   NOT NULL,
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_role CHECK (role IN ('admin', 'employee'))
);

COMMENT ON TABLE  users            IS 'All system accounts — admins configure backend; employees operate the POS terminal.';
COMMENT ON COLUMN users.role       IS 'admin → backend/config access only | employee → POS terminal only';
COMMENT ON COLUMN users.is_active  IS 'false = archived (login blocked), record retained for audit/reporting linkage';

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Indexes
CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_role_active ON users (role) WHERE is_active = TRUE;
