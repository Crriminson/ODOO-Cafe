import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, SlidersHorizontal, ListFilter, ArrowUpDown,
  Plus, MapPin, Clock, Star, ArrowRight, Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getTrips } from '../api/trips.api';
import { getTopDestinations } from '../api/search.api';

const STATUS_STYLES = {
  COMPLETED: 'bg-[#D1FAE5] text-[#065F46]',
  PLANNING:  'bg-[#FEF3C7] text-[#92400E]',
  ONGOING:   'bg-[#DBEAFE] text-[#1E40AF]',
  CANCELLED: 'bg-[#FEE2E2] text-[#991B1B]',
};

const getDuration = (start, end) => {
  if (!start || !end) return 'TBD';
  const diffTime = Math.abs(new Date(end) - new Date(start));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return `${diffDays} days`;
};

const GRADIENTS = [
  'from-orange-400 to-amber-500', 'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500', 'from-emerald-400 to-teal-500',
  'from-pink-400 to-rose-500'
];
const getGradient = (id) => GRADIENTS[(id.charCodeAt(0) || 0) % GRADIENTS.length];

/* ─── Destination Card (dynamic) ──────────────────────────────────────────── */

const DestinationCard = ({ city }) => (
  <Link
    to={`/trips/new?destination=${encodeURIComponent(city.name)}&lat=${city.latitude}&lng=${city.longitude}`}
    className="flex-shrink-0 w-[200px] rounded-2xl border-2 border-[#1A1A1A] overflow-hidden
               cursor-pointer hover:-translate-y-2 transition-transform duration-200 group"
    style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
  >
    <div className="h-[140px] relative overflow-hidden">
      <img
        src={city.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80'}
        alt={city.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      {/* Rating badge */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm
                      rounded-full px-2 py-0.5 border border-white/50">
        <Star size={10} className="text-[#F5C142] fill-[#F5C142]" />
        <span className="text-[10px] font-bold text-[#1A1A1A]">
          {city.popularityScore ? (city.popularityScore / 20).toFixed(1) : '4.5'}
        </span>
      </div>
    </div>
    <div className="bg-white px-3 py-3 group-hover:bg-[#F5F0E8] transition-colors">
      <p className="text-sm font-black text-[#1A1A1A] leading-tight group-hover:text-[#F5C142] transition-colors">
        {city.name}
      </p>
      <div className="flex items-center gap-1 mt-0.5">
        <MapPin size={11} className="text-[#6B7280]" />
        <span className="text-xs text-[#6B7280]">{city.country}</span>
      </div>
      {city.description && (
        <p className="text-[10px] text-[#9CA3AF] mt-1.5 line-clamp-2 leading-relaxed">{city.description}</p>
      )}
    </div>
  </Link>
);

/* ─── Trip Card ────────────────────────────────────────────────────────────── */

const TripCard = ({ trip }) => (
  <Link
    to={`/trips/${trip.id}`}
    className="group rounded-2xl border-2 border-[#1A1A1A] overflow-hidden
               hover:-translate-y-1 transition-transform duration-150 block bg-white"
    style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
  >
    <div className={`h-[120px] bg-gradient-to-br ${getGradient(trip.id)} flex items-center justify-center`}>
      <span className="text-5xl">✈️</span>
    </div>
    <div className="bg-white p-5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-base font-black text-[#1A1A1A] leading-snug">{trip.name}</p>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[trip.status]}`}>
          {trip.status}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-4">
        <MapPin size={12} className="text-[#9CA3AF] flex-shrink-0" />
        <span className="text-xs text-[#6B7280] truncate">
          {trip.stops && trip.stops.length > 0 
            ? trip.stops.map(s => s.locationName || 'Unknown').join(' → ') 
            : 'Various Destinations'}
        </span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-[#F5F0E8]">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-[#9CA3AF]" />
          <span className="text-xs text-[#6B7280]">{getDuration(trip.startDate, trip.endDate)}</span>
        </div>
        <div className="flex items-center gap-1 text-[#9CA3AF] group-hover:text-[#F5C142]
                        transition-colors duration-150">
          <span className="text-xs font-bold">View</span>
          <ArrowRight size={12} />
        </div>
      </div>
    </div>
  </Link>
);

/* ─── Dashboard Page ───────────────────────────────────────────────────────── */

const DashboardPage = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [destsLoading, setDestsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await getTrips();
        setTrips(res.data?.trips || res.trips || []);
      } catch (error) {
        console.error("Failed to fetch trips", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Fetch top destinations from backend
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await getTopDestinations();
        setDestinations(res.data?.cities || []);
      } catch {
        setDestinations([]);
      } finally {
        setDestsLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const firstName = user?.firstName || user?.name?.split(' ')[0] || 'Explorer';
  
  const ongoingTrips = trips.filter(t => t.status === 'ONGOING' || t.status === 'PLANNING');
  const previousTrips = trips.filter(t => t.status === 'COMPLETED' || t.status === 'CANCELLED');

  return (
    <div className="min-h-full px-8 md:px-14 py-6 space-y-8" style={{ backgroundColor: '#F5F0E8' }}>

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden rounded-3xl border-2 border-[#1A1A1A]"
        style={{ height: '300px', boxShadow: '6px 6px 0px #1A1A1A' }}
      >
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400&q=80"
          alt="Travel hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A]/75 via-[#1A1A1A]/40 to-transparent rounded-3xl" />

        <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-14">
          <p className="text-xs font-bold text-[#F5C142] uppercase tracking-widest mb-2">
            Welcome back, {firstName} 👋
          </p>
          <h1 className="text-4xl font-black text-white leading-tight max-w-md mb-2">
            Where are you<br />going next?
          </h1>
          <p className="text-sm text-white/65 max-w-xs">
            Plan your dream trip — itineraries, budgets, packing lists.
          </p>
        </div>

        <div className="absolute top-5 right-5">
          <span
            className="flex items-center gap-1.5 bg-[#F5C142] text-[#1A1A1A] text-xs font-black
                       px-4 py-2 rounded-full border-2 border-[#1A1A1A]"
            style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
          >
            ✦ Discover
          </span>
        </div>
      </div>

      {/* ── Search + Filter bar ──────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-3 bg-white border-2 border-[#1A1A1A]
                     rounded-full px-5 py-3 flex-1 min-w-[220px] max-w-[440px]"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
        >
          <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations, trips…"
            className="text-sm bg-transparent text-[#1A1A1A] placeholder-[#9CA3AF]
                       w-full focus:outline-none"
          />
        </div>

        {[
          { label: 'Group by', icon: SlidersHorizontal },
          { label: 'Filter',   icon: ListFilter },
          { label: 'Sort by',  icon: ArrowUpDown },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full
                       px-5 py-3 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8]
                       transition-colors duration-150"
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Top Regional Selections (Dynamic) ────────────────── */}
      <section>
        <div className="flex items-center gap-4 mb-5">
          <h2 className="text-lg font-black text-[#1A1A1A] whitespace-nowrap">
            Top Regional Selections
          </h2>
          <div className="flex-1 h-0.5 rounded-full bg-[#1A1A1A]/15" />
          <Link to="/search" className="flex items-center gap-1 text-sm font-bold text-[#6B7280]
                             hover:text-[#1A1A1A] transition-colors whitespace-nowrap">
            See all <ArrowRight size={13} />
          </Link>
        </div>

        {destsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[#F5C142]" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1
                          scrollbar-none [&::-webkit-scrollbar]:hidden">
            {destinations.map((city) => (
              <DestinationCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </section>

      {/* ── Ongoing Trips ─────────────────────────────────────── */}
      {ongoingTrips.length > 0 && (
        <section className="pb-8">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-lg font-black text-[#1A1A1A]">Upcoming & Ongoing Trips</h2>
            <div className="flex-1 h-0.5 rounded-full bg-[#1A1A1A]/15" />
            <Link
              to="/trips"
              className="flex items-center gap-1 text-sm font-bold text-[#6B7280]
                         hover:text-[#1A1A1A] transition-colors whitespace-nowrap"
            >
              All trips <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ongoingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {/* ── Previous Trips ────────────────────────────────────── */}
      {previousTrips.length > 0 && (
        <section className="pb-8">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="text-lg font-black text-[#1A1A1A]">Previous Trips</h2>
            <div className="flex-1 h-0.5 rounded-full bg-[#1A1A1A]/15" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {previousTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </section>
      )}

      {!loading && trips.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#F5C142] rounded-full flex items-center justify-center mb-6 border-4 border-[#1A1A1A]" style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-2xl font-black text-[#1A1A1A] mb-2">No trips yet!</h3>
          <p className="text-[#6B7280] font-bold max-w-sm mb-6">You haven't planned any trips. Use the button below to get started on your next adventure.</p>
        </div>
      )}

      {/* ── Plan a trip FAB ───────────────────────────────────── */}
      <Link
        to="/trips/new"
        className="fixed bottom-8 right-8 flex items-center gap-2
                   bg-[#F5C142] text-[#1A1A1A] font-black text-sm
                   rounded-full px-6 py-3.5 border-2 border-[#1A1A1A]
                   hover:bg-[#E0AE30] transition-colors duration-150 z-50"
        style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
      >
        <Plus size={16} strokeWidth={3} />
        Plan a trip
      </Link>
    </div>
  );
};

export default DashboardPage;
