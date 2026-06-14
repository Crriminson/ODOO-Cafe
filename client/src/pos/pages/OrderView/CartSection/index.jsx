import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../../../shared/stores/useCartStore.js';
import Modal from '../../../../shared/components/Modal.jsx';
import { sendToKitchen, deleteOrder } from '../../../../shared/api/orders.api.js';
import { validateCoupon } from '../../../../shared/api/coupons.api.js';

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return (
    '₹' +
    num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

// ─── Spinner dot used during async operations ─────────────────────────────
function SpinnerDot() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        border: '2px solid #E5E7EB',
        borderTopColor: '#1A1A1A',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}

// ─── Discount / Coupon popup ──────────────────────────────────────────────
/**
 * DiscountPopup — spec §7.5 / §3.4
 *
 * Cashier manually enters a coupon code.  The code is validated via
 * POST /coupons/validate (no side-effects, returns a discount preview).
 * On success the discount is stored in the cart store so:
 *   • CartSection shows it as a line-item in the order summary
 *   • PaymentSection sends it to POST /orders/:id/pay
 *
 * Automated promotions are applied server-side at pay time and do NOT
 * require any interaction here.
 */
function DiscountPopup({ isOpen, onClose, orderTotal }) {
  const setCoupon      = useCartStore((s) => s.setCoupon);
  const clearCoupon    = useCartStore((s) => s.clearCoupon);
  const couponCode     = useCartStore((s) => s.couponCode);
  const discountPreview = useCartStore((s) => s.discountPreview);

  const [input, setInput]       = useState(couponCode || '');
  const [validating, setValidating] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(null); // { code, discount_amount, ... }

  const inputRef = useRef(null);

  // Auto-focus and pre-fill when opened
  useEffect(() => {
    if (isOpen) {
      setInput(couponCode || '');
      setError('');
      setSuccess(discountPreview || null);
      // Focus after transition
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = async () => {
    const code = input.trim();
    if (!code) { setError('Please enter a coupon code.'); return; }
    setValidating(true);
    setError('');
    setSuccess(null);
    try {
      const res = await validateCoupon(code, orderTotal);
      setSuccess(res.coupon);
    } catch (err) {
      setError(err.message || 'Invalid or expired coupon code.');
    } finally {
      setValidating(false);
    }
  };

  const handleApply = () => {
    if (!success) return;
    setCoupon(success);
    onClose();
  };

  const handleRemove = () => {
    clearCoupon();
    setInput('');
    setSuccess(null);
    setError('');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !validating) {
      success ? handleApply() : handleValidate();
    }
  };

  const discountLabel =
    success
      ? success.discount_type === 'percentage'
        ? `${parseFloat(success.discount_value)}% off`
        : `${formatCurrency(success.discount_value)} off`
      : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount Code">
      {/* Input row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); setSuccess(null); }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. WELCOME10"
          disabled={validating}
          style={{
            flex: 1,
            border: success
              ? '2px solid #22C55E'
              : error
              ? '2px solid #EF4444'
              : '2px solid #1A1A1A',
            padding: '10px 12px',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            outline: 'none',
            background: '#fff',
            transition: 'border-color 0.12s',
          }}
        />
        <button
          onClick={handleValidate}
          disabled={validating || !input.trim() || !!success}
          style={{
            padding: '10px 18px',
            background: success ? '#E5E7EB' : '#1A1A1A',
            color: success ? '#9CA3AF' : '#F5C142',
            border: '2px solid #1A1A1A',
            fontWeight: 900,
            fontSize: 13,
            cursor: validating || !input.trim() || !!success ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            boxShadow: '3px 3px 0 #1A1A1A',
          }}
        >
          {validating ? <><SpinnerDot /> Checking…</> : 'Validate'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '2px solid #EF4444',
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 13,
            fontWeight: 600,
            color: '#B91C1C',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Success preview */}
      {success && (
        <div
          style={{
            background: '#F0FDF4',
            border: '2px solid #22C55E',
            padding: '14px 16px',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🎉</span>
            <span style={{ fontWeight: 900, fontSize: 14, color: '#065F46' }}>
              Code <span style={{ fontFamily: 'monospace' }}>{success.code}</span> is valid!
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>{discountLabel}</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: '#065F46', fontFamily: 'monospace' }}>
              −{formatCurrency(success.discount_amount)}
            </span>
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            Discount will be applied when payment is processed.
          </p>
        </div>
      )}

      {/* Note about automated promotions */}
      <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.6 }}>
        Automated promotions (e.g. Buy-2-Get-10%-Off) are applied automatically
        at payment — no code needed.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {couponCode && (
          <button
            onClick={handleRemove}
            style={{
              flex: 1,
              padding: '11px 14px',
              background: '#fff',
              border: '2px solid #EF4444',
              color: '#EF4444',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '3px 3px 0 #EF4444',
            }}
          >
            Remove Coupon
          </button>
        )}
        <button
          onClick={handleApply}
          disabled={!success}
          style={{
            flex: 2,
            padding: '11px 14px',
            background: success ? '#F5C142' : '#E5E7EB',
            border: '2px solid #1A1A1A',
            color: '#1A1A1A',
            fontWeight: 900,
            fontSize: 14,
            cursor: success ? 'pointer' : 'not-allowed',
            opacity: success ? 1 : 0.5,
            boxShadow: success ? '3px 3px 0 #1A1A1A' : 'none',
          }}
        >
          Apply Discount
        </button>
      </div>
    </Modal>
  );
}

