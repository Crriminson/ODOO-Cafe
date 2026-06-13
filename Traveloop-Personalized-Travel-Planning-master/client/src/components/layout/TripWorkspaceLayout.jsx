import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getTripById } from '../../api/trips.api';
import {
  LayoutDashboard, CalendarDays, Compass, Map, Wallet,
  CheckSquare, BookOpen, ArrowLeft, Loader2, ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { name: 'Overview',  path: '',          icon: LayoutDashboard, end: true },
  { name: 'Plan',      path: '/plan',     icon: CalendarDays },
  { name: 'Discover',  path: '/discover', icon: Compass },
  { name: 'Map',       path: '/map',      icon: Map },
  { name: 'Budget',    path: '/budget',   icon: Wallet },
  { name: 'Packing',   path: '/packing',  icon: CheckSquare },
  { name: 'Notes',     path: '/notes',    icon: BookOpen },
];

const TripWorkspaceLayout = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTripById(id);
        setTrip(res.data?.trip || res.data);
      } catch { /* handled in child pages */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const tripName = trip?.name || 'Trip';

  return (
    <div className="flex h-[calc(100vh-68px)] overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>

      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 bg-white border-r-2 border-[#1A1A1A] flex flex-col justify-between
                    transition-all duration-200 ${collapsed ? 'w-[68px]' : 'w-[220px]'}`}
      >
        {/* Top section */}
        <div>
          {/* Trip name header */}
          <div className="px-4 pt-5 pb-3 border-b border-[#E5E7EB]">
            {!collapsed && (
              <>
                <Link
                  to="/"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#9CA3AF]
                             hover:text-[#1A1A1A] transition-colors mb-2"
                >
                  <ArrowLeft size={12} /> Dashboard
                </Link>
                <p className="text-sm font-black text-[#1A1A1A] truncate leading-tight">
                  {loading ? '…' : tripName}
                </p>
                {trip?.description && (
                  <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{trip.description}</p>
                )}
              </>
            )}
            {collapsed && (
              <Link to="/" className="flex justify-center">
                <ArrowLeft size={16} className="text-[#9CA3AF] hover:text-[#1A1A1A]" />
              </Link>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-0.5 px-2 py-3">
            {SIDEBAR_ITEMS.map(({ name, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={`/trips/${id}${path}`}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-150
                   ${isActive
                     ? 'bg-[#F5C142] text-[#1A1A1A] border-2 border-[#1A1A1A]'
                     : 'text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F0E8] border-2 border-transparent'
                   }
                   ${collapsed ? 'justify-center' : ''}`
                }
                style={({ isActive }) =>
                  isActive ? { boxShadow: '2px 2px 0px #1A1A1A' } : {}
                }
                title={collapsed ? name : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                {!collapsed && <span>{name}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-3">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs
                       font-bold text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F5F0E8]
                       transition-colors border-2 border-transparent"
          >
            {collapsed ? <ChevronRight size={14} /> : <><ChevronLeft size={14} /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet context={{ trip, setTrip, loading }} />
      </main>
    </div>
  );
};

export default TripWorkspaceLayout;
