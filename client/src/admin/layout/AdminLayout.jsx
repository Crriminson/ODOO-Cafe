import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  CalendarClock,
  ChefHat,
  Coffee,
  CreditCard,
  Grid3x3,
  LayoutDashboard,
  LogOut,
  Menu,
  Percent,
  Settings,
  Tag,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';

// ---------------------------------------------------------------------------
// Nav items — order is locked per master guide
// ---------------------------------------------------------------------------
const NAV_ITEMS = [
  { label: 'Dashboard',           to: '/admin',                    icon: LayoutDashboard, end: true },
  { label: 'Products',            to: '/admin/products',           icon: Coffee },
  { label: 'Categories',          to: '/admin/categories',         icon: Tag },
  { label: 'Payment Methods',     to: '/admin/payment-methods',    icon: CreditCard },
  { label: 'Floors & Tables',     to: '/admin/floors-tables',      icon: Grid3x3 },
  { label: 'Coupons & Promotions',to: '/admin/coupons-promotions', icon: Percent },
  { label: 'Employees',           to: '/admin/employees',          icon: Users },
  { label: 'Cooks',               to: '/admin/cooks',              icon: ChefHat },
  { label: 'Reports',             to: '/admin/reports',            icon: BarChart3 },
  { label: 'Settings',            to: '/admin/settings',           icon: Settings },
  { label: 'Booking',             to: '/admin/booking',            icon: CalendarClock },
];

// Base classes shared by every nav item (link + button)
const itemBase =
  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors duration-150 w-full text-left';

const activeClass   = 'bg-[#F5C142] text-[#1A1A1A]';
const inactiveClass = 'text-[#9CA3AF] hover:bg-white/[0.08]';

// ---------------------------------------------------------------------------
// Sidebar content — extracted so desktop + drawer both render the same thing
// ---------------------------------------------------------------------------
function SidebarContent({ onClose }) {
  const { logout } = useAuth();


  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F5C142] border-2 border-[#1A1A1A] shrink-0"
          style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
        >
          <Coffee size={18} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </div>
        <span className="text-white font-black text-lg leading-none">Odoo Cafe</span>

        {/* Close button — only visible inside the drawer */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto text-[#9CA3AF] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `${itemBase} ${isActive ? activeClass : inactiveClass}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Log out */}
      <div className="p-3 border-t border-white/10">
        {/* useAuth().logout() internally calls clearUser() + navigate('/login') */}
        <button
          onClick={logout}
          className={`${itemBase} ${inactiveClass} hover:text-white`}
        >
          <LogOut size={18} strokeWidth={2} />
          Log Out
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AdminLayout
// ---------------------------------------------------------------------------
export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const noMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const openDrawer  = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-[#1A1A1A] shrink-0 fixed inset-y-0 left-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer — always mounted, toggled via translate-x ── */}
      {/* Overlay */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-40 bg-[#1A1A1A]/50 transition-opacity duration-200',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />
      {/* Drawer panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-60 bg-[#1A1A1A] flex flex-col',
          noMotion ? '' : 'transition-transform duration-200 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!drawerOpen}
      >
        <SidebarContent onClose={closeDrawer} />
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 lg:ml-60 min-h-screen bg-[#F5F0E8] overflow-y-auto">
        {/* Hamburger — mobile only */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center bg-[#F5F0E8] border-b border-black/[0.06] px-4 py-2">
          <button
            onClick={openDrawer}
            aria-label="Open navigation"
            className="w-11 h-11 flex items-center justify-center text-[#1A1A1A] hover:bg-black/[0.06] rounded-lg transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="ml-2 font-black text-[#1A1A1A] text-sm">Admin</span>
        </div>

        {/* Page content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
