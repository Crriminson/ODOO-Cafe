import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';
import { Users, ShoppingBag, Coffee, LogOut } from 'lucide-react';

/**
 * Main Layout Shell for the POS application interface.
 *
 * Renders a sticky header with:
 *   • Branding (☕ Odoo Cafe POS)
 *   • Nav links: New Order  |  Customers
 *   • Log Out button (clears auth and sends to /login)
 *
 * NavLink automatically applies the `active` class when the current
 * path starts with the link's `to` value, so we drive styling from CSS.
 */
export default function PosLayout({ children }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="pos-layout">
      <header className="pos-header">
        {/* ── Brand ─────────────────────────────────────────────────── */}
        <div className="pos-logo-container">
          <span className="pos-logo-icon">☕</span>
          <h1 className="pos-logo-text">Odoo Cafe POS</h1>
        </div>

        {/* ── Navigation links ──────────────────────────────────────── */}
        <nav className="pos-nav" aria-label="POS navigation">
          <NavLink
            to="/pos/order-type"
            className={({ isActive }) =>
              'pos-nav-link' + (isActive ? ' pos-nav-link--active' : '')
            }
          >
            <ShoppingBag size={15} strokeWidth={2.5} />
            New Order
          </NavLink>

          <NavLink
            to="/pos/customers"
            className={({ isActive }) =>
              'pos-nav-link' + (isActive ? ' pos-nav-link--active' : '')
            }
          >
            <Users size={15} strokeWidth={2.5} />
            Customers
          </NavLink>
        </nav>

        {/* ── Log out ───────────────────────────────────────────────── */}
        <button
          className="pos-logout-btn"
          onClick={handleLogout}
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={15} strokeWidth={2.5} />
          Log out
        </button>
      </header>

      <main className="pos-main">
        <div className="pos-container">
          {children}
        </div>
      </main>
    </div>
  );
}
