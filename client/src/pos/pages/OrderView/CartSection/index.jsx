import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../../../shared/stores/useCartStore.js';
import Modal from '../../../../shared/components/Modal.jsx';
import { sendToKitchen, deleteOrder } from '../../../../shared/api/orders.api.js';

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

// ─── Tiny spinner for qty steppers during cart sync ───────────────────────
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

export default function CartSection() {
  const navigate = useNavigate();

  const currentOrder = useCartStore((s) => s.currentOrder);
  const isCartLoading = useCartStore((s) => s.isCartLoading);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const setCurrentOrder = useCartStore((s) => s.setCurrentOrder);
  const clearCart = useCartStore((s) => s.clearCart);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const items = currentOrder?.items || [];

  const calculatedSubtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.unit_price || item.price || 0);
    const qty = item.quantity || 0;
    return sum + price * qty;
  }, 0);

  const calculatedTax = items.reduce((sum, item) => {
    const price = parseFloat(item.unit_price || item.price || 0);
    const qty = item.quantity || 0;
    const rateVal = parseFloat(item.tax_rate || 0);
    const rate = rateVal < 1 && rateVal > 0 ? rateVal * 100 : rateVal;
    return sum + (price * qty * rate) / 100;
  }, 0);

  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const subtotal = currentOrder ? parseFloat(currentOrder.subtotal) : calculatedSubtotal;
  const tax = currentOrder ? parseFloat(currentOrder.tax_total) : calculatedTax;
  const total = currentOrder ? parseFloat(currentOrder.total) : calculatedTotal;

  const isDraft = currentOrder?.status === 'draft';
  const isSent = currentOrder?.status === 'sent';

  // ─── Send to kitchen ─────────────────────────────────────────────────
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

  // ─── Delete draft order ──────────────────────────────────────────────
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
      {/* ─── Delete Confirmation Modal (P1's Modal component) ────────── */}
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

      {/* ─── Cart panel ─────────────────────────────────────────────── */}
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
                background: '#A67FA1',
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

        {/* ─── Cart items list ──────────────────────────────────────── */}
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
                /* Cart line item — guidelines §4.2 */
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
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

                  {/* Line total — server-returned value (guidelines: never local math for display) */}
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

        {/* ─── Order Summary box — guidelines §4.3 (inner-panel style) ─ */}
        <div
          style={{
            margin: '12px 16px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            padding: '14px 16px',
            flexShrink: 0,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
          >
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Subtotal</span>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1A1A1A' }}>
              {formatCurrency(subtotal)}
            </span>
          </div>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
          >
            <span style={{ fontSize: '13px', color: '#6B7280' }}>Tax</span>
            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1A1A1A' }}>
              {formatCurrency(tax)}
            </span>
          </div>
          {currentOrder && parseFloat(currentOrder.discount_total) > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#92400E' }}>Discount</span>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#92400E' }}>
                −{formatCurrency(currentOrder.discount_total)}
              </span>
            </div>
          )}

          {/* TODO: discount preview — pending P4 decision.
              Per tracker §C ⚠️: promotion discounts are only computed server-side
              at POST /orders/:id/pay. Do NOT build a preview UI here until the
              joint decision with P4 is made at Checkpoint A/B. */}

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: '#1A1A1A', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#1A1A1A' }}>Total</span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '18px',
                fontWeight: 900,
                color: '#1A1A1A',
              }}
            >
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* ─── Action buttons ───────────────────────────────────────── */}
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

          {/* Send to Kitchen — PRIMARY button */}
          <button
            onClick={handleSendToKitchen}
            disabled={
              items.length === 0 ||
              !isDraft ||
              isSending ||
              isCartLoading
            }
            style={{
              background:
                items.length === 0 || !isDraft
                  ? '#E5E7EB'
                  : '#A67FA1',
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

          {/* Delete Order — DANGER button (only while draft) */}
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


