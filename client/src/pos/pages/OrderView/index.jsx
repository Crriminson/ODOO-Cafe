import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PosLayout from '../../layout/PosLayout.jsx';
import ProductSection from './ProductSection/index.jsx';
import CartSection from './CartSection/index.jsx';
import useCartStore from '../../../shared/stores/useCartStore.js';
import { createOrder, getOrderById } from '../../../shared/api/orders.api.js';
import { getCurrentSession } from '../../../shared/api/sessions.api.js';

// ─── Skeleton loader shaped like the 3-column layout ─────────────────────
function OrderViewSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr auto',
        gap: '16px',
        height: 'calc(100vh - 80px)',
        padding: '16px',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {[1, 2, 3].map((col) => (
        <div
          key={col}
          style={{
            backgroundColor: '#E5E7EB',
            borderRadius: '12px',
            animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
      ))}
    </div>
  );
}

// ─── Tab bar for small screens ────────────────────────────────────────────
const TABS = ['Products', 'Cart', 'Payment'];

export default function OrderView() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { setCurrentOrder, clearCart, currentOrder } = useCartStore();

  const orderType = useCartStore((s) => s.orderType);
  const tableId = useCartStore((s) => s.tableId);

  const [initError, setInitError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('Products');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Track initialization to avoid double-creating orders in StrictMode
  const initialized = useRef(false);

  // ─── Responsive listener ────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ─── Bootstrap: load or create the order ───────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const bootstrap = async () => {
      setIsInitializing(true);
      setInitError(null);
      try {
        if (orderId) {
          // Existing order — fetch from server
          const res = await getOrderById(orderId);
          setCurrentOrder(res.order);
        } else {
          // New order — first fetch current session id
          const sessionRes = await getCurrentSession();
          const sessionId = sessionRes?.session?.id;

          if (!sessionId) {
            // No open session — redirect back to session screen
            navigate('/pos/session', { replace: true });
            return;
          }

          const body = {
            session_id: sessionId,
            order_type: orderType || 'takeaway',
            table_id: tableId || null,
            items: [],
          };

          const res = await createOrder(body);
          setCurrentOrder(res.order);
        }
      } catch (err) {
        console.error('[OrderView] bootstrap error:', err);
        setInitError(err.message || 'Failed to load order. Please go back and try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    bootstrap();
    // clearCart on unmount so stale order doesn't leak into next view
    return () => {
      // intentionally not clearing on unmount — user may navigate back
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Error state ────────────────────────────────────────────────────
  if (initError) {
    return (
      <PosLayout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)',
            backgroundColor: 'var(--color-canvas)',
            padding: '24px',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--color-error-bg)',
              border: '2px solid var(--color-error)',
              borderRadius: '12px',
              padding: '20px 24px',
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: '14px' }}>
              {initError}
            </span>
          </div>
          <button
            className="back-btn"
            onClick={() => navigate('/pos/order-type')}
          >
            ← Back to Order Type
          </button>
        </div>
      </PosLayout>
    );
  }

  // ─── Skeleton while order is being created / fetched ───────────────
  if (isInitializing) {
    return (
      <PosLayout>
        <OrderViewSkeleton />
      </PosLayout>
    );
  }

  // ─── Render: top bar + 3-col (desktop) or tab (mobile) ─────────────
  return (
    <PosLayout>
      {/* Top context bar */}
      <div
        style={{
          backgroundColor: '#1A1A1A',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          fontSize: '13px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              clearCart();
              navigate('/pos/order-type');
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: '#fff',
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
            }}
            aria-label="Go back to order type selection"
          >
            ← Back
          </button>
          <span style={{ fontWeight: 900, fontSize: '14px' }}>
            {currentOrder ? `Order #${currentOrder.id}` : 'New Order'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Order type badge */}
          <span
            style={{
              background: 'rgba(245,193,66,0.15)',
              border: '1px solid #F5C142',
              color: '#F5C142',
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {currentOrder?.order_type === 'dine_in'
              ? `🍽 Dine-In${tableId ? ` · T${tableId}` : ''}`
              : '🥡 Takeaway'}
          </span>

          {/* Status badge */}
          {currentOrder?.status && (
            <span
              style={{
                background:
                  currentOrder.status === 'draft'
                    ? '#FEF3C7'
                    : currentOrder.status === 'sent'
                    ? '#DBEAFE'
                    : currentOrder.status === 'paid'
                    ? '#D1FAE5'
                    : '#F3F4F6',
                color:
                  currentOrder.status === 'draft'
                    ? '#92400E'
                    : currentOrder.status === 'sent'
                    ? '#1E40AF'
                    : currentOrder.status === 'paid'
                    ? '#065F46'
                    : '#6B7280',
                borderRadius: '999px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {currentOrder.status === 'draft'
                ? 'Draft'
                : currentOrder.status === 'sent'
                ? 'Sent to Kitchen'
                : currentOrder.status === 'paid'
                ? 'Paid'
                : 'Cancelled'}
            </span>
          )}
        </div>
      </div>

      {/* Mobile tab bar */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            borderBottom: '2px solid #1A1A1A',
            backgroundColor: 'var(--color-canvas)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderBottom: activeTab === tab ? '3px solid #F5C142' : '3px solid transparent',
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                fontWeight: activeTab === tab ? 900 : 700,
                fontSize: '13px',
                color: '#1A1A1A',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Content area */}
      {isMobile ? (
        <div style={{ height: 'calc(100vh - 160px)', overflow: 'hidden' }}>
          {activeTab === 'Products' && <ProductSection />}
          {activeTab === 'Cart' && <CartSection />}
          {activeTab === 'Payment' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                backgroundColor: 'var(--color-canvas)',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '32px' }}>💳</span>
              <p style={{ fontWeight: 900, color: '#1A1A1A', fontSize: '16px' }}>Payment</p>
              <p style={{ color: '#6B7280', fontSize: '13px' }}>Coming in Task E</p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop 3-column layout: Products 5fr | Cart 4fr | Payment 3fr */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '5fr 4fr 3fr',
            height: 'calc(100vh - 120px)',
            backgroundColor: 'var(--color-canvas)',
            gap: '0',
          }}
        >
          {/* Products column */}
          <div
            style={{
              borderRight: '2px solid #1A1A1A',
              overflowY: 'auto',
            }}
          >
            <ProductSection />
          </div>

          {/* Cart column */}
          <div
            style={{
              borderRight: '2px solid #1A1A1A',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CartSection />
          </div>

          {/* Payment placeholder column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-canvas)',
              gap: '8px',
              padding: '24px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#F5C142',
                border: '2px solid #1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '2px 2px 0px #1A1A1A',
              }}
            >
              💳
            </div>
            <p style={{ fontWeight: 900, color: '#1A1A1A', fontSize: '16px', marginTop: '8px' }}>
              Payment
            </p>
            <p style={{ color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>
              Available after sending
              <br />order to kitchen
            </p>
          </div>
        </div>
      )}
    </PosLayout>
  );
}



