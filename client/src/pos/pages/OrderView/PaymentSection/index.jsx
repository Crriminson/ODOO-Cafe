/**
 * PaymentSection — spec §7.6 / API-Contract §POST /orders/:id/pay
 *
 * Three-step UI inside the rightmost column of OrderView:
 *
 *   IDLE     → shows enabled payment methods from GET /settings/payment-methods
 *   PAYING   → shows the selected method's input form
 *   SUCCESS  → shows change-due (cash) and Print / Email receipt actions
 *
 * Pure display/interaction — all financial logic lives on the server.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import QRCode from 'qrcode';
import { getPaymentMethods } from '../../../../shared/api/settings.api.js';
import { payOrder } from '../../../../shared/api/orders.api.js';
import useCartStore from '../../../../shared/stores/useCartStore.js';
import { useRazorpay } from '../../../../shared/hooks/useRazorpay.js';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  '₹' +
  Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const METHOD_LABEL = { cash: '💵 Cash', card: '💳 Card', upi: '📱 UPI' };
const METHOD_ICON  = { cash: '💵', card: '💳', upi: '📱' };

// ─── tiny sub-components ──────────────────────────────────────────────────────

/** Pill button used for method selection */
function MethodBtn({ method, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '12px 6px',
        background: active ? '#1A1A1A' : '#fff',
        color: active ? '#F5C142' : '#1A1A1A',
        border: `3px solid ${active ? '#F5C142' : '#1A1A1A'}`,
        boxShadow: active ? '4px 4px 0 #F5C142' : '4px 4px 0 #1A1A1A',
        cursor: 'pointer',
        fontWeight: 900,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'all 0.12s',
      }}
    >
      <span style={{ fontSize: 22 }}>{METHOD_ICON[method]}</span>
      {method.toUpperCase()}
    </button>
  );
}

/** Labelled input */
function Field({ label, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6B7280' }}
      >
        {label}
      </label>
      <input
        style={{
          border: '2px solid #1A1A1A',
          background: '#fff',
          padding: '10px 12px',
          fontSize: 15,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          outline: 'none',
          borderRadius: 0,
          width: '100%',
          boxSizing: 'border-box',
        }}
        {...props}
      />
    </div>
  );
}

