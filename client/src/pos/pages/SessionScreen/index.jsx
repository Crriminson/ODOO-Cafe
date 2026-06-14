import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentSession,
  openSession,
  closeSession,
  getLastClosedSession,
} from '../../../shared/api/sessions.api.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateKolkata = (dateVal) => {
  if (!dateVal) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date(dateVal));
  } catch {
    return '';
  }
};

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed #E5E7EB' }}>
      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', disabled = false }) {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '12px 20px',
        fontSize: 13,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        border: '2px solid #1A1A1A',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isPrimary ? '#F5C142' : '#fff',
        color: '#1A1A1A',
        boxShadow: disabled ? 'none' : '3px 3px 0 #1A1A1A',
        transition: 'transform 0.1s, box-shadow 0.1s',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '3px 5px 0 #1A1A1A'; }}}
      onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '3px 3px 0 #1A1A1A'; }}}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SessionScreen() {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [lastSession, setLastSession]   = useState(null);
  const [error, setError]             = useState(null);
  const [closedSummary, setClosedSummary] = useState(null);

  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentRes = await getCurrentSession();
      if (currentRes.session) {
        setActiveSession(currentRes.session);
        setLastSession(null);
      } else {
        setActiveSession(null);
        const lastRes = await getLastClosedSession();
        setLastSession(lastRes.session);
      }
    } catch (err) {
      setError(err.message || 'Failed to load session details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessionData(); }, []);

  const handleOpenSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await openSession();
      setActiveSession(res.session);
      navigate('/pos/order-type');
    } catch (err) {
      setError(err.message || 'Failed to open session.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await closeSession();
      setClosedSummary(res.session);
      setActiveSession(null);
      setLastSession(res.session);
    } catch (err) {
      setError(err.message || 'Failed to close session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-canvas, #F9F5F0)',
      padding: '24px',
    }}>
      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        border: '2px solid #1A1A1A',
        boxShadow: '6px 6px 0 #1A1A1A',
      }}>
        {/* Card header stripe */}
        <div style={{
          background: '#1A1A1A',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>☕</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#F5C142', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Odoo Cafe · POS Session
          </span>
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0' }}>
              <div style={{
                width: 32, height: 32, border: '3px solid #E5E7EB',
                borderTopColor: '#1A1A1A', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Loading session…</span>
            </div>
          ) : (
            <>
              {/* Status icon + title */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 12px',
                  border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 28,
                  background: activeSession ? '#ECFDF5' : '#FEF3C7',
                }}>
                  {activeSession ? '🔓' : '🔒'}
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 4 }}>
                  {activeSession ? 'Session Open' : 'Register Closed'}
                </h2>
                <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
                  {activeSession
                    ? `Opened: ${formatDateKolkata(activeSession.opened_at)}`
                    : 'Open a session to start taking café orders'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#FEF2F2', border: '1.5px solid #EF4444',
                  padding: '10px 14px', marginBottom: 16,
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span>⚠️</span>
                  <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>{error}</span>
                </div>
              )}

              {/* ── No session open ── */}
              {!activeSession && (
                <>
                  {/* Last session info */}
                  <div style={{
                    background: '#F9FAFB', border: '1.5px solid #E5E7EB',
                    padding: '12px 16px', marginBottom: 16,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 6 }}>
                      Last Session Info
                    </p>
                    {lastSession ? (
                      <p style={{ fontSize: 13, color: '#1A1A1A', fontWeight: 600 }}>
                        {formatDateKolkata(lastSession.closed_at)} — {formatCurrency(lastSession.closing_total_revenue)}
                      </p>
                    ) : (
                      <p style={{ fontSize: 13, color: '#9CA3AF', fontWeight: 500 }}>No previous sessions</p>
                    )}
                  </div>

                  {/* Closing summary (shown right after a close) */}
                  {closedSummary && (
                    <div style={{
                      background: '#F0FDF4', border: '1.5px solid #22C55E',
                      padding: '14px 16px', marginBottom: 16,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        ✓ Session Closed
                      </p>
                      <InfoRow label="Total Orders"  value={closedSummary.closing_total_orders} />
                      <InfoRow label="Total Revenue" value={formatCurrency(closedSummary.closing_total_revenue)} />
                      <div style={{ marginTop: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                          Payment Breakdown
                        </p>
                        <InfoRow label="Cash" value={formatCurrency(closedSummary.closing_breakdown?.cash)} />
                        <InfoRow label="Card" value={formatCurrency(closedSummary.closing_breakdown?.card)} />
                        <InfoRow label="UPI"  value={formatCurrency(closedSummary.closing_breakdown?.upi)} />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <Btn onClick={handleOpenSession} disabled={loading}>Open Session</Btn>
                  </div>
                </>
              )}

              {/* ── Session already open ── */}
              {activeSession && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={() => navigate('/pos/order-type')} disabled={loading}>
                    Enter POS
                  </Btn>
                  <Btn onClick={handleCloseSession} variant="secondary" disabled={loading}>
                    Close Session
                  </Btn>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
