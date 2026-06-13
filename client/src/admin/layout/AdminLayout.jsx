import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Dashboard',            to: '/admin/dashboard' },
  { label: 'Products',             to: '/admin/products' },
  { label: 'Categories',           to: '/admin/categories' },
  { label: 'Payment Methods',      to: '/admin/payment-methods' },
  { label: 'Floors & Tables',      to: '/admin/floors-tables' },
  { label: 'Coupons & Promotions', to: '/admin/coupons' },
  { label: 'Employees',            to: '/admin/employees' },
  { label: 'Reports',              to: '/admin/reports' },
];

export default function AdminLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
        <div className="px-4 py-5 border-b border-gray-200">
          <span className="text-sm font-semibold text-amber-400 uppercase tracking-widest">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_LINKS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-amber-50 text-amber-600 border-r-2 border-amber-400'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                ].join(' ')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ── Main column ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 flex-shrink-0">
          <span className="text-base font-semibold tracking-tight text-gray-900">
            Odoo Cafe POS
          </span>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
          >
            Log out
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
