import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, CreditCard, Layers,
  Ticket, Users, BarChart2, ChefHat, TrendingUp, ShoppingBag, Receipt, ArrowRight,
} from 'lucide-react';
import { request } from '../../../shared/api/client.js';

/* ── helpers ───────────────────────────────────────────── */
const today   = () => new Date().toISOString().slice(0, 10);
const fmt     = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(parseFloat(v) || 0);
const fmtNum  = (v) => new Intl.NumberFormat('en-IN').format(parseFloat(v) || 0);

/* ── stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-5"
         style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <Icon size={15} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
      </div>
      {loading
        ? <div className="h-8 w-3/4 rounded-lg animate-pulse" style={{ background: '#E5E7EB' }} />
        : <p className="font-mono font-black text-2xl text-[#1A1A1A] leading-none">{value}</p>}
      <p className="text-[10px] text-[#9CA3AF] mt-1">Today</p>
    </div>
  );
}

/* ── quick-nav card ────────────────────────────────────── */
function NavCard({ icon: Icon, label, desc, to }) {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(to)}
            className="bg-white border-2 border-[#1A1A1A] rounded-xl p-4 text-left flex items-center gap-3 hover:bg-[#F5F0E8] transition-colors group"
            style={{ boxShadow: 'var(--shadow-md)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0 group-hover:scale-105 transition-transform"
           style={{ background: '#F5C142', borderColor: '#1A1A1A' }}>
        <Icon size={16} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#1A1A1A]">{label}</p>
        <p className="text-xs text-[#6B7280] truncate">{desc}</p>
      </div>
      <ArrowRight size={14} strokeWidth={2} className="text-[#9CA3AF] group-hover:text-[#1A1A1A] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

const QUICK_LINKS = [
  { icon: Package,    label: 'Products',             desc: 'Add & manage menu items',                to: '/admin/products' },
  { icon: Tag,        label: 'Categories',           desc: 'Organise product groups',                to: '/admin/categories' },
  { icon: Layers,     label: 'Floors & Tables',      desc: 'Table layout and active status',         to: '/admin/floors-tables' },
  { icon: ChefHat,    label: 'Kitchen Staff',        desc: 'Cooks and order allocation',             to: '/admin/cooks' },
  { icon: CreditCard, label: 'Payment Methods',      desc: 'Enable cash, card, UPI',                 to: '/admin/payment-methods' },
  { icon: Ticket,     label: 'Coupons & Promotions', desc: 'Discount codes and auto-rules',          to: '/admin/coupons' },
  { icon: Users,      label: 'Employees',            desc: 'Staff accounts and roles',               to: '/admin/employees' },
  { icon: BarChart2,  label: 'Reports',              desc: 'Sales trends and analytics',             to: '/admin/reports' },
];

/* ── main page ─────────────────────────────────────────── */
export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = today();
    request(`/reports/summary?startDate=${t}&endDate=${t}`)
      .then((r) => setMetrics(r.metrics))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  const dayName = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <LayoutDashboard size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Dashboard</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-7 ml-12">{dayName} — here's how the café is doing today.</p>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={Receipt}     label="Orders today"     value={fmtNum(metrics?.total_orders ?? 0)}          loading={loading} />
        <StatCard icon={TrendingUp}  label="Revenue today"    value={fmt(metrics?.total_revenue ?? 0)}             loading={loading} />
        <StatCard icon={ShoppingBag} label="Avg order value"  value={fmt(metrics?.average_order_value ?? 0)}       loading={loading} />
      </div>

      {/* Quick-nav */}
      <div className="mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-3">Quick navigation</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_LINKS.map((lnk) => (
            <NavCard key={lnk.to} {...lnk} />
          ))}
        </div>
      </div>
    </div>
  );
}
