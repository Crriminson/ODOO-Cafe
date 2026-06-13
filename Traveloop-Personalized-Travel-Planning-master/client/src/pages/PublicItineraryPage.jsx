import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, CalendarDays, Clock, DollarSign, ArrowDown,
  Copy, Share2, MessageCircle, MessageSquare, Link2, Check,
  Loader2, Globe, ChevronRight, Wallet, Users, AlertCircle,
} from 'lucide-react';
import { getPublicTrip, cloneTrip } from '../api/trips.api';
import { useAuthStore } from '../store/authStore';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD';

const tripDays = (start, end) => {
  if (!start || !end) return null;
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(diff));
};

const totalCost = (stops = []) =>
  stops.reduce(
    (sum, stop) =>
      sum + (stop.activities || []).reduce((s, a) => s + (a.cost || 0), 0),
    0
  );

const categoryEmoji = {
  SIGHTSEEING: '🏛️',
  FOOD: '🍜',
  ADVENTURE: '🧗',
  CULTURAL: '🎭',
  RELAXATION: '🛁',
  SHOPPING: '🛍️',
  TRANSPORT: '🚌',
  ACCOMMODATION: '🏨',
  OTHER: '📌',
};

/* ─── sub-components ───────────────────────────────────────── */

const StatPill = ({ icon: Icon, label, value, bg = 'bg-[#F5F0E8]' }) => (
  <div className={`flex items-center gap-2 ${bg} px-4 py-2 rounded-xl border-2 border-[#E5E7EB]`}>
    <Icon size={14} className="text-[#1A1A1A]" />
    <span className="text-xs font-bold text-[#1A1A1A]">{label && <span className="text-[#6B7280] mr-1">{label}</span>}{value}</span>
  </div>
);

