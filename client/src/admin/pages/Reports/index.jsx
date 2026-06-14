import { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, ShoppingBag, Receipt, RefreshCw } from 'lucide-react';
import { request } from '../../../shared/api/client.js';

/* ── helpers ───────────────────────────────────────────── */
const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(parseFloat(v) || 0);

const fmtNum = (v) =>
  new Intl.NumberFormat('en-IN').format(parseFloat(v) || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const today     = () => new Date().toISOString().slice(0, 10);
const daysAgo   = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

const PRESETS = [
  { label: 'Today',   start: today(),      end: today() },
  { label: '7 days',  start: daysAgo(6),   end: today() },
  { label: '30 days', start: daysAgo(29),  end: today() },
  { label: '90 days', start: daysAgo(89),  end: today() },
];

/* ── skeleton block ────────────────────────────────────── */
function Skel({ h = 'h-8', w = 'w-full', cls = '' }) {
  return <div className={`${h} ${w} ${cls} rounded-lg animate-pulse`} style={{ background: '#E5E7EB' }} />;
}

/* ── stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, loading }) {
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
        ? <Skel h="h-8" w="w-3/4" cls="mb-1" />
        : <p className="font-mono font-black text-2xl text-[#1A1A1A] leading-none mb-1">{value}</p>}
      {sub && <p className="text-xs text-[#6B7280]">{sub}</p>}
    </div>
  );
}

/* ── pure-CSS bar chart (sales trend) ─────────────────── */
function TrendChart({ rows, loading }) {
  if (loading) {
    return (
      <div className="flex items-end gap-1 h-36 pt-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex-1 rounded-t animate-pulse"
               style={{ height: `${30 + Math.random() * 70}%`, background: '#E5E7EB' }} />
        ))}
      </div>
    );
  }
  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-sm text-[#6B7280]">
        No sales in this period
      </div>
    );
  }
  const maxRev = Math.max(...rows.map((r) => parseFloat(r.revenue) || 0), 1);
  return (
    <div className="space-y-1">
      {/* bars */}
      <div className="flex items-end gap-1 h-36">
        {rows.map((r) => {
          const pct = (parseFloat(r.revenue) / maxRev) * 100;
          return (
            <div key={r.date} className="flex-1 flex flex-col justify-end group relative" title={`${fmtDate(r.date)} — ${fmt(r.revenue)}`}>
              <div className="rounded-t transition-all duration-150 hover:opacity-80"
                   style={{ height: `${Math.max(pct, 3)}%`, background: '#F5C142', border: '2px solid #1A1A1A' }} />
              {/* tooltip */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                <div className="bg-[#1A1A1A] text-white text-[10px] font-mono px-1.5 py-1 rounded whitespace-nowrap">
                  {fmt(r.revenue)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* x-axis labels — show first, middle, last */}
      <div className="flex justify-between text-[10px] text-[#9CA3AF]">
        <span>{fmtDate(rows[0].date)}</span>
        {rows.length > 2 && <span>{fmtDate(rows[Math.floor(rows.length / 2)].date)}</span>}
        <span>{fmtDate(rows[rows.length - 1].date)}</span>
      </div>
    </div>
  );
}

/* ── horizontal bar (categories / products) ─────────────  */
function HBar({ label, value, maxValue, color, sub }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs font-bold text-[#1A1A1A] truncate flex-shrink-0">{label}</div>
      <div className="flex-1 h-5 rounded-md overflow-hidden border-2 border-[#1A1A1A]"
           style={{ background: '#F5F0E8' }}>
        <div className="h-full rounded transition-all duration-300"
             style={{ width: `${pct}%`, background: color || '#F5C142', minWidth: pct > 0 ? 4 : 0 }} />
      </div>
      <div className="w-20 text-right font-mono text-xs text-[#1A1A1A] flex-shrink-0">{sub}</div>
    </div>
  );
}

/* ── section card ──────────────────────────────────────── */
function Card({ title, children }) {
  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
         style={{ boxShadow: 'var(--shadow-xl)' }}>
      <div className="px-5 py-3 border-b-2 border-[#1A1A1A]" style={{ background: '#F5F0E8' }}>
        <p className="text-sm font-black text-[#1A1A1A]">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────── */
export default function Reports() {
  const [preset,    setPreset]    = useState(1);           // index into PRESETS
  const [dateRange, setDateRange] = useState(PRESETS[1]);  // 7-day default

  const [metrics,    setMetrics]    = useState(null);
  const [trend,      setTrend]      = useState([]);
  const [topProds,   setTopProds]   = useState([]);
  const [topCats,    setTopCats]    = useState([]);
  const [topOrders,  setTopOrders]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [apiErr,     setApiErr]     = useState('');

  const load = useCallback(async (range) => {
    setLoading(true);
    setApiErr('');
    const qs = `?startDate=${range.start}&endDate=${range.end}`;
    try {
      const [m, tr, tp, tc, to] = await Promise.all([
        request(`/reports/summary${qs}`),
        request(`/reports/sales-trend${qs}`),
        request(`/reports/top-products${qs}&limit=7`),
        request(`/reports/top-categories${qs}&limit=6`),
        request(`/reports/top-orders${qs}&limit=5`),
      ]);
      setMetrics(m.metrics);
      setTrend(tr.trend   || []);
      setTopProds(tp.products  || []);
      setTopCats(tc.categories || []);
      setTopOrders(to.orders   || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(dateRange); }, [load, dateRange]);

  const applyPreset = (i) => {
    setPreset(i);
    setDateRange(PRESETS[i]);
  };

  const maxProdRev = Math.max(...topProds.map((p) => parseFloat(p.revenue) || 0), 1);
  const maxCatRev  = Math.max(...topCats.map((c) => parseFloat(c.revenue) || 0), 1);

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <BarChart2 size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Reports</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">Sales performance, top products, and order analytics.</p>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Preset tabs */}
        {PRESETS.map((p, i) => (
          <button key={p.label} onClick={() => applyPreset(i)}
                  className="px-3 py-1.5 rounded-lg border-2 text-sm font-bold transition-colors duration-150"
                  style={preset === i
                    ? { background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }
                    : { background: '#fff', borderColor: '#1A1A1A', color: '#6B7280' }}>
            {p.label}
          </button>
        ))}

        {/* Custom date range */}
        <div className="flex items-center gap-1 ml-2">
          <input type="date" value={dateRange.start}
                 onChange={(e) => { setPreset(-1); setDateRange((r) => ({ ...r, start: e.target.value })); }}
                 className="border-2 rounded-lg px-2 py-1.5 text-sm font-mono bg-white text-[#1A1A1A] focus:outline-none transition-colors"
                 style={{ borderColor: '#E5E7EB' }}
                 onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                 onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          <span className="text-xs text-[#6B7280]">→</span>
          <input type="date" value={dateRange.end}
                 onChange={(e) => { setPreset(-1); setDateRange((r) => ({ ...r, end: e.target.value })); }}
                 className="border-2 rounded-lg px-2 py-1.5 text-sm font-mono bg-white text-[#1A1A1A] focus:outline-none transition-colors"
                 style={{ borderColor: '#E5E7EB' }}
                 onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                 onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
        </div>

        {/* Refresh */}
        <button onClick={() => load(dateRange)} disabled={loading}
                className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold border-2 hover:bg-[#F5F0E8] transition-colors"
                style={{ borderColor: '#1A1A1A', color: '#1A1A1A', background: '#fff', opacity: loading ? 0.6 : 1 }}>
          <RefreshCw size={13} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* API error */}
      {apiErr && (
        <div className="border-2 rounded-xl px-4 py-3 text-sm mb-5"
             style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}>
          {apiErr}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Receipt} label="Total Orders"
                  value={loading ? '—' : fmtNum(metrics?.total_orders ?? 0)}
                  sub="paid orders" loading={loading} />
        <StatCard icon={TrendingUp} label="Total Revenue"
                  value={loading ? '—' : fmt(metrics?.total_revenue ?? 0)}
                  sub="net of discounts" loading={loading} />
        <StatCard icon={ShoppingBag} label="Avg Order Value"
                  value={loading ? '—' : fmt(metrics?.average_order_value ?? 0)}
                  sub="per paid order" loading={loading} />
      </div>

      {/* ── Sales Trend ── */}
      <div className="mb-6">
        <Card title={`Sales Trend — ${dateRange.start} to ${dateRange.end}`}>
          <TrendChart rows={trend} loading={loading} />
        </Card>
      </div>

      {/* ── Top Products + Top Categories ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Top products */}
        <Card title="Top Products by Revenue">
          {loading
            ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} h="h-5" />)}</div>
            : topProds.length === 0
              ? <p className="text-sm text-[#6B7280] py-4 text-center">No sales data for this period</p>
              : (
                <div className="space-y-3">
                  {topProds.map((p) => (
                    <HBar key={p.product_name}
                          label={p.product_name}
                          value={parseFloat(p.revenue)}
                          maxValue={maxProdRev}
                          color="#F5C142"
                          sub={fmt(p.revenue)} />
                  ))}
                </div>
              )}
        </Card>

        {/* Top categories */}
        <Card title="Top Categories by Revenue">
          {loading
            ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skel key={i} h="h-5" />)}</div>
            : topCats.length === 0
              ? <p className="text-sm text-[#6B7280] py-4 text-center">No sales data for this period</p>
              : (
                <div className="space-y-3">
                  {topCats.map((c) => (
                    <HBar key={c.category_name}
                          label={c.category_name}
                          value={parseFloat(c.revenue)}
                          maxValue={maxCatRev}
                          color={c.category_color || '#F5C142'}
                          sub={fmt(c.revenue)} />
                  ))}
                </div>
              )}
        </Card>
      </div>

      {/* ── Top Orders table ── */}
      <Card title="Highest-Value Orders">
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#1A1A1A]" style={{ background: '#F5F0E8' }}>
                {['Order #', 'Type', 'Customer', 'Date', 'Total'].map((h, i) => (
                  <th key={h}
                      className={`text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A] ${i === 4 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E5E7EB]">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><Skel h="h-4" w={j === 4 ? 'w-16 ml-auto' : 'w-24'} /></td>
                    ))}
                  </tr>
                ))
                : topOrders.length === 0
                  ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[#6B7280]">
                      No paid orders in this period
                    </td></tr>
                  )
                  : topOrders.map((o) => (
                    <tr key={o.order_id} className="border-b border-[#E5E7EB] hover:bg-[#F5F0E8] transition-colors">
                      <td className="px-4 py-3 font-mono font-black text-[#1A1A1A]">#{o.order_id}</td>
                      <td className="px-4 py-3 text-[#6B7280] capitalize">{o.order_type?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{o.customer_name || '—'}</td>
                      <td className="px-4 py-3 text-[#6B7280] font-mono text-xs">
                        {new Date(o.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-[#1A1A1A]">{fmt(o.total)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
