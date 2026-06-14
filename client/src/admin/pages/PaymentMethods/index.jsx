import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';
import { request } from '../../../shared/api/client.js';

/* ── display meta ──────────────────────────────────────── */
const METHOD_META = {
  cash: { label: 'Cash',       icon: Banknote,   desc: 'Accept cash payments at the counter.' },
  card: { label: 'Card / POS', icon: CreditCard, desc: 'Physical card machine, swipe or tap.' },
  upi:  { label: 'UPI / QR',   icon: QrCode,     desc: 'Scan-to-pay via any UPI app.' },
};

/* ── toggle switch ─────────────────────────────────────── */
function Toggle({ on, onChange, label, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="w-11 h-6 rounded-full border-2 border-[#1A1A1A] relative flex-shrink-0 overflow-hidden"
      style={{
        background: on ? '#F5C142' : '#fff',
        boxShadow: 'var(--shadow-md)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{
          background: '#1A1A1A',
          left: on ? 'calc(100% - 18px)' : '2px',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}

/* ── main page ─────────────────────────────────────────── */
// Server shape: { method: 'cash'|'card'|'upi', is_enabled: bool, upi_id: string|null }
export default function PaymentMethods() {
  const [methods, setMethods] = useState([]);  // array of server rows
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr('');
    try {
      const r = await request('/settings/payment-methods');
      setMethods(r.payment_methods || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* toggle one method; send full array via PUT */
  const toggle = async (method, nextEnabled) => {
    setSaving(true);
    setApiErr('');

    const prev = methods;
    const next = methods.map((m) =>
      m.method === method ? { ...m, is_enabled: nextEnabled } : m
    );
    setMethods(next);   // optimistic

    try {
      const payload = next.map(({ method: meth, is_enabled, upi_id }) => ({
        method: meth,
        is_enabled,
        upi_id: upi_id ?? null,
      }));
      const r = await request('/settings/payment-methods', {
        method: 'PUT',
        body: payload,
      });
      // Sync with fresh DB state
      if (r.payment_methods) setMethods(r.payment_methods);
    } catch (e) {
      setMethods(prev);                             // revert
      setApiErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <CreditCard size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Payment Methods</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">
        Enable or disable the payment options available to cashiers at the POS terminal.
      </p>

      {apiErr && (
        <div className="border-2 rounded-xl px-4 py-3 text-sm mb-4"
             style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }} role="alert">
          {apiErr}
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-4">
        {loading
          ? [1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-2 border-[#E5E7EB] rounded-xl p-5 flex items-center gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl" style={{ background: '#E5E7EB' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded" style={{ background: '#E5E7EB' }} />
                  <div className="h-3 w-40 rounded" style={{ background: '#E5E7EB' }} />
                </div>
                <div className="w-11 h-6 rounded-full" style={{ background: '#E5E7EB' }} />
              </div>
            ))
          : methods.map(({ method, is_enabled, upi_id }) => {
              const meta = METHOD_META[method];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <div key={method}
                     className="bg-white border-2 border-[#1A1A1A] rounded-xl p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-150"
                     style={{ boxShadow: 'var(--shadow-lg)' }}>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 flex-shrink-0"
                       style={{ background: is_enabled ? '#F5C142' : '#F5F0E8', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
                    <Icon size={20} strokeWidth={2} style={{ color: '#1A1A1A' }} />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#1A1A1A]">{meta.label}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{meta.desc}</p>
                  </div>

                  {/* Status badge */}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2"
                        style={is_enabled
                          ? { background: '#D1FAE5', color: '#065F46' }
                          : { background: '#F3F4F6', color: '#6B7280' }}>
                    {is_enabled ? 'Enabled' : 'Disabled'}
                  </span>

                  {/* Toggle or spinner */}
                  {saving ? (
                    <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  ) : (
                    <Toggle
                      on={is_enabled}
                      disabled={saving}
                      onChange={(v) => toggle(method, v)}
                      label={`${is_enabled ? 'Disable' : 'Enable'} ${meta.label}`}
                    />
                  )}
                </div>
              );
            })}
      </div>

      {/* Note */}
      <div className="mt-6 border-2 border-[#E5E7EB] rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-2">Note</p>
        <p className="text-sm text-[#6B7280]">
          Changes take effect immediately for all cashiers. The UPI QR code is generated from the amount at checkout.
          Configure your UPI VPA in the Settings page before enabling UPI.
        </p>
      </div>
    </div>
  );
}
