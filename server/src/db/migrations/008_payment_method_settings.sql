-- ============================================================
--  [CONFIG]  payment_method_settings
--  Admin-controlled enable/disable toggles for each payment
--  method. UPI requires a UPI ID to be saved before enabling.
-- ============================================================

CREATE TABLE payment_method_settings (
    id          SERIAL      PRIMARY KEY,
    method      VARCHAR(20) NOT NULL,
    is_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,
    upi_id      TEXT,                              -- e.g. cafe@ybl — UPI only
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_pms_method    UNIQUE (method),
    CONSTRAINT chk_pms_method   CHECK (method IN ('cash', 'card', 'upi')),
    -- UPI cannot be enabled without a UPI ID saved
    CONSTRAINT chk_pms_upi_gate CHECK (
        method != 'upi' OR is_enabled = FALSE OR upi_id IS NOT NULL
    )
);

COMMENT ON COLUMN payment_method_settings.upi_id IS 'VPA e.g. cafe@ybl. Client generates the UPI deep-link: upi://pay?pa=<upi_id>&pn=<cafe_name>&am=<total>&cu=INR';

CREATE TRIGGER trg_pms_updated_at
    BEFORE UPDATE ON payment_method_settings
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Initialise standard payment methods (disabled by default)
INSERT INTO payment_method_settings (method, is_enabled) VALUES
    ('cash',  FALSE),
    ('card',  FALSE),
    ('upi',   FALSE);