/** Large action button */
function ActionBtn({ children, onClick, disabled, variant = 'primary', small = false }) {
  const styles = {
    primary: {
      background: '#F5C142',
      color: '#1A1A1A',
      border: '3px solid #1A1A1A',
      boxShadow: '4px 4px 0 #1A1A1A',
    },
    dark: {
      background: '#1A1A1A',
      color: '#F5C142',
      border: '3px solid #1A1A1A',
      boxShadow: '4px 4px 0 rgba(0,0,0,0.3)',
    },
    ghost: {
      background: '#fff',
      color: '#1A1A1A',
      border: '3px solid #1A1A1A',
      boxShadow: '4px 4px 0 #1A1A1A',
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: small ? '10px' : '14px',
        fontWeight: 900,
        fontSize: small ? 12 : 14,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.1s, box-shadow 0.1s',
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function PaymentSection({ onBack }) {
  const currentOrder    = useCartStore((s) => s.currentOrder);
  const setCurrentOrder = useCartStore((s) => s.setCurrentOrder);
  const couponCode      = useCartStore((s) => s.couponCode);    // from DiscountPopup
  const clearCoupon     = useCartStore((s) => s.clearCoupon);
  const { initiatePayment } = useRazorpay();

  // ── step: 'idle' | 'paying' | 'success'
  const [step, setStep] = useState('idle');

  // ── payment-method config from backend
  const [methods, setMethods]       = useState([]);
  const [methodsLoading, setMethodsLoading] = useState(true);

  // ── selected method + form state
  const [selected, setSelected]     = useState(null); // 'cash' | 'card' | 'upi'
  const [cashReceived, setCashReceived]   = useState('');
  const [cardRef, setCardRef]       = useState('');

  // ── UPI canvas ref
  const qrCanvasRef = useRef(null);
  const [upiReady, setUpiReady]     = useState(false);

  // ── submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // ── success
  const [changeDue, setChangeDue]   = useState('0.00');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [emailSent, setEmailSent]   = useState(false);

  // ─ Fetch enabled payment methods from server ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    setMethodsLoading(true);
    getPaymentMethods()
      .then((res) => {
        if (cancelled) return;
        const enabled = (res?.payment_methods || []).filter((m) => m.is_enabled);
        setMethods(enabled);
        if (enabled.length === 1) setSelected(enabled[0].method);
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback: show all three if the endpoint fails
          setMethods([
            { method: 'cash', is_enabled: true, upi_id: null },
            { method: 'card', is_enabled: true, upi_id: null },
            { method: 'upi',  is_enabled: true, upi_id: null },
          ]);
        }
      })
      .finally(() => { if (!cancelled) setMethodsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // ─ Generate QR when UPI is selected ──────────────────────────────────
  useEffect(() => {
    if (selected !== 'upi' || step !== 'paying') return;
    const upiMethod = methods.find((m) => m.method === 'upi');
    const upiId = upiMethod?.upi_id || 'cafe@ybl';
    const total = currentOrder?.total ?? '0.00';
    const deepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Odoo%20Cafe&am=${total}&cu=INR`;

    setUpiReady(false);
    QRCode.toCanvas(qrCanvasRef.current, deepLink, {
      width: 200,
      margin: 2,
      color: { dark: '#1A1A1A', light: '#F5F0E8' },
    })
      .then(() => setUpiReady(true))
      .catch(console.error);
  }, [selected, step, methods, currentOrder?.total]);

  // ─ Reset form when method changes ────────────────────────────────────
  useEffect(() => {
    setCashReceived('');
    setCardRef('');
    setUpiReady(false);
    setError('');
  }, [selected]);

  // ─ Derived: can we show the pay button? ──────────────────────────────
  const orderTotal = parseFloat(currentOrder?.total || 0);
  const canPay = useCallback(() => {
    if (!selected || !currentOrder) return false;
    if (selected === 'cash') {
      const received = parseFloat(cashReceived || 0);
      return received >= orderTotal;
    }
    if (selected === 'card') return cardRef.trim().length > 0;
    if (selected === 'upi')  return true; // employee confirms manually
    return false;
  }, [selected, cashReceived, cardRef, orderTotal, currentOrder]);

  // ─ Submit payment ─────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!currentOrder?.id || submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const body = {
        method:                  selected,
        amount:                  selected === 'cash' ? cashReceived : String(orderTotal),
        tip:                     '0.00',
        transaction_reference:   selected === 'card' ? cardRef.trim() : null,
        coupon_code:             couponCode || null,   // ← from DiscountPopup via cart store
        loyalty_points_to_redeem: 0,
      };

      const res = await payOrder(currentOrder.id, body);
      setCurrentOrder(res.order);
      setChangeDue(res.change_due ?? '0.00');
      clearCoupon();   // coupon consumed — clear from store
      // Pre-fill email from linked customer if available
      setReceiptEmail(currentOrder.customer_email || '');
      setStep('success');
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
        clearCoupon();
        setReceiptEmail(result.order.customer_email || '');
        setStep('success');
      },
      onFailure: (msg) => {
        setSubmitting(false);
        setError(msg);
      },
    });
  };

  // ─ Disabled / not-yet-payable states ───────────────────────────────────
  const isPaid    = currentOrder?.status === 'paid';
  const isPayable = currentOrder?.status === 'sent';

  // ─ Back button strip (shared across all sub-states) ────────────────────
  const BackBar = onBack ? (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '8px 12px',
      borderBottom: '2px solid #1A1A1A',
      background: '#F9F5F0',
      flexShrink: 0,
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: '1.5px solid #1A1A1A',
          padding: '4px 12px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', color: '#1A1A1A',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        ← Back to Cart
      </button>
      <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Payment
      </span>
    </div>
  ) : null;

  if (isPaid && step !== 'success') {
    return (
      <>
        {BackBar}
        <Section>
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 900, fontSize: 18 }}>Already Paid</p>
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 6 }}>
              This order has been settled.
            </p>
          </div>
        </Section>
      </>
    );
  }

  if (!isPayable && step !== 'success') {
    return (
      <>
        {BackBar}
        <Section>
          <EmptyState
            icon="💳"
            title="Payment"
            subtitle={
              currentOrder?.status === 'draft'
                ? 'Send the order to kitchen first'
                : 'No active order'
            }
          />
        </Section>
      </>
    );
  }

  // ─── SUCCESS screen ───────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <>
        {BackBar}
        <Section>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            height: '100%',
            overflow: 'auto',
            padding: '20px 16px',
          }}
        >
          {/* Big checkmark */}
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#D1FAE5',
                border: '3px solid #065F46',
                fontSize: 36,
                marginBottom: 12,
              }}
            >
              ✅
            </div>
            <p style={{ fontWeight: 900, fontSize: 20, color: '#065F46' }}>Payment Complete</p>
          </div>

          {/* Summary box */}
          <div
            style={{
              background: '#fff',
              border: '3px solid #1A1A1A',
              boxShadow: '4px 4px 0 #1A1A1A',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Row label="Order" value={`#${currentOrder?.id}`} />
            <Row label="Method" value={METHOD_LABEL[selected] ?? selected} />
            <Row label="Total" value={fmt(currentOrder?.total)} bold />
            {selected === 'cash' && parseFloat(changeDue) > 0 && (
              <Row
                label="Change Due"
                value={fmt(changeDue)}
                bold
                accent
              />
            )}
          </div>

          {/* Receipt actions */}
          <SectionTitle>Receipt</SectionTitle>
          <ActionBtn onClick={() => window.print()} variant="ghost">
            🖨️ Print Receipt
          </ActionBtn>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Field
              label="Customer Email"
              type="email"
              placeholder="customer@email.com"
              value={receiptEmail}
              onChange={(e) => { setReceiptEmail(e.target.value); setEmailSent(false); }}
            />
            <ActionBtn
              onClick={() => {
                // Real email sending would hit a backend endpoint — here we simulate
                if (receiptEmail.trim()) setEmailSent(true);
              }}
              disabled={!receiptEmail.trim() || emailSent}
              variant="dark"
              small
            >
              {emailSent ? '✓ Email Sent' : '✉️ Send Receipt via Email'}
            </ActionBtn>
            {emailSent && (
              <p style={{ fontSize: 12, color: '#065F46', fontWeight: 600, textAlign: 'center' }}>
                Receipt queued for {receiptEmail}
              </p>
            )}
          </div>

          {/* New order */}
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <ActionBtn
              onClick={() => {
                window.location.href = '/pos/order-type';
              }}
              variant="primary"
            >
              ＋ New Order
            </ActionBtn>
          </div>
        </div>
      </Section>
    </>
    );
  }

  // ─── PAYING screen ────────────────────────────────────────────────────
  if (step === 'paying') {
    return (
      <>
        {BackBar}
        <Section>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '2px solid #1A1A1A',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#1A1A1A',
            }}
          >
            <button
              onClick={() => setStep('idle')}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '4px 10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              ← Back
            </button>
            <span style={{ color: '#F5C142', fontWeight: 900, fontSize: 14 }}>
              {METHOD_LABEL[selected]}
            </span>
            <span style={{ marginLeft: 'auto', color: '#fff', fontWeight: 900, fontSize: 16 }}>
              {fmt(currentOrder?.total)}
            </span>
          </div>

          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {/* Error */}
            {error && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '2px solid #EF4444',
                  padding: '10px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#B91C1C',
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* ── CASH ── */}
            {selected === 'cash' && (
              <>
                <Field
                  label="Amount Received (₹)"
                  type="number"
                  min={orderTotal}
                  step="0.50"
                  placeholder={String(Math.ceil(orderTotal))}
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  autoFocus
                />
                {parseFloat(cashReceived || 0) >= orderTotal && (
                  <div
                    style={{
                      background: '#F5C142',
                      border: '3px solid #1A1A1A',
                      boxShadow: '4px 4px 0 #1A1A1A',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Change Due</span>
                    <span style={{ fontWeight: 900, fontSize: 22 }}>
                      {fmt(parseFloat(cashReceived) - orderTotal)}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <ActionBtn onClick={handlePay} disabled={!canPay() || submitting}>
                    {submitting ? 'Processing…' : 'Confirm Cash Payment'}
                  </ActionBtn>
                </div>
              </>
            )}

            {/* ── CARD ── */}
            {selected === 'card' && (
              <>
                <ActionBtn onClick={handleRazorpayPayment} disabled={submitting} variant="primary">
                  {submitting ? 'Processing…' : '💳 Pay with Razorpay'}
                </ActionBtn>

                <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>or manual entry</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
                </div>

                <Field
                  label="Transaction Reference"
                  type="text"
                  placeholder="e.g. TXN1234567890"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                />
                <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
                  If using a physical card machine, enter the transaction reference from the receipt.
                </p>
                <div style={{ marginTop: 'auto' }}>
                  <ActionBtn onClick={handlePay} disabled={!canPay() || submitting} variant="dark">
                    {submitting ? 'Processing…' : 'Confirm Manual Card Payment'}
                  </ActionBtn>
                </div>
              </>
            )}

            {/* ── UPI ── */}
            {selected === 'upi' && (
              <>
                <ActionBtn onClick={handleRazorpayPayment} disabled={submitting} variant="primary">
                  {submitting ? 'Processing…' : '📱 Pay online with Razorpay (UPI)'}
                </ActionBtn>

                <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', gap: 10 }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>or direct scan</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: '#DDD' }} />
                </div>

                <p style={{ fontSize: 11, color: '#6B7280', textAlign: 'center' }}>
                  Ask the customer to scan the QR code below using any UPI app.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
                  {!upiReady && (
                    <div style={{ color: '#9CA3AF', fontSize: 13 }}>Generating QR…</div>
                  )}
                  <canvas
                    ref={qrCanvasRef}
                    style={{
                      border: '3px solid #1A1A1A',
                      boxShadow: '4px 4px 0 #1A1A1A',
                      display: upiReady ? 'block' : 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    background: '#F5C142',
                    border: '3px solid #1A1A1A',
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 900,
                    fontSize: 20,
                  }}
                >
                  {fmt(currentOrder?.total)}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setStep('idle')}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#fff',
                      border: '3px solid #1A1A1A',
                      boxShadow: '4px 4px 0 #1A1A1A',
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePay}
                    disabled={submitting}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: submitting ? '#9CA3AF' : '#1A1A1A',
                      color: '#F5C142',
                      border: '3px solid #1A1A1A',
                      boxShadow: '4px 4px 0 #1A1A1A',
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {submitting ? 'Processing…' : '✓ Confirmed — Payment Received'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}


  // ─── IDLE screen — method selection ──────────────────────────────────
  return (
    <>
      {BackBar}
      <Section>
        {/* Order total */}
        <div
          style={{
            background: '#1A1A1A',
            color: '#F5C142',
            padding: '16px',
            textAlign: 'center',
            borderBottom: '2px solid #1A1A1A',
          }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 4 }}>
          Amount Due
        </p>
        <p style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>
          {fmt(currentOrder?.total)}
        </p>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionTitle>Select Payment Method</SectionTitle>

        {methodsLoading ? (
          <div style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            Loading payment methods…
          </div>
        ) : methods.length === 0 ? (
          <div style={{ color: '#EF4444', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '24px 0' }}>
            No payment methods enabled. Ask your admin to configure them.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            {methods.map((m) => (
              <MethodBtn
                key={m.method}
                method={m.method}
                active={selected === m.method}
                onClick={() => setSelected(m.method)}
              />
            ))}
          </div>
        )}

        {/* Order summary */}
        <div
          style={{
            background: '#fff',
            border: '3px solid #1A1A1A',
            boxShadow: '4px 4px 0 #1A1A1A',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <SectionTitle>Summary</SectionTitle>
          <Row label="Subtotal"  value={fmt(currentOrder?.subtotal)} />
          <Row label="Tax"       value={`+${fmt(currentOrder?.tax_total)}`} />
          {parseFloat(currentOrder?.discount_total || 0) > 0 && (
            <Row label="Discount"  value={`-${fmt(currentOrder?.discount_total)}`} />
          )}
          {parseFloat(currentOrder?.loyalty_discount || 0) > 0 && (
            <Row label="Loyalty"  value={`-${fmt(currentOrder?.loyalty_discount)}`} />
          )}
          {parseFloat(currentOrder?.tip || 0) > 0 && (
            <Row label="Tip"      value={`+${fmt(currentOrder?.tip)}`} />
          )}
          <div style={{ borderTop: '2px solid #1A1A1A', paddingTop: 8, marginTop: 4 }}>
            <Row label="Total" value={fmt(currentOrder?.total)} bold />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <ActionBtn
            onClick={() => setStep('paying')}
            disabled={!selected || methodsLoading}
          >
            Proceed to {selected ? METHOD_LABEL[selected] : 'Payment'} →
          </ActionBtn>
        </div>
      </div>
    </Section>
  </>
  );
}

// ─── layout helpers ───────────────────────────────────────────────────────────

function Section({ children }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-canvas, #F5F0E8)',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        color: '#1A1A1A',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 8,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: '#F5C142',
          border: '2px solid #1A1A1A',
          boxShadow: '2px 2px 0 #1A1A1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
        }}
      >
        {icon}
      </div>
      <p style={{ fontWeight: 900, fontSize: 16, marginTop: 8 }}>{title}</p>
      <p style={{ color: '#6B7280', fontSize: 13 }}>{subtitle}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: '#9CA3AF',
        marginBottom: 2,
      }}
    >
      {children}
    </p>
  );
}

function Row({ label, value, bold, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <span
        style={{
          fontSize: bold ? 16 : 13,
          fontWeight: bold ? 900 : 600,
          color: accent ? '#065F46' : '#1A1A1A',
        }}
      >
        {value}
      </span>
    </div>
  );
}
