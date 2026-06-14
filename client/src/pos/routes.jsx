import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import PosLayout from './layout/PosLayout.jsx';
import SessionScreen from './pages/SessionScreen/index.jsx';
import OrderTypeSelect from './pages/OrderTypeSelect/index.jsx';
import TableView from './pages/TableView/index.jsx';
import OrderView from './pages/OrderView/index.jsx';
import FloorPopup from './pages/FloorPopup/index.jsx';
import Customers from './pages/Customers/index.jsx';
import { getCurrentSession } from '../shared/api/sessions.api.js';

/**
 * PosIndex — session gate for /pos.
 *
 * Checks whether a POS session is open before entering:
 *   • session open  → /pos/order-type
 *   • no session    → /pos/session
 *   • loading       → minimal inline spinner (no flash)
 */
function PosIndex() {
  const navigate   = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentSession()
      .then((res) => {
        if (cancelled) return;
        navigate(res?.session ? '/pos/order-type' : '/pos/session', { replace: true });
      })
      .catch(() => {
        if (!cancelled) navigate('/pos/session', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!checking) return null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-canvas, #F9F5F0)',
      flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #E5E7EB',
        borderTopColor: '#1A1A1A', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Checking session…</span>
    </div>
  );
}

export default function PosRoutes() {
  return (
    <Routes>
      {/* Bare /pos gate — no layout needed, redirects immediately */}
      <Route index element={<PosIndex />} />

      {/* Session screen — outside sidebar layout (full-page) */}
      <Route path="session" element={<SessionScreen />} />

      {/* All other POS pages share the sidebar layout via Outlet */}
      <Route element={<PosLayout />}>
        <Route path="order-type"          element={<OrderTypeSelect />} />
        <Route path="tables"              element={<TableView />} />
        <Route path="floor-popup"         element={<FloorPopup />} />
        <Route path="order-view"          element={<OrderView />} />
        <Route path="order-view/:orderId" element={<OrderView />} />
        <Route path="customers"           element={<Customers />} />
        <Route path="orders"              element={<div className="p-8 text-gray-500 font-semibold">Orders list — coming soon</div>} />
      </Route>

      {/* Catch-all: unknown /pos/* bounces back to gate */}
      <Route path="*" element={<Navigate to="/pos" replace />} />
    </Routes>
  );
}
