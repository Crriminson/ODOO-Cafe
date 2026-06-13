-- ============================================================
--  [SESSION]  sessions
--  Tracks POS sessions opened and closed by employees.
--  All orders belong to exactly one session.
-- ============================================================

CREATE TABLE sessions (
    id                    SERIAL        PRIMARY KEY,
    employee_id           INTEGER       NOT NULL,
    opened_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    closed_at             TIMESTAMPTZ,
    closing_total_orders  INTEGER,                         -- populated on session close
    closing_total_revenue DECIMAL(10,2),                   -- populated on session close
    closing_breakdown     JSONB,                           -- { "cash": 0.00, "card": 0.00, "upi": 0.00 }
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sessions_employee FOREIGN KEY (employee_id) REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_sessions_closed  CHECK (closed_at IS NULL OR closed_at >= opened_at)
);

COMMENT ON COLUMN sessions.closed_at         IS 'NULL while session is open. Populate to close.';
COMMENT ON COLUMN sessions.closing_breakdown IS 'JSON breakdown by payment method, populated on close: {"cash":0.00,"card":0.00,"upi":0.00}';
COMMENT ON COLUMN sessions.closing_total_revenue IS 'Sum of all paid order totals in this session; cached for fast dashboard display';

-- Only one open session per employee at any time
CREATE UNIQUE INDEX idx_sessions_one_open_per_employee
    ON sessions (employee_id)
    WHERE closed_at IS NULL;

-- Indexes
CREATE INDEX idx_sessions_employee  ON sessions (employee_id);
CREATE INDEX idx_sessions_opened_at ON sessions (opened_at DESC);
