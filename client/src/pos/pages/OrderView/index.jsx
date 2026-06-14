import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProductSection from './ProductSection/index.jsx';
import CartSection from './CartSection/index.jsx';
import PaymentSection from './PaymentSection/index.jsx';
import useCartStore from '../../../shared/stores/useCartStore.js';
import { createOrder, getOrderById } from '../../../shared/api/orders.api.js';
import { getCurrentSession } from '../../../shared/api/sessions.api.js';

// ─── Skeleton: 2-col (Products | RightPanel) ─────────────────────────────────
function OrderViewSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        height: '100%',
        backgroundColor: 'var(--color-canvas)',
      }}
    >
      {[1, 2].map((col) => (
        <div
          key={col}
          style={{
            margin: 16,
            backgroundColor: '#E5E7EB',
            borderRadius: 12,
            animation: 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        />
      ))}
    </div>
  );
}

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    draft:     { bg: '#FEF3C7', color: '#92400E', label: 'Draft' },
    sent:      { bg: '#DBEAFE', color: '#1E40AF', label: 'Sent to Kitchen' },
    paid:      { bg: '#D1FAE5', color: '#065F46', label: 'Paid' },
    cancelled: { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' },
  };
  const s = map[status] || map.cancelled;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 999, padding: '2px 10px',
      fontSize: 11, fontWeight: 600,
    }}>
      {s.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrderView() {
  const { orderId } = useParams();
  const navigate    = useNavigate();

  const { setCurrentOrder, clearCart, currentOrder } = useCartStore();
  const orderType  = useCartStore((s) => s.orderType);
  const tableId    = useCartStore((s) => s.tableId);

  const [initError,     setInitError]     = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Right-panel toggle: 'cart' | 'payment'
  const [panelView, setPanelView] = useState('cart');

  // Mobile breakpoint
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileTab, setMobileTab] = useState('Products'); // 'Products' | 'Cart' | 'Payment'

  const initialized = useRef(false);

  // ─── Responsive ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ─── Bootstrap ───────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const bootstrap = async () => {
      setIsInitializing(true);
      setInitError(null);
      try {
        if (orderId) {
          const res = await getOrderById(orderId);
          setCurrentOrder(res.order);
        } else {
          const sessionRes = await getCurrentSession();
          const sessionId  = sessionRes?.session?.id;
          if (!sessionId) {
            navigate('/pos/session', { replace: true });
            return;
          }
          const res = await createOrder({
            session_id: sessionId,
            order_type: orderType || 'takeaway',
            table_id:   tableId   || null,
            items: [],
          });
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sync panelView back to 'cart' if order returns to draft ─────────
  useEffect(() => {
    if (currentOrder?.status === 'draft') setPanelView('cart');
  }, [currentOrder?.status]);

  // ─── Error state ──────────────────────────────────────────────────────
  if (initError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100%',
        backgroundColor: 'var(--color-canvas)', padding: 24, gap: 16,
      }}>
        <div style={{
          background: 'var(--color-error-bg)', border: '2px solid var(--color-error)',
          borderRadius: 12, padding: '20px 24px', maxWidth: 480, width: '100%',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ color: 'var(--color-error)', fontWeight: 600, fontSize: 14 }}>{initError}</span>
        </div>
        <button
          onClick={() => navigate('/pos/order-type')}
          style={{
            padding: '8px 18px', fontWeight: 700, fontSize: 13,
            border: '2px solid #1A1A1A', background: '#fff',
            cursor: 'pointer', boxShadow: '3px 3px 0 #1A1A1A', fontFamily: 'inherit',
          }}
        >
          ← Back to Order Type
        </button>
      </div>
    );
  }

  if (isInitializing) return <OrderViewSkeleton />;

  // ─── Shared top context bar ───────────────────────────────────────────
  const TopBar = (
    <div style={{
      backgroundColor: '#1A1A1A', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px', fontSize: 13, gap: 12, flexWrap: 'wrap',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => { clearCart(); navigate('/pos/order-type'); }}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '4px 10px', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
          }}
          aria-label="Back to order type"
        >
          ← Back
        </button>
        <span style={{ fontWeight: 900, fontSize: 14 }}>
          {currentOrder ? `Order #${currentOrder.id}` : 'New Order'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          background: 'rgba(245,193,66,0.15)', border: '1px solid #F5C142',
          color: '#F5C142', padding: '3px 10px', fontSize: 11,
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {currentOrder?.order_type === 'dine_in'
            ? `🍽 Dine-In${tableId ? ` · T${tableId}` : ''}`
            : '🥡 Takeaway'}
        </span>
        {currentOrder?.status && <StatusBadge status={currentOrder.status} />}
      </div>
    </div>
  );

  // ─── Right panel — toggles between Cart and Payment ───────────────────
  const RightPanel = (
    <div style={{
      width: 340, flexShrink: 0,
      borderLeft: '2px solid #1A1A1A',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {panelView === 'cart' ? (
        <CartSection
          onProceedToPayment={() => setPanelView('payment')}
        />
      ) : (
        <PaymentSection
          onBack={() => setPanelView('cart')}
        />
      )}
    </div>
  );

  // ─── Mobile layout ────────────────────────────────────────────────────
  if (isMobile) {
    const isSent = currentOrder?.status === 'sent';
    const mobileTabs = ['Products', 'Cart', ...(isSent ? ['Payment'] : [])];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {TopBar}
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #1A1A1A', backgroundColor: 'var(--color-canvas)', flexShrink: 0 }}>
          {mobileTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              style={{
                flex: 1, padding: '12px', border: 'none',
                borderBottom: mobileTab === tab ? '3px solid #F5C142' : '3px solid transparent',
                backgroundColor: mobileTab === tab ? '#fff' : 'transparent',
                fontWeight: mobileTab === tab ? 900 : 700,
                fontSize: 13, color: '#1A1A1A', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {mobileTab === 'Products' && <ProductSection />}
          {mobileTab === 'Cart' && (
            <CartSection onProceedToPayment={() => { setMobileTab('Payment'); }} />
          )}
          {mobileTab === 'Payment' && (
            <PaymentSection onBack={() => setMobileTab('Cart')} />
          )}
        </div>
      </div>
    );
  }

  // ─── Desktop 2-column layout: Products | RightPanel ──────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {TopBar}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Products column */}
        <div style={{ flex: 1, borderRight: '2px solid #1A1A1A', overflowY: 'auto' }}>
          <ProductSection />
        </div>

        {/* Right panel (Cart ↔ Payment) */}
        {RightPanel}
      </div>
    </div>
  );
}