const ActivityCard = ({ act, isLast }) => {
  const name = act.customName || act.activity?.name || 'Activity';
  const cat = act.activity?.category || 'OTHER';

  return (
    <>
      <div
        className="flex w-full gap-4 group"
      >
        {/* Activity block */}
        <div
          className="flex-1 bg-white border-2 border-[#1A1A1A] rounded-3xl p-5
                     hover:-translate-y-1 transition-transform duration-200 cursor-default"
          style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl" title={cat}>{categoryEmoji[cat] || '📌'}</span>
              <h3 className="text-base font-black text-[#1A1A1A]">{name}</h3>
            </div>
            {(act.startTime || act.endTime) && (
              <div className="flex items-center gap-1 text-xs font-bold text-[#6B7280] bg-[#F5F0E8] px-2 py-1 rounded-lg shrink-0">
                <Clock size={11} />
                {act.startTime}{act.endTime ? ` – ${act.endTime}` : ''}
              </div>
            )}
          </div>
          {act.notes && (
            <p className="text-sm text-[#6B7280]">{act.notes}</p>
          )}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5
                             bg-[#F5F0E8] border border-[#E5E7EB] rounded-md text-[#6B7280]">
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </span>
            {act.dayOffset > 0 && (
              <span className="text-[10px] font-bold text-[#9CA3AF]">Day +{act.dayOffset}</span>
            )}
          </div>
        </div>

        {/* Cost block */}
        <div
          className="w-36 shrink-0 bg-white border-2 border-[#1A1A1A] rounded-3xl p-4
                     flex flex-col justify-center items-center hover:-translate-y-1
                     transition-transform duration-200"
          style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        >
          <div className="w-9 h-9 rounded-full bg-[#E8F5F0] flex items-center justify-center mb-1.5">
            <DollarSign size={18} className="text-[#10B981]" />
          </div>
          <span className="text-xl font-black text-[#1A1A1A]">₹{(act.cost || 0).toLocaleString('en-IN')}</span>
          <span className="text-[10px] font-bold text-[#6B7280] mt-0.5">per person</span>
        </div>
      </div>

      {!isLast && (
        <div className="flex w-full">
          <div className="flex-1 flex justify-center py-2">
            <ArrowDown size={20} className="text-[#9CA3AF]" />
          </div>
          <div className="w-36 shrink-0" />
        </div>
      )}
    </>
  );
};

const StopSection = ({ stop, index }) => {
  const [open, setOpen] = useState(true);
  const activities = stop.activities || [];
  const stopCost = activities.reduce((s, a) => s + (a.cost || 0), 0);

  return (
    <div className="mb-10">
      {/* City header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 w-full text-left mb-5 group"
      >
        <div
          className="w-12 h-12 bg-[#F5C142] border-2 border-[#1A1A1A] rounded-2xl
                     flex items-center justify-center font-black text-lg text-[#1A1A1A] shrink-0"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
        >
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#1A1A1A]">{stop.city?.name}</h2>
            <MapPin size={16} className="text-[#F5C142]" />
            <span className="text-sm font-bold text-[#6B7280]">{stop.city?.country}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs font-bold text-[#9CA3AF]">
              {fmt(stop.startDate)} — {fmt(stop.endDate)}
            </span>
            <span className="text-xs font-black text-[#10B981]">
              ₹{stopCost.toLocaleString('en-IN')} est.
            </span>
          </div>
        </div>
        <ChevronRight
          size={20}
          className={`text-[#9CA3AF] transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Activities */}
      {open && (
        <div className="pl-4 border-l-4 border-[#F5C142] ml-6">
          {activities.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-[#D1D5DB] rounded-3xl p-6 text-center">
              <p className="text-sm font-bold text-[#9CA3AF]">No activities planned for this stop yet.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Column headers */}
              <div className="flex w-full gap-4 mb-4 px-1">
                <div className="flex-1 text-xs font-black uppercase tracking-widest text-[#9CA3AF]">Activity</div>
                <div className="w-36 shrink-0 text-xs font-black uppercase tracking-widest text-[#9CA3AF] text-center">Cost</div>
              </div>
              {activities.map((act, i) => (
                <ActivityCard key={act.id} act={act} isLast={i === activities.length - 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── share modal ──────────────────────────────────────────── */
const ShareModal = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socials = [
    {
      label: 'Twitter',
      icon: MessageCircle,
      color: 'bg-[#1DA1F2]',
      href: `https://twitter.com/intent/tweet?text=Check+out+my+trip+itinerary!&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'Facebook',
      icon: MessageSquare,
      color: 'bg-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'WhatsApp',
      icon: Share2,
      color: 'bg-[#25D366]',
      href: `https://wa.me/?text=${encodeURIComponent('Check out my trip! ' + url)}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white border-2 border-[#1A1A1A] rounded-[32px] p-8 w-full max-w-md"
        style={{ boxShadow: '8px 8px 0px #1A1A1A' }}
      >
        <h3 className="text-xl font-black text-[#1A1A1A] mb-1">Share this Itinerary</h3>
        <p className="text-sm text-[#6B7280] mb-6">Anyone with the link can view this trip.</p>

        {/* URL copy row */}
        <div className="flex gap-2 mb-6">
          <div
            className="flex-1 bg-[#F5F0E8] border-2 border-[#1A1A1A] rounded-xl px-4 py-3
                       text-sm font-mono text-[#6B7280] truncate"
          >
            {url}
          </div>
          <button
            onClick={copyLink}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-[#1A1A1A]
                        font-bold text-sm transition-colors ${copied ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#F5C142] text-[#1A1A1A] hover:bg-[#E0AE30]'}`}
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            {copied ? <Check size={16} /> : <Link2 size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Social buttons */}
        <div className="flex gap-3 mb-6">
          {socials.map(({ label, icon: Icon, color, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 ${color} text-white font-bold text-xs rounded-xl px-3 py-3
                          border-2 border-[#1A1A1A] flex flex-col items-center gap-1
                          hover:opacity-90 transition-opacity`}
              style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
            >
              <Icon size={18} />
              {label}
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl border-2 border-[#1A1A1A] font-bold text-sm
                     bg-white text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── main page ────────────────────────────────────────────── */
const PublicItineraryPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [cloneError, setCloneError] = useState(null);

  const publicUrl = window.location.href;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getPublicTrip(token);
        const t = res.data?.trip || res.data || res;
        setTrip(t);
      } catch (err) {
        setError(err.response?.data?.message || 'This itinerary is not available or no longer public.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleCopy = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      setCloning(true);
      setCloneError(null);
      const res = await cloneTrip(trip.id);
      const newId = res.data?.id || res.data?.trip?.id;
      setCloned(true);
      setTimeout(() => {
        if (newId) navigate(`/trips/${newId}`);
      }, 1200);
    } catch (err) {
      setCloneError(err.response?.data?.message || 'Failed to copy trip. Please try again.');
    } finally {
      setCloning(false);
    }
  };

  /* ── loading ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 size={48} className="animate-spin text-[#1A1A1A]" />
        <p className="text-sm font-bold text-[#6B7280]">Loading itinerary…</p>
      </div>
    );
  }

  /* ── error / not found ── */
  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center" style={{ backgroundColor: '#F5F0E8' }}>
        <div
          className="w-20 h-20 bg-white border-2 border-[#1A1A1A] rounded-full
                     flex items-center justify-center"
          style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        >
          <AlertCircle size={36} className="text-[#EF4444]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A] mb-2">Itinerary Not Found</h1>
          <p className="text-sm text-[#6B7280] max-w-md">
            {error || 'This itinerary might have been made private or the link may have expired.'}
          </p>
        </div>
        <Link
          to="/"
          className="bg-[#F5C142] text-[#1A1A1A] font-black px-6 py-3 rounded-xl
                     border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors"
          style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
        >
          Go to Traveloop
        </Link>
      </div>
    );
  }

  const stops = trip.stops || [];
  const days = tripDays(trip.startDate, trip.endDate);
  const estCost = totalCost(stops);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b-2 border-[#1A1A1A] px-6 md:px-12 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Globe size={20} className="text-[#F5C142]" />
          <span className="font-black text-lg text-[#1A1A1A]">Traveloop</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full
                       px-5 py-2.5 text-sm font-bold text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            <Share2 size={15} /> Share
          </button>

          <button
            onClick={handleCopy}
            disabled={cloning || cloned}
            className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-full
                        px-5 py-2.5 text-sm font-black transition-all duration-200
                        disabled:opacity-70 disabled:cursor-not-allowed
                        ${cloned ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#F5C142] text-[#1A1A1A] hover:bg-[#E0AE30]'}`}
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            {cloning
              ? <><Loader2 size={15} className="animate-spin" /> Copying…</>
              : cloned
              ? <><Check size={15} /> Copied!</>
              : <><Copy size={15} /> Copy Trip</>
            }
          </button>

          {!user && (
            <Link
              to="/login"
              className="flex items-center gap-1.5 bg-[#1A1A1A] text-white font-bold text-sm
                         rounded-full px-5 py-2.5 hover:bg-[#333] transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="px-6 md:px-12 lg:px-24 pt-10 pb-6 max-w-5xl mx-auto">
        <div
          className="bg-white border-2 border-[#1A1A1A] rounded-[32px] p-8 md:p-10 relative overflow-hidden"
          style={{ boxShadow: '8px 8px 0px #1A1A1A' }}
        >
          {/* Decorative blob */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F5C142] rounded-full opacity-20 pointer-events-none" />

          {/* Creator badge */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-[#F5C142] border-2 border-[#1A1A1A] rounded-full flex items-center justify-center">
              <Users size={14} className="text-[#1A1A1A]" />
            </div>
            <span className="text-sm font-bold text-[#6B7280]">
              Curated by <span className="text-[#1A1A1A]">{trip.creator?.name || 'a Traveloop traveller'}</span>
            </span>
            <span className="ml-auto text-[10px] font-black uppercase tracking-widest px-3 py-1
                             bg-[#D1FAE5] text-[#065F46] rounded-full border border-[#065F46]">
              Public Itinerary
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-4 leading-tight">
            {trip.name}
          </h1>

          {trip.description && (
            <p className="text-[#6B7280] text-base mb-7 max-w-2xl leading-relaxed">
              {trip.description}
            </p>
          )}

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3">
            <StatPill icon={CalendarDays} value={`${fmt(trip.startDate)} — ${fmt(trip.endDate)}`} />
            {days && <StatPill icon={Clock} label="" value={`${days} days`} bg="bg-[#FEF3C7]" />}
            {stops.length > 0 && <StatPill icon={MapPin} label="" value={`${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}`} bg="bg-[#E8F5F0]" />}
            {estCost > 0 && <StatPill icon={Wallet} label="~" value={`₹${estCost.toLocaleString('en-IN')}`} bg="bg-[#EDE9FE]" />}
          </div>

          {cloneError && (
            <div className="mt-5 rounded-xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
              {cloneError}
            </div>
          )}
        </div>

        {/* ── Route overview pills ── */}
        {stops.length > 0 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {stops.map((stop, idx) => (
              <React.Fragment key={stop.id}>
                <div
                  className="shrink-0 flex items-center gap-2 bg-white border-2 border-[#1A1A1A]
                             rounded-full px-4 py-2"
                  style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
                >
                  <span className="w-5 h-5 bg-[#F5C142] border border-[#1A1A1A] rounded-full
                                   text-[10px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-[#1A1A1A]">{stop.city?.name}</span>
                </div>
                {idx < stops.length - 1 && (
                  <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* ── Itinerary timeline ── */}
      <div className="px-6 md:px-12 lg:px-24 pb-16 max-w-5xl mx-auto">

        {/* Section label */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black text-[#1A1A1A]">Day-by-Day Itinerary</h2>
          <div className="flex-1 h-0.5 bg-[#E5E7EB]" />
          <span className="text-sm font-bold text-[#6B7280]">{stops.length} {stops.length === 1 ? 'stop' : 'stops'}</span>
        </div>

        {stops.length === 0 ? (
          <div
            className="bg-white border-2 border-dashed border-[#D1D5DB] rounded-[32px]
                       p-16 text-center"
          >
            <MapPin size={40} className="text-[#D1D5DB] mx-auto mb-4" />
            <p className="text-sm font-bold text-[#9CA3AF]">No stops have been added to this itinerary yet.</p>
          </div>
        ) : (
          stops.map((stop, idx) => (
            <StopSection key={stop.id} stop={stop} index={idx} />
          ))
        )}

        {/* ── Bottom CTA ── */}
        <div
          className="mt-10 bg-[#1A1A1A] rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row
                     items-center justify-between gap-6"
          style={{ boxShadow: '8px 8px 0px #F5C142' }}
        >
          <div>
            <h3 className="text-2xl font-black text-white mb-1">Love this trip?</h3>
            <p className="text-sm text-[#9CA3AF]">
              Copy it to your account and make it your own — fully editable.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 bg-white/10 text-white border-2 border-white/30
                         rounded-xl px-5 py-3 font-bold text-sm hover:bg-white/20 transition-colors"
            >
              <Share2 size={16} /> Share
            </button>
            <button
              onClick={handleCopy}
              disabled={cloning || cloned}
              className={`flex items-center gap-2 border-2 border-[#1A1A1A] rounded-xl px-6 py-3
                          font-black text-sm transition-all duration-200 disabled:opacity-70
                          ${cloned ? 'bg-[#D1FAE5] text-[#065F46] border-[#065F46]' : 'bg-[#F5C142] text-[#1A1A1A] hover:bg-[#E0AE30]'}`}
              style={{ boxShadow: '3px 3px 0px #F5C142' }}
            >
              {cloning ? <><Loader2 size={16} className="animate-spin" /> Copying…</>
                : cloned ? <><Check size={16} /> Copied!</>
                : <><Copy size={16} /> Copy Trip</>}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#9CA3AF] mt-8 font-medium">
          Powered by{' '}
          <Link to="/" className="font-black text-[#1A1A1A] underline underline-offset-2">
            Traveloop
          </Link>{' '}
          · Plan smarter, travel better.
        </p>
      </div>

      {/* ── Share Modal ── */}
      {showShare && <ShareModal url={publicUrl} onClose={() => setShowShare(false)} />}
    </div>
  );
};

export default PublicItineraryPage;
