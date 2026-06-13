import { useState, useEffect } from 'react';
import { getPaymentMethods, updatePaymentMethods } from '../../../shared/api/settings.api.js';

// ─── Inject styles once ───────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('pm-styles')) {
  const s = document.createElement('style');
  s.id = 'pm-styles';
  s.textContent = `
    @keyframes pm-spin { to { transform: rotate(360deg); } }

    /* Toggle track */
    .pm-toggle-track {
      position: relative; display: inline-flex; align-items: center;
      width: 48px; height: 26px; border-radius: 13px;
      border: none; cursor: pointer; padding: 0;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .pm-toggle-track[aria-checked="true"]  { background: #6366f1; }
    .pm-toggle-track[aria-checked="false"] { background: #d1d5db; }
    .pm-toggle-track:disabled              { background: #e5e7eb; cursor: not-allowed; opacity: 0.6; }
    .pm-toggle-track:focus-visible         { outline: 2px solid #6366f1; outline-offset: 2px; }

    /* Toggle thumb */
    .pm-toggle-thumb {
      position: absolute; top: 3px; width: 20px; height: 20px;
      background: #fff; border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: left 0.2s;
      pointer-events: none;
    }
    .pm-toggle-track[aria-checked="true"]  .pm-toggle-thumb { left: 25px; }
    .pm-toggle-track[aria-checked="false"] .pm-toggle-thumb { left: 3px; }

    .pm-input:hover, .pm-input:focus { border-color: #6366f1 !important; outline: none; }
    .pm-btn:disabled { opacity: .5; cursor: not-allowed; }
    .pm-btn:hover:not(:disabled) { opacity: 0.88; }
  `;
  document.head.appendChild(s);
}

// ─── Toggle (role="switch", aria-checked) ─────────────────────────────────────
function Toggle({ checked, onChange, disabled = false, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className="pm-toggle-track"
      onClick={() => !disabled && onChange(!checked)}
      type="button"
    >
      <span className="pm-toggle-thumb" />
    </button>
  );
}

