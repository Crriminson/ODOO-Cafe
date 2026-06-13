import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Banknote, QrCode, Loader2 } from 'lucide-react';
import { request } from '../../../shared/api/client.js';

/* ── helpers ─────────────────────────────────────────── */
const METHOD_META = {
  cash:   { label: 'Cash',       icon: Banknote,    desc: 'Accept cash payments at the counter.' },
  card:   { label: 'Card / POS', icon: CreditCard,  desc: 'Physical card machine, swipe or tap.' },
  upi:    { label: 'UPI / QR',   icon: QrCode,      desc: 'Scan-to-pay via any UPI app.' },
};

/* Use local state for now; replace with API calls once endpoint exists */
const DEFAULT_METHODS = [
  { id: 'cash', enabled: true },
  { id: 'card', enabled: true },
  { id: 'upi',  enabled: false },
];

/* ── toggle component ────────────────────────────────── */
function Toggle({ enabled, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className="w-11 h-6 rounded-full border-2 border-[#1A1A1A] relative transition-colors duration-150 flex-shrink-0"
      style={{ background: enabled ? '#A67FA1' : '#fff', boxShadow: 'var(--shadow-md)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-150"
        style={{
          background: '#1A1A1A',
          transform: enabled ? 'translateX(1.375rem)' : 'translateX(0.125rem)',
        }}
      />
    </button>
  );
}

/* ── main page ───────────────────────────────────────── */
export default function PaymentMethods() {
  const [methods, setMethods] = useState(DEFAULT_METHODS);
  const [saving, setSaving] = useState(null); // id of method being saved

  const toggle = async (id, nextEnabled) => {
    setSaving(id);
    // Optimistic update
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: nextEnabled } : m))
    );
    try {
      await request(`/settings/payment-methods/${id}`, {
        method: 'PATCH',
        body: { enabled: nextEnabled },
      });
    } catch {
      // Revert on failure
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: !nextEnabled } : m))
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#A67FA1', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <CreditCard size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Payment Methods</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">
        Enable or disable the payment options available to cashiers at the POS terminal.
      </p>

      {/* Cards grid */}
      <div className="grid gap-4">
        {methods.map(({ id, enabled }) => {
          const meta = METHOD_META[id];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={id}
                 className="bg-white border-2 border-[#1A1A1A] rounded-xl p-5 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-150"
                 style={{ boxShadow: 'var(--shadow-lg)' }}>
              {/* Method icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 flex-shrink-0"
                   style={{ background: enabled ? '#A67FA1' : '#F5F0E8', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
                <Icon size={20} strokeWidth={2} style={{ color: '#1A1A1A' }} />
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-[#1A1A1A]">{meta.label}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{meta.desc}</p>
              </div>

              {/* Status badge */}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2"
                    style={enabled
                      ? { background: '#D1FAE5', color: '#065F46' }
                      : { background: '#F3F4F6', color: '#6B7280' }}>
                {enabled ? 'Enabled' : 'Disabled'}
              </span>

              {/* Toggle */}
              {saving === id ? (
                <Loader2 size={18} className="animate-spin flex-shrink-0" style={{ color: '#9CA3AF' }} />
              ) : (
                <Toggle
                  enabled={enabled}
                  onChange={(v) => toggle(id, v)}
                  label={`${enabled ? 'Disable' : 'Enable'} ${meta.label}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Info panel */}
      <div className="mt-6 border-2 border-[#E5E7EB] rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-2">Note</p>
        <p className="text-sm text-[#6B7280]">
          Changes take effect immediately for all cashiers. The UPI QR code is generated from the amount at checkout.
          Configure the UPI VPA in the Settings page.
        </p>
      </div>
    </div>
  );
}


