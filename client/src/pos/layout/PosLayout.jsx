/**
 * PosLayout — spec §7.1
 *
 * Sidebar layout matching AdminLayout.jsx's pattern exactly.
 * Dark #1A1A1A sidebar with: logo, nav links, search bar,
 * table indicator, employee chip, settings section, log out.
 * Renders <Outlet /> for all nested POS routes.
 */
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, ClipboardList, Users, LayoutGrid, Search, X,
  Package, Tag, CreditCard, Ticket, CalendarClock, UserCog,
  Monitor, BarChart2, LogOut, MapPin, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth';
import useCartStore from '../../shared/stores/useCartStore.js';
import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Nav links shown in sidebar ──────────────────────────────────────────────
const POS_NAV = [
  { label: 'POS Order',   to: '/pos/order-type', icon: ShoppingBag },
  { label: 'Orders',      to: '/pos/orders',     icon: ClipboardList },
  { label: 'Customer',    to: '/pos/customers',  icon: Users },
  { label: 'Table View',  to: '/pos/tables',     icon: LayoutGrid },
];

// ─── Settings section (expandable) ───────────────────────────────────────────
const SETTINGS_LINKS = [
  { label: 'Products',            icon: Package,       href: '/admin/products' },
  { label: 'Categories',          icon: Tag,           href: '/admin/categories' },
  { label: 'Payment Methods',     icon: CreditCard,    href: '/admin/payment-methods' },
  { label: 'Coupons & Promos',    icon: Ticket,        href: '/admin/coupons' },
  { label: 'Booking',             icon: CalendarClock, href: '/admin/booking', soon: true },
  { label: 'User / Employee',     icon: UserCog,       href: '/admin/employees' },
  { label: 'KDS',                 icon: Monitor,       href: '/kds', external: true },
  { label: 'Reports',             icon: BarChart2,     href: '/admin/reports' },
];

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function SideNavLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-colors duration-150 ${
          isActive ? 'text-[#1A1A1A]' : 'text-[#9CA3AF] hover:text-white'
        }`
      }
      style={({ isActive }) => isActive ? { background: '#F5C142' } : { background: 'transparent' }}
      onMouseEnter={(e) => {
        if (e.currentTarget.getAttribute('aria-current') !== 'page')
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        if (e.currentTarget.getAttribute('aria-current') !== 'page')
          e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon size={15} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export default function PosLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const setSearchQuery = useCartStore((s) => s.setSearchQuery);
  const searchQuery    = useCartStore((s) => s.searchQuery);
  const tableId        = useCartStore((s) => s.tableId);
  const orderType      = useCartStore((s) => s.orderType);
  const currentOrder   = useCartStore((s) => s.currentOrder);

  const [searchFocused,   setSearchFocused]   = useState(false);
  const [settingsOpen,    setSettingsOpen]     = useState(false);
  const searchRef = useRef(null);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const tableLabel = currentOrder?.table_id
    ? `Table ${currentOrder.table_id}`
    : tableId
    ? `Table ${tableId}`
    : null;
  const showTableBadge = tableLabel && orderType === 'dine_in';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-canvas)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#1A1A1A' }}>

        {/* Brand */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: '#F5C142', boxShadow: 'var(--shadow-sm)' }}>
              <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>☕</span>
            </div>
            <span className="text-[0.9rem] font-black tracking-tight text-white">Odoo Cafe</span>
          </div>
          <p className="text-xs mt-1 ml-10" style={{ color: '#6B7280' }}>Point of Sale</p>
        </div>

        {/* Product search */}
        <div className="px-3 pt-3 pb-2">
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              background: searchFocused ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${searchFocused ? '#F5C142' : 'rgba(255,255,255,0.12)'}`,
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <Search size={13} strokeWidth={2.5} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search products…"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-xs font-semibold"
              style={{ fontFamily: 'inherit' }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <X size={11} strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="px-2 pb-2 space-y-0.5">
          {POS_NAV.map(({ label, to, icon: Icon }) => (
            <SideNavLink key={to} to={to} icon={Icon} label={label} />
          ))}
        </nav>

        {/* Table indicator */}
        {showTableBadge && (
          <div className="mx-3 mb-2 px-3 py-2 flex items-center gap-2"
               style={{ background: 'rgba(245,193,66,0.12)', border: '1.5px solid #F5C142' }}>
            <MapPin size={12} strokeWidth={2.5} style={{ color: '#F5C142', flexShrink: 0 }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F5C142' }}>
              {tableLabel}
            </span>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 12px' }} />

        {/* Settings expandable section */}
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: '#6B7280', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7280'; }}
          >
            <span className="flex-1 text-left">Settings</span>
            {settingsOpen
              ? <ChevronUp size={13} strokeWidth={2.5} />
              : <ChevronDown size={13} strokeWidth={2.5} />}
          </button>

          {settingsOpen && (
            <div className="px-2 pb-2 space-y-0.5">
              {SETTINGS_LINKS.map(({ label, icon: Icon, href, soon, external }) => (
                <button
                  key={label}
                  onClick={() => external ? window.open(href, '_blank', 'noopener') : navigate(href)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-left transition-colors"
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                >
                  <Icon size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
                  <span className="flex-1">{label}</span>
                  {soon && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5"
                          style={{ background: 'rgba(245,193,66,0.12)', color: '#F5C142', border: '1px solid rgba(245,193,66,0.3)' }}>
                      Soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Employee chip + Log out */}
        <div className="p-3 border-t space-y-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {user && (
            <div className="flex items-center gap-2 px-3 py-2"
                 style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black"
                   style={{ background: '#F5C142', color: '#1A1A1A' }}>
                {initials(user.name || user.email)}
              </div>
              <span className="text-xs font-bold truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {user.name?.split(' ')[0] || user.email}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-colors duration-150"
            style={{ color: '#9CA3AF', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            <LogOut size={15} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden" style={{ background: 'var(--color-canvas)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
