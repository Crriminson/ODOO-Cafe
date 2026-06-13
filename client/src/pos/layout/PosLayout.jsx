import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Coffee,
  LayoutList,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  Tag,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useCartStore } from '@/shared/stores/useCartStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Primary top-bar nav (full nav hidden below lg)
const NAV_LINKS = [
  { label: 'POS Order',   to: '/pos',            end: true },
  { label: 'Orders',      to: '/pos/orders' },
  { label: 'Customer',    to: '/pos/customers' },
  { label: 'Table View',  to: '/pos/tables' },
];

// Hamburger menu items
// adminOnly items are disabled for employees
const MENU_ITEMS = [
  { label: 'Products',             to: '/admin/products',           adminOnly: true },
  { label: 'Category',             to: '/admin/categories',         adminOnly: true },
  { label: 'Payment Method',       to: '/admin/payment-methods',    adminOnly: true },
  { label: 'Coupon & Promotion',   to: '/admin/coupons-promotions', adminOnly: true },
  { label: 'Booking',              to: '/admin/booking',            adminOnly: true },
  { label: 'User / Employee',      to: '/admin/employees',          adminOnly: true },
  { label: 'KDS',                  to: '/kds',                      adminOnly: false },
  { label: 'Reports',              to: '/admin/reports',            adminOnly: true },
];

// Shared NavLink active / inactive classes (same language as AdminLayout)
const navActiveClass   = 'bg-[#F5C142] text-[#1A1A1A] font-bold rounded-lg px-3 py-1.5 text-sm';
const navInactiveClass = 'text-[#9CA3AF] font-bold rounded-lg px-3 py-1.5 text-sm hover:bg-white/[0.08] transition-colors';

// ---------------------------------------------------------------------------
// Debounced search hook (local — no external library)
// ---------------------------------------------------------------------------
function useDebouncedCallback(fn, delay = 300) {
  const timerRef = useRef(null);
  return useCallback(
    (value) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(value), delay);
    },
    [fn, delay]
  );
}

// ---------------------------------------------------------------------------
// Close-on-outside-click + Esc helper hook
// ---------------------------------------------------------------------------
function useDropdownDismiss(isOpen, close) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && close();
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && close();
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [isOpen, close]);

  return ref;
}

// ---------------------------------------------------------------------------
// Current page label (shown below lg in place of full nav)
// ---------------------------------------------------------------------------
function useCurrentPageLabel() {
  const { pathname } = useLocation();
  const match = [...NAV_LINKS].reverse().find((l) => pathname.startsWith(l.to));
  return match?.label ?? 'POS';
}

// ---------------------------------------------------------------------------
// PosLayout
// ---------------------------------------------------------------------------
export default function PosLayout({ onSearch = () => {} }) {
  const { user, logout } = useAuth();
  const tableId = useCartStore((s) => s.tableId);
  const navigate = useNavigate();
  const pageLabel = useCurrentPageLabel();

  // Reduced-motion flag (read once)
  const noMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Dropdown states
  const [userMenuOpen, setUserMenuOpen]         = useState(false);
  const [hamburgerOpen, setHamburgerOpen]       = useState(false);

  const closeUserMenu   = useCallback(() => setUserMenuOpen(false), []);
  const closeHamburger  = useCallback(() => setHamburgerOpen(false), []);

  const userMenuRef    = useDropdownDismiss(userMenuOpen, closeUserMenu);
  const hamburgerRef   = useDropdownDismiss(hamburgerOpen, closeHamburger);

  // Debounced search
  const handleSearch = useDebouncedCallback(onSearch, 300);

  // Logout handler
  const handleLogout = () => {
    closeUserMenu();
    closeHamburger();
    logout(); // internally calls clearUser() + navigate('/login')
  };

  // Shared dropdown panel style
  const dropdownClass =
    'absolute top-full mt-2 right-0 z-50 bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden min-w-[180px]' +
    ' shadow-[0_8px_24px_rgba(0,0,0,0.4)]';

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top bar ── */}
      <header className="bg-[#1A1A1A] h-16 flex items-center px-4 gap-4 shrink-0 sticky top-0 z-30">
        {/* Brand badge — hidden below md */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F5C142] border-2 border-[#1A1A1A] shrink-0"
            style={{ boxShadow: '2px 2px 0px #F5C142' }}
          >
            <Coffee size={18} strokeWidth={2.5} className="text-[#1A1A1A]" />
          </div>
        </div>

        {/* Nav links — hidden below lg; show current page label instead */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ label, to, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? navActiveClass : navInactiveClass}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Current page label — below lg only */}
        <span className="lg:hidden text-white font-bold text-sm">{pageLabel}</span>

        {/* Search — hidden below md */}
        <div className="hidden md:flex flex-1 max-w-md items-center relative">
          <Search size={16} className="absolute left-3 text-[#9CA3AF] pointer-events-none" />
          <input
            type="search"
            placeholder="Search products…"
            onChange={(e) => handleSearch(e.target.value)}
            className={[
              'w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-[#9CA3AF]',
              'bg-white/10 border-2 border-white/20 outline-none',
              noMotion
                ? 'focus:border-[#F5C142]'
                : 'focus:border-[#F5C142] transition-colors duration-150',
            ].join(' ')}
          />
        </div>

        {/* Spacer — pushes right-side items to the end */}
        <div className="flex-1 lg:flex-none" />

        {/* Table pill */}
        {tableId != null && (
          <span className="bg-[#F5C142] text-[#1A1A1A] font-mono font-black text-sm px-3 py-1.5 rounded-lg shrink-0">
            T{tableId}
          </span>
        )}

        {/* Employee indicator + user dropdown — md+ */}
        <div className="relative hidden md:block" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 text-white text-sm font-bold hover:opacity-80 min-w-[44px] min-h-[44px] px-2 transition-opacity"
          >
            <UserCircle size={18} />
            <span className="max-w-[120px] truncate">{user?.name}</span>
          </button>

          {/* User dropdown */}
          {userMenuOpen && (
            <div className={dropdownClass}>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white transition-colors font-bold"
              >
                <LogOut size={16} strokeWidth={2} />
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <div className="relative shrink-0" ref={hamburgerRef}>
          <button
            onClick={() => setHamburgerOpen((o) => !o)}
            aria-label={hamburgerOpen ? 'Close menu' : 'Open menu'}
            aria-haspopup="true"
            aria-expanded={hamburgerOpen}
            className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/[0.08] rounded-lg transition-colors"
          >
            {hamburgerOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Hamburger dropdown */}
          {hamburgerOpen && (
            <div className={`${dropdownClass} min-w-[220px]`}>
              {/* Employee info row — visible below md only */}
              <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-white/10 text-white text-sm font-bold">
                <UserCircle size={16} />
                <span className="truncate">{user?.name}</span>
              </div>

              {MENU_ITEMS.map(({ label, to, adminOnly }) =>
                adminOnly ? (
                  // Admin-only items — disabled for employees, visible but inert
                  <span
                    key={to}
                    aria-disabled="true"
                    title="Admin access required"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#9CA3AF] font-bold opacity-40 pointer-events-none select-none"
                  >
                    {label}
                  </span>
                ) : (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeHamburger}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white transition-colors font-bold"
                  >
                    {label}
                  </NavLink>
                )
              )}

              {/* Divider + logout */}
              <div className="border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#9CA3AF] hover:bg-white/[0.08] hover:text-white transition-colors font-bold"
                >
                  <LogOut size={16} strokeWidth={2} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Content area ── */}
      <main className="flex-1 bg-[#F5F0E8] overflow-y-auto">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