// ─── Main CartSection ─────────────────────────────────────────────────────
export default function CartSection() {
  const navigate = useNavigate();

  const currentOrder   = useCartStore((s) => s.currentOrder);
  const isCartLoading  = useCartStore((s) => s.isCartLoading);
  const updateQty      = useCartStore((s) => s.updateQty);
  const removeItem     = useCartStore((s) => s.removeItem);
  const setCurrentOrder = useCartStore((s) => s.setCurrentOrder);
  const clearCart      = useCartStore((s) => s.clearCart);
  const couponCode     = useCartStore((s) => s.couponCode);
  const discountPreview = useCartStore((s) => s.discountPreview);

  const [isSending,         setIsSending]         = useState(false);
  const [sendError,         setSendError]          = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen]  = useState(false);
  const [isDeleting,        setIsDeleting]         = useState(false);
  const [deleteError,       setDeleteError]        = useState(null);
  const [isDiscountOpen,    setIsDiscountOpen]     = useState(false);

  const items = currentOrder?.items || [];

  // ─── Totals — prefer server-computed values ────────────────────────
  const subtotal  = currentOrder ? parseFloat(currentOrder.subtotal)       : 0;
  const tax       = currentOrder ? parseFloat(currentOrder.tax_total)      : 0;
  const serverDiscount = currentOrder ? parseFloat(currentOrder.discount_total) : 0;
  const tip       = currentOrder ? parseFloat(currentOrder.tip || 0)       : 0;
  const serverTotal   = currentOrder ? parseFloat(currentOrder.total)      : 0;

  // Preview: optimistically subtract coupon from displayed total
  const previewDiscount = discountPreview ? parseFloat(discountPreview.discount_amount) : 0;
  const displayDiscount = Math.max(serverDiscount, previewDiscount);
  const displayTotal    = serverDiscount > 0
    ? serverTotal   // server already baked in discount
    : Math.max(0, serverTotal - previewDiscount);

  const isDraft = currentOrder?.status === 'draft';
  const isSent  = currentOrder?.status === 'sent';

  // ─── Send to kitchen ──────────────────────────────────────────────
  const handleSendToKitchen = async () => {
    if (!currentOrder?.id) return;
    setIsSending(true);
    setSendError(null);
    try {
      const res = await sendToKitchen(currentOrder.id);
      setCurrentOrder(res.order);
    } catch (err) {
      setSendError(err.message || 'Failed to send order. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // ─── Delete draft order ───────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!currentOrder?.id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteOrder(currentOrder.id);
      clearCart();
      navigate('/pos/order-type', { replace: true });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete order.');
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* ─── Delete Confirmation Modal ────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete this order?"
      >
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>
          This can't be undone. The draft order will be permanently removed.
        </p>

        {deleteError && (
          <div
            style={{
              background: '#FEF2F2',
              border: '2px solid #EF4444',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#EF4444',
            }}
          >
            {deleteError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6B7280',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 16px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            style={{
              background: '#EF4444',
              border: '2px solid #1A1A1A',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              padding: '8px 20px',
              opacity: isDeleting ? 0.6 : 1,
              boxShadow: '2px 2px 0px #1A1A1A',
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>

      {/* ─── Discount popup ───────────────────────────────────────────── */}
      <DiscountPopup
        isOpen={isDiscountOpen}
        onClose={() => setIsDiscountOpen(false)}
        orderTotal={serverTotal}
      />

      {/* ─── Cart panel ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#fff',
        }}
      >
        {/* Section header */}
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '2px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#F5C142',
                border: '2px solid #1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '2px 2px 0px #1A1A1A',
              }}
            >
              🛒
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 900, color: '#1A1A1A' }}>
              Current Order
            </h2>
          </div>

          <span
            style={{
              background: '#F5F0E8',
              border: '2px solid #1A1A1A',
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#1A1A1A',
              fontFamily: 'monospace',
            }}
          >
            {items.reduce((sum, i) => sum + (i.quantity || 0), 0)} items
          </span>
        </div>

        {/* ─── Cart items list ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {items.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '160px',
                gap: '8px',
                color: '#6B7280',
              }}
            >
              <span style={{ fontSize: '36px', opacity: 0.4 }}>☕</span>
              <p style={{ fontSize: '14px', fontWeight: 700 }}>No items yet</p>
              <p style={{ fontSize: '12px' }}>Tap a product to add it</p>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '10px 0',
                    borderBottom: '1px solid #E5E7EB',
                  }}
                >
                  {/* Product name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1A1A1A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.product_name || item.name}
                    </p>
                    <p
                      style={{
                        fontSize: '11px',
                        color: '#6B7280',
                        fontFamily: 'monospace',
                        marginTop: '2px',
                      }}
                    >
                      {formatCurrency(item.unit_price)} each
                    </p>
                  </div>

                  {/* Qty stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      aria-label={`Decrease quantity of ${item.product_name || item.name}`}
                      onClick={() => updateQty(item.product_id, item.quantity - 1)}
                      disabled={isCartLoading}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '2px solid #1A1A1A',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isCartLoading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 900,
                        color: '#1A1A1A',
                        flexShrink: 0,
                        minWidth: '28px',
                        minHeight: '44px',
                      }}
                    >
                      {isCartLoading ? <SpinnerDot /> : '−'}
                    </button>

                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '14px',
                        width: '24px',
                        textAlign: 'center',
                        color: '#1A1A1A',
                      }}
                    >
                      {item.quantity}
                    </span>

                    <button
                      aria-label={`Increase quantity of ${item.product_name || item.name}`}
                      onClick={() => updateQty(item.product_id, item.quantity + 1)}
                      disabled={isCartLoading}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        border: '2px solid #1A1A1A',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isCartLoading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 900,
                        color: '#1A1A1A',
                        flexShrink: 0,
                        minWidth: '28px',
                        minHeight: '44px',
                      }}
                    >
                      {isCartLoading ? <SpinnerDot /> : '+'}
                    </button>
                  </div>

                  {/* Line total */}
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                      minWidth: '64px',
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(item.line_total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Order Summary box ────────────────────────────────────── */}
        <div
          style={{
            margin: '12px 16px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            padding: '14px 16px',
            flexShrink: 0,
          }}
        >
          {/* Subtotal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Subtotal</span>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1A1A1A' }}>
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Tax */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Tax</span>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1A1A1A' }}>
              {formatCurrency(tax)}
            </span>
          </div>

          {/* Coupon discount preview — shown when coupon applied but not yet paid */}
          {discountPreview && serverDiscount === 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                background: '#F0FDF4',
                margin: '4px -16px',
                padding: '6px 16px',
                border: '1px dashed #22C55E',
              }}
            >
              <span style={{ fontSize: '13px', color: '#065F46', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🏷</span>
                <span>
                  <strong style={{ fontFamily: 'monospace' }}>{discountPreview.code}</strong>
                  <span style={{ color: '#6B7280', marginLeft: 4, fontSize: 11 }}>(preview)</span>
                </span>
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#065F46', fontWeight: 700 }}>
                −{formatCurrency(discountPreview.discount_amount)}
              </span>
            </div>
          )}

          {/* Server-confirmed discount (already baked into total) */}
          {serverDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#92400E' }}>Discount</span>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#92400E' }}>
                −{formatCurrency(serverDiscount)}
              </span>
            </div>
          )}

          {/* Tip (if any) */}
          {tip > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Tip</span>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1A1A1A' }}>
                +{formatCurrency(tip)}
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#1A1A1A', margin: '10px 0' }} />

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#1A1A1A' }}>Total</span>
            <div style={{ textAlign: 'right' }}>
              {discountPreview && serverDiscount === 0 && (
                <div style={{ fontSize: 11, color: '#9CA3AF', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                  {formatCurrency(serverTotal)}
                </div>
              )}
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  fontWeight: 900,
                  color: discountPreview && serverDiscount === 0 ? '#065F46' : '#1A1A1A',
                }}
              >
                {formatCurrency(displayTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Action buttons ────────────────────────────────────────── */}
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {/* Send error */}
          {sendError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '2px solid #EF4444',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#EF4444',
              }}
            >
              {sendError}
            </div>
          )}

          {/* Discount / Coupon button — only on draft orders with items */}
          {isDraft && items.length > 0 && (
            <button
              id="cart-discount-btn"
              onClick={() => setIsDiscountOpen(true)}
              style={{
                background: couponCode ? '#F0FDF4' : '#fff',
                border: couponCode ? '2px solid #22C55E' : '2px solid #1A1A1A',
                borderRadius: '10px',
                color: couponCode ? '#065F46' : '#1A1A1A',
                fontWeight: 700,
                fontSize: '13px',
                padding: '10px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                minHeight: '44px',
                transition: 'all 0.15s',
                boxShadow: couponCode ? '2px 2px 0 #22C55E' : '2px 2px 0 #1A1A1A',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🏷</span>
                {couponCode ? (
                  <>
                    <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{couponCode}</span>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>applied</span>
                  </>
                ) : (
                  'Add Discount Code'
                )}
              </span>
              {couponCode ? (
                <span style={{ fontSize: 14, color: '#22C55E', fontWeight: 900 }}>
                  −{formatCurrency(discountPreview?.discount_amount)}
                </span>
              ) : (
                <span style={{ fontSize: 14, color: '#9CA3AF' }}>›</span>
              )}
            </button>
          )}

          {/* Send to Kitchen — PRIMARY */}
          <button
            onClick={handleSendToKitchen}
            disabled={items.length === 0 || !isDraft || isSending || isCartLoading}
            style={{
              background: items.length === 0 || !isDraft ? '#E5E7EB' : '#F5C142',
              border: '2px solid #1A1A1A',
              borderRadius: '10px',
              color: '#1A1A1A',
              fontWeight: 900,
              fontSize: '14px',
              padding: '14px 16px',
              cursor:
                items.length === 0 || !isDraft || isSending || isCartLoading
                  ? 'not-allowed'
                  : 'pointer',
              opacity: items.length === 0 || !isDraft ? 0.5 : 1,
              boxShadow: items.length === 0 || !isDraft ? 'none' : '3px 3px 0px #1A1A1A',
              transition: 'all 0.15s ease',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSending ? (
              <>
                <SpinnerDot />
                Sending…
              </>
            ) : isSent ? (
              '✓ Sent to Kitchen'
            ) : (
              '🍳 Send to Kitchen'
            )}
          </button>

          {/* Delete Order — DANGER (draft only) */}
          {isDraft && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isDeleting || isCartLoading}
              style={{
                background: 'transparent',
                border: '2px solid #1A1A1A',
                borderRadius: '10px',
                color: '#EF4444',
                fontWeight: 700,
                fontSize: '13px',
                padding: '10px 16px',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 1,
                transition: 'all 0.15s ease',
                minHeight: '44px',
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete Order'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