// ─── Payment method card ───────────────────────────────────────────────────────
function MethodCard({ method, label, icon, state, onChange }) {
  const isUpi = method === 'upi';

  // UPI toggle disabled until upi_id has a value
  const upiToggleDisabled = isUpi && (!state.upi_id || state.upi_id.trim() === '');

  return (
    <div style={S.card}>
      <div style={S.cardRow}>
        {/* Icon + label */}
        <div style={S.cardLeft}>
          <span style={S.icon}>{icon}</span>
          <div>
            <p style={S.methodLabel}>{label}</p>
            {isUpi && (
              <p style={S.methodHint}>
                Enter UPI ID below before enabling
              </p>
            )}
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: state.is_enabled ? '#6366f1' : '#9ca3af', fontWeight: 500 }}>
            {state.is_enabled ? 'Enabled' : 'Disabled'}
          </span>
          <Toggle
            id={`toggle-${method}`}
            checked={state.is_enabled}
            disabled={upiToggleDisabled}
            onChange={(val) => onChange(method, 'is_enabled', val)}
          />
        </div>
      </div>

      {/* UPI ID field */}
      {isUpi && (
        <div style={S.upiRow}>
          <label htmlFor="upi-id-input" style={S.upiLabel}>UPI ID (VPA)</label>
          <input
            id="upi-id-input"
            className="pm-input"
            type="text"
            placeholder="e.g. cafe@ybl"
            value={state.upi_id || ''}
            onChange={(e) => onChange(method, 'upi_id', e.target.value || null)}
            style={S.input}
          />
          {upiToggleDisabled && (
            <p style={S.hint}>Enter a UPI ID to unlock the toggle</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentMethodsPage() {
  // Keyed by method string: { method, is_enabled, upi_id }
  const [methods, setMethods]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [loadErr, setLoadErr]     = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadErr('');
      try {
        const res = await getPaymentMethods();
        if (!cancelled) {
          // Index by method for easy access
          const map = {};
          for (const m of res.payment_methods) {
            map[m.method] = { ...m };
          }
          setMethods(map);
        }
      } catch (err) {
        if (!cancelled) setLoadErr(err.message || 'Failed to load payment methods.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Field change ──────────────────────────────────────────────────────────
  function handleChange(method, field, value) {
    setSaveErr('');
    setSaveSuccess(false);
    setMethods((prev) => ({
      ...prev,
      [method]: { ...prev[method], [field]: value },
    }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveErr('');
    setSaveSuccess(false);

    const payload = Object.values(methods).map(({ method, is_enabled, upi_id }) => ({
      method,
      is_enabled,
      upi_id: upi_id || null,
    }));

    try {
      const res = await updatePaymentMethods(payload);
      // Refresh from server response
      const map = {};
      for (const m of res.payment_methods) { map[m.method] = { ...m }; }
      setMethods(map);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err.fields && err.fields.length > 0) {
        setSaveErr(err.fields.map((f) => `${f.field}: ${f.message}`).join(' · '));
      } else {
        setSaveErr(err.message || 'Failed to save.');
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const METHOD_CONFIG = [
    { method: 'cash', label: 'Cash',         icon: '💵' },
    { method: 'card', label: 'Card / POS',   icon: '💳' },
    { method: 'upi',  label: 'UPI / QR Pay', icon: '📱' },
  ];

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Payment Methods</h1>
          <p style={S.pageSubtitle}>
            Control which payment methods are available at the POS terminal.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={S.stateBox}>
          <div style={S.spinner} />
          <span style={S.stateText}>Loading…</span>
        </div>
      ) : loadErr ? (
        <div style={{ ...S.stateBox, flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <p style={{ ...S.stateText, color: '#ef4444' }}>{loadErr}</p>
          <button onClick={() => window.location.reload()} style={{ ...S.btn, ...S.btnGhost }}>Retry</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            {METHOD_CONFIG.map(({ method, label, icon }) =>
              methods[method] ? (
                <MethodCard
                  key={method}
                  method={method}
                  label={label}
                  icon={icon}
                  state={methods[method]}
                  onChange={handleChange}
                />
              ) : null
            )}
          </div>

          {/* Save button + feedback */}
          <div style={S.saveRow}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="pm-btn"
              style={{ ...S.btn, ...S.btnPrimary }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>

            {saveSuccess && (
              <span style={S.successMsg}>✓ Saved successfully</span>
            )}
            {saveErr && (
              <span style={S.errMsg}>{saveErr}</span>
            )}
          </div>

          {/* Info note */}
          <div style={S.infoBox}>
            <span style={{ fontSize: 16 }}>ℹ️</span>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Changes take effect immediately on the POS terminal. Disabling a method
              mid-session will block it for new orders — existing orders are unaffected.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    padding: '32px 40px',
    maxWidth: 680,
    margin: '0 auto',
    fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
    color: '#111827',
  },
  header:      { marginBottom: 28 },
  pageTitle:   { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px', color: '#0f172a' },
  pageSubtitle:{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' },

  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  icon:        { fontSize: 28, lineHeight: 1 },
  methodLabel: { margin: 0, fontSize: 16, fontWeight: 600, color: '#0f172a' },
  methodHint:  { margin: '2px 0 0', fontSize: 12, color: '#9ca3af' },

  // UPI ID field
  upiRow: {
    marginTop: 18,
    paddingTop: 18,
    borderTop: '1px dashed #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  upiLabel: { fontSize: 13, fontWeight: 600, color: '#374151' },
  hint:     { margin: 0, fontSize: 12, color: '#f59e0b' },

  input: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#fff',
    color: '#111827',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: 320,
  },

  // Save row
  saveRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  successMsg: { fontSize: 14, color: '#16a34a', fontWeight: 500 },
  errMsg:     { fontSize: 14, color: '#ef4444' },

  // Info box
  infoBox: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '14px 18px',
  },

  // Buttons
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '9px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 9,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    whiteSpace: 'nowrap',
  },
  btnPrimary: { background: '#6366f1', color: '#fff' },
  btnGhost:   { background: '#f3f4f6', color: '#374151' },

  // States
  stateBox:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 140 },
  stateText: { fontSize: 14, color: '#6b7280' },
  spinner: {
    width: 20, height: 20,
    border: '2px solid #e5e7eb',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'pm-spin 0.7s linear infinite',
  },
};
