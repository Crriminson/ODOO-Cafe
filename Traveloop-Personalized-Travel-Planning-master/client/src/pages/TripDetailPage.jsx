import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  MapPin, CalendarDays, Loader2, Edit3, 
  Trash2, Map, Wallet, Briefcase, FileText, X, Check, CheckCircle,
  Compass, CalendarDays as Plan,
} from 'lucide-react';
import { getTripById, updateTrip, deleteTrip } from '../api/trips.api';
import { getStops } from '../api/stops.api';

const TripDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trip, setTrip, loading: parentLoading } = useOutletContext();
  const [stops, setStops] = useState([]);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (trip) {
      reset({
        name: trip.name,
        description: trip.description || '',
        startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
        endDate: trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
        totalBudget: trip.totalBudget || '',
      });
    }
  }, [trip, reset]);

  // Load stops
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getStops(id);
        setStops(Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []));
      } catch { /* ignore */ }
    };
    if (id) load();
  }, [id]);

  const refreshTrip = async () => {
    try {
      const res = await getTripById(id);
      const t = res.data?.trip || res.data || res.trip;
      setTrip(t);
    } catch { /* ignore */ }
  };

  const onUpdate = async (data) => {
    try {
      const payload = {
        name: data.name,
        description: data.description,
        ...(data.startDate && { startDate: new Date(data.startDate).toISOString() }),
        ...(data.endDate && { endDate: new Date(data.endDate).toISOString() }),
        ...(data.totalBudget && { totalBudget: Number(data.totalBudget) }),
      };
      await updateTrip(id, payload);
      setIsEditing(false);
      refreshTrip();
    } catch {
      setError('Failed to update trip.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this trip? This cannot be undone.')) {
      try {
        await deleteTrip(id);
        navigate('/');
      } catch {
        setError('Failed to delete trip.');
      }
    }
  };

  const handleComplete = async () => {
    if (window.confirm('Mark this trip as completed?')) {
      try {
        await updateTrip(id, { status: 'COMPLETED' });
        refreshTrip();
      } catch {
        setError('Failed to update trip status.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (parentLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#F5C142]" size={40} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-[#1A1A1A] font-bold text-xl">Trip not found.</p>
        <Link to="/" className="mt-4 text-[#F5C142] underline">Go to Dashboard</Link>
      </div>
    );
  }

  const TOOLS = [
    { name: 'Plan Itinerary',  path: 'plan',     icon: Plan,     color: 'bg-[#FEF3C7]', desc: 'Drag & drop day planner' },
    { name: 'Discover',        path: 'discover',  icon: Compass,  color: 'bg-[#DBEAFE]', desc: 'Find activities & attractions' },
    { name: 'Map',             path: 'map',       icon: Map,      color: 'bg-[#D1FAE5]', desc: 'Visualise your route' },
    { name: 'Budget',          path: 'budget',    icon: Wallet,   color: 'bg-[#FEE2E2]', desc: 'Track expenses & allocations' },
    { name: 'Packing List',    path: 'packing',   icon: Briefcase, color: 'bg-[#EDE9FE]', desc: "Don't forget essentials" },
    { name: 'Notes',           path: 'notes',     icon: FileText, color: 'bg-[#FFF7ED]', desc: 'Important details & ideas' },
  ];

  return (
    <div className="px-8 py-6 space-y-8">

      {error && (
        <div className="rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
          {error}
        </div>
      )}

      {/* Hero Section */}
      <div
        className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-8 relative overflow-hidden"
        style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
      >
        {!isEditing ? (
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase
                  ${trip.status === 'COMPLETED' ? 'bg-[#D1FAE5] text-[#065F46]' :
                    trip.status === 'PLANNING' ? 'bg-[#FEF3C7] text-[#92400E]' :
                    trip.status === 'ONGOING' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                    'bg-[#FEE2E2] text-[#991B1B]'}`}>
                  {trip.status}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] mb-3 leading-tight">
                {trip.name}
              </h1>
              <p className="text-[#6B7280] text-sm mb-6 max-w-2xl">
                {trip.description || "No description provided."}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-[#F5F0E8] px-4 py-2 rounded-xl border-2 border-[#E5E7EB]">
                  <CalendarDays size={14} className="text-[#1A1A1A]" />
                  <span className="text-xs font-bold text-[#1A1A1A]">
                    {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                  </span>
                </div>
                {stops.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#E8F5F0] px-4 py-2 rounded-xl border-2 border-[#E5E7EB]">
                    <MapPin size={14} className="text-[#1A1A1A]" />
                    <span className="text-xs font-bold text-[#1A1A1A]">{stops.length} Stops</span>
                  </div>
                )}
                {trip.totalBudget && (
                  <div className="flex items-center gap-2 bg-[#FEF3C7] px-4 py-2 rounded-xl border-2 border-[#E5E7EB]">
                    <Wallet size={14} className="text-[#1A1A1A]" />
                    <span className="text-xs font-bold text-[#1A1A1A]">₹{trip.totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0 shrink-0">
              {trip.status !== 'COMPLETED' && (
                <button 
                  onClick={handleComplete}
                  className="flex items-center gap-1.5 bg-[#D1FAE5] text-[#065F46] font-bold text-xs rounded-xl px-3 py-2 border-2 border-[#065F46] hover:bg-green-200 transition-colors"
                >
                  <CheckCircle size={14} /> Complete
                </button>
              )}
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 bg-white text-[#1A1A1A] font-bold text-xs rounded-xl px-3 py-2 border-2 border-[#1A1A1A] hover:bg-slate-50 transition-colors"
                style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
              >
                <Edit3 size={14} /> Edit
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-1.5 bg-red-50 text-[#EF4444] font-bold text-xs rounded-xl px-3 py-2 border-2 border-[#EF4444] hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onUpdate)} className="relative z-10 space-y-4 max-w-3xl">
            <h2 className="text-xl font-black text-[#1A1A1A] mb-4">Edit Trip Details</h2>
            
            <div>
              <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Name</label>
              <input
                type="text"
                className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-base font-bold text-[#1A1A1A] focus:outline-none"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && <p className="text-xs text-[#EF4444] mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Description</label>
              <textarea
                rows={3}
                className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] focus:outline-none resize-none"
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Start Date</label>
                <input type="date" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none"
                  {...register('startDate')} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">End Date</label>
                <input type="date" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none"
                  {...register('endDate')} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Budget (₹)</label>
                <input type="number" className="w-full bg-white border-2 border-[#1A1A1A] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none"
                  {...register('totalBudget')} />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-xl px-6 py-2.5 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors disabled:opacity-50"
                style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save
              </button>
              <button 
                type="button" onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-white text-[#1A1A1A] font-black text-sm rounded-xl px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-slate-50 transition-colors"
                style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
              >
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stops overview */}
      {stops.length > 0 && (
        <div>
          <h2 className="text-base font-black text-[#1A1A1A] mb-3">Trip Stops</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {stops.map((stop, idx) => (
              <div key={stop.id}
                className="flex-shrink-0 bg-white rounded-2xl border-2 border-[#1A1A1A] px-4 py-3 min-w-[160px]"
                style={{ boxShadow: '3px 3px 0px #1A1A1A' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-[#F5C142] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#1A1A1A]">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-black text-[#1A1A1A]">{stop.city?.name}</span>
                </div>
                <p className="text-[10px] text-[#6B7280]">{stop.city?.country}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool grid */}
      <div>
        <h2 className="text-base font-black text-[#1A1A1A] mb-4">Trip Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ name, path, icon: Icon, color, desc }) => (
            <Link
              key={path}
              to={`/trips/${id}/${path}`}
              className="bg-white rounded-2xl border-2 border-[#1A1A1A] p-5
                         hover:-translate-y-1 hover:bg-[#FFFBF0] group transition-all duration-200
                         flex items-start gap-4"
              style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
            >
              <div className={`w-10 h-10 ${color} border-2 border-[#1A1A1A] rounded-xl flex items-center
                              justify-center group-hover:scale-110 transition-transform`}>
                <Icon size={18} className="text-[#1A1A1A]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1A1A1A] mb-0.5">{name}</h3>
                <p className="text-xs text-[#6B7280]">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TripDetailPage;
