/**
 * PaymentSection — payment-first flow
 *
 * Flow: draft order → cashier picks method → fills details → Confirm →
 *       POST /orders/:id/pay → server marks paid + broadcasts to KDS →
 *       receipt options shown here.
 *
 * Props:
 *   onBack()                — called when "← Back" is clicked
 *   onPaymentComplete(order) — called after successful payment with the updated order
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import useCartStore from '../../../../shared/stores/useCartStore.js';
import { useRazorpay } from '../../../../shared/hooks/useRazorpay.js';
import { payOrder as apiPayOrder } from '../../../../shared/api/orders.api.js';
import { getPaymentMethods } from '../../../../shared/api/settings.api.js';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const METHOD_ICON  = { cash: '💵', card: '💳', upi: '📱' };
const METHOD_LABEL = { cash: 'Cash', card: 'Card', upi: 'UPI' };

// ─── tiny components ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2px solid rgba(26,26,26,0.15)', borderTopColor: '#1A1A1A',
      borderRadius: '50%', animation: 'spin 0.6s linear infinite',
    }} />
  );
}

function Row({ label, value, bold, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 900 : 600,
        color: green ? '#059669' : '#1A1A1A' }}>{value}</span>
    </div>
  );
}

// ─── Email popup ──────────────────────────────────────────────────────────────
function EmailPopup({ orderId, onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  const [err,  setErr]    = useState('');

  const handleSend = async () => {
    if (!email.includes('@')) { setErr('Enter a valid email'); return; }
    setErr('');
    // Stub — backend /orders/:id/receipt not yet implemented
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,26,26,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', border: '2px solid #1A1A1A', borderRadius: 12,
        padding: 24, maxWidth: 360, width: '100%', boxShadow: '6px 6px 0 #1A1A1A',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: 900, fontSize: 16, marginBottom: 12 }}>Email Receipt</h3>
        {sent ? (
          <p style={{ color: '#059669', fontWeight: 700, fontSize: 14 }}>
            ✓ Receipt sent to {email}
          </p>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@email.com"
              style={{
                width: '100%', boxSizing: 'border-box', border: '2px solid #1A1A1A',
                padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', outline: 'none',
                marginBottom: 8,
              }}
            />
            {err && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 8 }}>{err}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#6B7280', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button onClick={handleSend}
                style={{ background: '#F5C142', border: '2px solid #1A1A1A', padding: '8px 16px',
                  fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function PaymentSection({ onBack, onPaymentComplete }) {
  const currentOrder    = useCartStore((s) => s.currentOrder);
  const setCurrentOrder = useCartStore((s) => s.setCurrentOrder);
  const couponCode      = useCartStore((s) => s.couponCode);    // from DiscountPopup
  const clearCoupon     = useCartStore((s) => s.clearCoupon);
  const { initiatePayment } = useRazorpay();

  // Payment methods from backend
  const [methods,        setMethods]        = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(true);

  // Selection & form state
  const [selected,     setSelected]     = useState(null); // 'cash' | 'card' | 'upi'
  const [cashReceived, setCashReceived] = useState('');
  const [cardRef,      setCardRef]      = useState('');

  // UPI
  const qrRef   = useRef(null);
  const [qrReady, setQrReady] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // Success state
  const [paid,         setPaid]         = useState(false);
  const [changeDue,    setChangeDue]    = useState('0.00');
  const [paidMethod,   setPaidMethod]   = useState(null);
  const [emailPopup,   setEmailPopup]   = useState(false);

  const orderTotal = parseFloat(currentOrder?.total || 0);
  const items      = currentOrder?.items || [];

  // ── Fetch enabled payment methods ─────────────────────────────────────
  useEffect(() => {
    let dead = false;
    getPaymentMethods()
      .then((res) => {
        if (dead) return;
        const enabled = (res?.payment_methods || []).filter((m) => m.is_enabled);
        setMethods(enabled);
        if (enabled.length === 1) setSelected(enabled[0].method);
      })
      .catch(() => {
        // Fallback: show all three if settings endpoint fails
        if (!dead) setMethods([
          { method: 'cash', is_enabled: true, upi_id: null },
          { method: 'card', is_enabled: true, upi_id: null },
          { method: 'upi',  is_enabled: true, upi_id: null },
        ]);
      })
      .finally(() => { if (!dead) setMethodsLoading(false); });
    return () => { dead = true; };
  }, []);

  // ── Generate UPI QR ───────────────────────────────────────────────────
  useEffect(() => {
    if (selected !== 'upi' || !qrRef.current) return;
    const upiMethod = methods.find((m) => m.method === 'upi');
    const upiId     = upiMethod?.upi_id || 'cafe@ybl';
    const link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Odoo%20Cafe&am=${orderTotal.toFixed(2)}&cu=INR`;
    setQrReady(false);
    QRCode.toCanvas(qrRef.current, link, { width: 180, margin: 2,
      color: { dark: '#1A1A1A', light: '#F5F0E8' } })
      .then(() => setQrReady(true))
      .catch(console.error);
  }, [selected, methods, orderTotal]);

  // ── Reset form on method change ───────────────────────────────────────
  useEffect(() => {
    setCashReceived('');
    setCardRef('');
    setQrReady(false);
    setError('');
  }, [selected]);

  // ── Can we confirm? ───────────────────────────────────────────────────
  const canConfirm = useCallback(() => {
    if (!selected || !currentOrder || items.length === 0) return false;
    if (selected === 'cash') return parseFloat(cashReceived || 0) >= orderTotal;
    if (selected === 'card') return cardRef.trim().length > 0;
    if (selected === 'upi')  return true; // employee taps Confirmed
    return false;
  }, [selected, cashReceived, cardRef, orderTotal, currentOrder, items]);

  // ── Submit payment ────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!currentOrder?.id || submitting || !canConfirm()) return;
    setError('');
    setSubmitting(true);
    try {
      const body = {
        payment_method:        selected,
        amount_paid:           selected === 'cash' ? cashReceived : String(orderTotal),
        transaction_reference: selected === 'card' ? cardRef.trim() : null,
        tip:                   '0.00',
      };
      const res = await apiPayOrder(currentOrder.id, body);
      setCurrentOrder(res.order);
      setChangeDue(res.change_due ?? '0.00');
      setPaidMethod(selected);
      setPaid(true);
      onPaymentComplete?.(res.order);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRazorpayPayment = () => {
    if (!currentOrder?.id || submitting) return;
    setError('');
    setSubmitting(true);

    initiatePayment({
      amount:                  orderTotal,
      posOrderId:              currentOrder.id,
      customerName:            currentOrder.customer_name || '',
      couponCode:              couponCode || null,
      loyaltyPointsToRedeem:   0,
      tip:                     '0.00',
      onSuccess: (result) => {
        setSubmitting(false);
        setCurrentOrder(result.order);
        setChangeDue(result.change_due || '0.00');
        clearCoupon?.();
        setPaidMethod(selected);
        setPaid(true);
        onPaymentComplete?.(result.order);
      },
      onFailure: (msg) => {
        setSubmitting(false);
        setError(msg);
      },
    });
  };

  // ─────────────────────────────────────────────────────────────────────
  // SECTION WRAPPER
  // ─────────────────────────────────────────────────────────────────────
  const S = ({ children }) => (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      backgroundColor: '#F5F0E8', overflow: 'hidden',
      fontFamily: "'Outfit','Inter',sans-serif", color: '#1A1A1A',
    }}>
      {children}
    </div>
  );

  // ─── Back bar ─────────────────────────────────────────────────────────
  const BackBar = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderBottom: '2px solid #1A1A1A',
      background: '#fff', flexShrink: 0,
    }}>
      <button onClick={paid ? undefined : onBack} disabled={paid}
        style={{
          background: 'transparent', border: '1.5px solid #1A1A1A',
          padding: '4px 12px', fontSize: 12, fontWeight: 700,
          cursor: paid ? 'default' : 'pointer', fontFamily: 'inherit',
          opacity: paid ? 0.4 : 1,
        }}>
        ← Back
      </button>
      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '0.09em', color: '#9CA3AF' }}>
        {paid ? 'Receipt' : 'Payment'}
      </span>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────
  // SUCCESS VIEW
  // ─────────────────────────────────────────────────────────────────────
  if (paid) {
    return (
      <S>
        {BackBar}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex',
          flexDirection: 'column', gap: 16 }}>
          {/* Checkmark */}
          <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 68, height: 68, borderRadius: '50%',
              background: '#D1FAE5', border: '3px solid #059669', fontSize: 32, marginBottom: 10,
            }}>✅</div>
            <p style={{ fontWeight: 900, fontSize: 20, color: '#059669' }}>Payment Complete</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              {METHOD_ICON[paidMethod]} {METHOD_LABEL[paidMethod]}
            </p>
          </div>

          {/* Summary */}
          <div style={{ background: '#fff', border: '3px solid #1A1A1A',
            boxShadow: '4px 4px 0 #1A1A1A', padding: 16, display: 'flex',
            flexDirection: 'column', gap: 8 }}>
            <Row label="Order"  value={`#${currentOrder?.id}`} />
            <Row label="Total"  value={fmt(currentOrder?.total)} bold />
            {paidMethod === 'cash' && parseFloat(changeDue) > 0 && (
              <Row label="Change Due" value={fmt(changeDue)} bold green />
            )}
          </div>

          {/* Receipt actions */}
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: '#9CA3AF' }}>Receipt</p>
          <button onClick={() => window.print()}
            style={{
              background: '#fff', border: '2px solid #1A1A1A', padding: '12px 16px',
              fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              boxShadow: '3px 3px 0 #1A1A1A',
            }}>
            🖨 Print Receipt
          </button>
          <button onClick={() => setEmailPopup(true)}
            style={{
              background: '#1A1A1A', border: '2px solid #1A1A1A', padding: '12px 16px',
              fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#F5C142',
              display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
              boxShadow: '3px 3px 0 rgba(0,0,0,0.3)',
            }}>
            📧 Email Receipt
          </button>

          {/* New order */}
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <button onClick={() => { window.location.href = '/pos/order-type'; }}
              style={{
                width: '100%', background: '#F5C142', border: '3px solid #1A1A1A',
                padding: '14px 16px', fontWeight: 900, fontSize: 14, cursor: 'pointer',
                fontFamily: 'inherit', boxShadow: '4px 4px 0 #1A1A1A',
              }}>
              ＋ New Order
            </button>
          </div>
        </div>
        {emailPopup && (
          <EmailPopup orderId={currentOrder?.id} onClose={() => setEmailPopup(false)} />
        )}
      </S>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // EMPTY / NOT PAYABLE
  // ─────────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <S>
        {BackBar}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
          <p style={{ fontWeight: 900, fontSize: 16 }}>Cart is empty</p>
          <p style={{ color: '#6B7280', fontSize: 13 }}>Add items before payment.</p>
        </div>
      </S>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // PAYMENT FORM
  // ─────────────────────────────────────────────────────────────────────
  const cashChange = selected === 'cash'
    ? Math.max(0, parseFloat(cashReceived || 0) - orderTotal)
    : 0;

  return (
    <S>
      {BackBar}

      {/* Amount due header */}
      <div style={{
        background: '#1A1A1A', color: '#F5C142', padding: '14px 16px',
        textAlign: 'center', borderBottom: '2px solid #1A1A1A', flexShrink: 0,
      }}>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.12em', opacity: 0.6, marginBottom: 2 }}>Amount Due</p>
        <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em',
          fontFamily: "'Outfit',monospace" }}>
          {fmt(currentOrder?.total)}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex',
        flexDirection: 'column', gap: 16 }}>

        {/* Method selector */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: '#9CA3AF', marginBottom: 8 }}>
            Payment Method
          </p>
          {methodsLoading ? (
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>Loading…</p>
          ) : methods.length === 0 ? (
            <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 700 }}>
              No payment methods enabled. Configure in Admin → Settings.
            </p>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {methods.map(({ method }) => {
                const active = selected === method;
                return (
                  <button key={method} onClick={() => setSelected(method)}
                    style={{
                      flex: 1, padding: '12px 6px', border: `3px solid ${active ? '#F5C142' : '#1A1A1A'}`,
                      background: active ? '#1A1A1A' : '#fff', color: active ? '#F5C142' : '#1A1A1A',
                      fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: active ? '4px 4px 0 #F5C142' : '4px 4px 0 #1A1A1A',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      transition: 'all 0.12s',
                    }}>
                    <span style={{ fontSize: 20 }}>{METHOD_ICON[method]}</span>
                    {METHOD_LABEL[method]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Method-specific input */}
        {selected === 'cash' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#9CA3AF' }}>Amount Received</label>
            <input
              type="number" min={orderTotal} step="0.01"
              value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
              placeholder={orderTotal.toFixed(2)}
              style={{
                border: '2px solid #1A1A1A', padding: '10px 12px',
                fontSize: 18, fontWeight: 700, fontFamily: 'monospace',
                outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C142')}
              onBlur={(e)  => (e.target.style.borderColor = '#1A1A1A')}
            />
            {cashReceived && (
              <div style={{
                background: parseFloat(cashReceived) >= orderTotal ? '#D1FAE5' : '#FEF2F2',
                border: `2px solid ${parseFloat(cashReceived) >= orderTotal ? '#059669' : '#EF4444'}`,
                padding: '10px 14px', display: 'flex', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Change Due</span>
                <span style={{
                  fontSize: 16, fontWeight: 900, fontFamily: 'monospace',
                  color: parseFloat(cashReceived) >= orderTotal ? '#059669' : '#EF4444',
                }}>
                  {fmt(cashChange)}
                </span>
              </div>
            )}
          </div>
        )}

        {selected === 'card' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleRazorpayPayment}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#10B981',
                color: '#fff',
                border: '3px solid #1A1A1A',
                fontWeight: 900,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0 #1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              💳 Pay Online with Razorpay
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: 10 }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>or manual entry</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
            </div>

            <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#9CA3AF' }}>Transaction Reference *</label>
            <input
              type="text" value={cardRef} onChange={(e) => setCardRef(e.target.value)}
              placeholder="e.g. TXN123456789"
              style={{
                border: '2px solid #1A1A1A', padding: '10px 12px',
                fontSize: 14, fontFamily: 'inherit', outline: 'none',
                background: '#fff', width: '100%', boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#F5C142')}
              onBlur={(e)  => (e.target.style.borderColor = '#1A1A1A')}
            />
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>
              Enter the reference printed on the card terminal slip.
            </p>
          </div>
        )}

        {selected === 'upi' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
            <button
              onClick={handleRazorpayPayment}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#10B981',
                color: '#fff',
                border: '3px solid #1A1A1A',
                fontWeight: 900,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: '4px 4px 0 #1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              📱 Pay Online with Razorpay (UPI)
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: 10, width: '100%' }}>
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#999', textTransform: 'uppercase' }}>or direct scan</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
            </div>

            <canvas ref={qrRef} style={{
              border: '3px solid #1A1A1A', padding: 6, background: '#F5F0E8',
              display: qrReady ? 'block' : 'none',
            }} />
            {!qrReady && (
              <div style={{ padding: 20 }}><Spinner /></div>
            )}
            <p style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 16 }}>
              {fmt(currentOrder?.total)}
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
              Ask customer to scan and confirm payment in their UPI app, then tap Confirmed.
            </p>
          </div>
        )}

        {/* Order summary */}
        <div style={{ background: '#fff', border: '2px solid #1A1A1A',
          padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: '#9CA3AF', marginBottom: 4 }}>Summary</p>
          <Row label="Subtotal" value={fmt(currentOrder?.subtotal)} />
          <Row label="Tax"      value={`+${fmt(currentOrder?.tax_total)}`} />
          {parseFloat(currentOrder?.discount_total || 0) > 0 && (
            <Row label="Discount" value={`−${fmt(currentOrder?.discount_total)}`} />
          )}
          <div style={{ borderTop: '2px solid #1A1A1A', paddingTop: 8, marginTop: 4 }}>
            <Row label="Total" value={fmt(currentOrder?.total)} bold />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '2px solid #EF4444',
            padding: '10px 14px', fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {/* Confirm button — sticky at bottom */}
      <div style={{ padding: 12, borderTop: '2px solid #1A1A1A', background: '#fff', flexShrink: 0 }}>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm() || submitting}
          style={{
            width: '100%', padding: '14px 16px',
            background: canConfirm() && !submitting ? '#F5C142' : '#E5E7EB',
            border: '3px solid #1A1A1A',
            color: canConfirm() && !submitting ? '#1A1A1A' : '#9CA3AF',
            fontWeight: 900, fontSize: 15, cursor: canConfirm() && !submitting ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', letterSpacing: '0.02em',
            boxShadow: canConfirm() && !submitting ? '4px 4px 0 #1A1A1A' : 'none',
            transition: 'all 0.12s', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}>
          {submitting ? <><Spinner /> Processing…</> : '✓ Confirm Payment'}
        </button>
      </div>
    </S>
  );
}
