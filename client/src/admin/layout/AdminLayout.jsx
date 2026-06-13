import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, CreditCard, Layers, Ticket, Users, BarChart2, LogOut } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Dashboard',            to: '/admin/dashboard',       icon: LayoutDashboard },
  { label: 'Products',             to: '/admin/products',        icon: Package },
  { label: 'Categories',           to: '/admin/categories',      icon: Tag },
  { label: 'Payment Methods',      to: '/admin/payment-methods', icon: CreditCard },
  { label: 'Floors & Tables',      to: '/admin/floors-tables',   icon: Layers },
  { label: 'Coupons & Promotions', to: '/admin/coupons',         icon: Ticket },
  { label: 'Employees',            to: '/admin/employees',       icon: Users },
  { label: 'Reports',              to: '/admin/reports',         icon: BarChart2 },
];

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-canvas)' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#1A1A1A' }}>

        {/* Brand */}
        <div className="px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: '#714867', boxShadow: 'var(--shadow-sm)' }}>
              <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>☕</span>
            </div>
            <span className="text-[0.9rem] font-black tracking-tight text-white">Odoo Cafe</span>
          </div>
          <p className="text-xs mt-1 ml-10.5" style={{ color: '#6B7280' }}>Admin Panel</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {NAV_LINKS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors duration-150 ${
                  isActive
                    ? 'text-[#1A1A1A]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: '#714867' }
                  : { background: 'transparent' }
              }
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (e.currentTarget.getAttribute('aria-current') !== 'page') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Log out */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors duration-150"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#9CA3AF';
            }}
          >
            <LogOut size={16} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main column ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 flex-shrink-0 border-b"
                style={{ background: '#1A1A1A', borderColor: 'rgba(255,255,255,0.08)' }}>
          <span className="text-sm font-bold text-white tracking-tight">Odoo Cafe POS</span>
          <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#714867' }}>Admin</span>
        </header>

        {/* Page content — cream canvas */}
        <main className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--color-canvas)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
