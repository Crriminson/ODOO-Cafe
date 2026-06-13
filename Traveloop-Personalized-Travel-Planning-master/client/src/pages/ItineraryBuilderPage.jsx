import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CalendarDays,
  Loader2,
  MapPin,
  Search,
  Check
} from 'lucide-react';
import { getTripById } from '../api/trips.api';
import { getStops, createStop, updateStop, deleteStop } from '../api/stops.api';
import { searchEntities } from '../api/search.api';

const CitySearchInput = ({ value, onChange, placeholder, error }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState(value);

  useEffect(() => {
    if (selectedCity && !query) {
      setQuery(selectedCity.name);
    }
  }, [selectedCity]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await searchEntities(query, 'city');
        setResults(res.data?.cities || res.cities || []);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            if (selectedCity) {
               setSelectedCity(null);
               onChange(null);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          className={`border-2 rounded-2xl pl-9 pr-4 py-2.5 text-sm w-full bg-white text-[#1A1A1A]
                     placeholder-[#9CA3AF] focus:outline-none transition-colors duration-150
                     ${error ? 'border-[#EF4444]' : 'border-[#E5E7EB] focus:border-[#1A1A1A]'}`}
        />
        {loading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#9CA3AF]" />}
      </div>
      
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-[#1A1A1A] rounded-xl overflow-hidden shadow-lg max-h-60 overflow-y-auto">
          {results.map(city => (
            <div
              key={city.id}
              onClick={() => {
                setSelectedCity(city);
                setQuery(city.name);
                setShowDropdown(false);
                onChange(city.id);
              }}
              className="px-4 py-2 hover:bg-[#F5F0E8] cursor-pointer flex flex-col border-b border-gray-100 last:border-0"
            >
              <span className="font-bold text-[#1A1A1A] text-sm">{city.name}</span>
              <span className="text-xs text-[#6B7280]">{city.country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ItineraryBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // For the new stop form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStop, setNewStop] = useState({ cityId: null, startDate: '', endDate: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const tripRes = await getTripById(id);
      setTrip(tripRes.data?.trip || tripRes.data || tripRes.trip);

      const stopsRes = await getStops(id);
      setStops(stopsRes.data?.stops || stopsRes.data || stopsRes.stops || []);
    } catch (err) {
      setApiError('Failed to load trip or stops.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleAddStop = async () => {
    if (!newStop.cityId) {
      setApiError("Please select a city.");
      return;
    }
    setIsSubmitting(true);
    setApiError(null);
    try {
      await createStop(id, {
        cityId: newStop.cityId,
        ...(newStop.startDate && { startDate: new Date(newStop.startDate).toISOString() }),
        ...(newStop.endDate && { endDate: new Date(newStop.endDate).toISOString() }),
        notes: newStop.notes || undefined
      });
      setNewStop({ cityId: null, startDate: '', endDate: '', notes: '' });
      setShowAddForm(false);
      fetchData();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to add stop.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStop = async (stopId) => {
    if(window.confirm("Delete this stop?")) {
      try {
        await deleteStop(id, stopId);
        fetchData();
      } catch (err) {
        setApiError('Failed to delete stop.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F0E8' }}>
        <Loader2 className="animate-spin text-[#F5C142]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Back link */}
      <Link
        to={`/trips/${id}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-[#6B7280]
                   hover:text-[#1A1A1A] transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to Trip
      </Link>

      {/* Page heading */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-[2rem] font-black text-[#1A1A1A] leading-tight">
            {trip ? `Build Itinerary: ${trip.name}` : 'Build Itinerary'}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
            Organize your trip by adding stops and cities.
            </p>
        </div>
        <Link 
            to={`/trips/${id}/view`} 
            className="flex items-center gap-2 bg-white text-[#1A1A1A] font-black text-sm rounded-xl px-4 py-2 border-2 border-[#1A1A1A] hover:bg-slate-50 transition-colors"
            style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
        >
            View Full Itinerary
        </Link>
      </div>

      {apiError && (
        <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm
                       font-medium text-[#EF4444]">
          {apiError}
        </div>
      )}

      <div className="max-w-4xl space-y-6">
        {stops.map((stop, index) => (
          <div
            key={stop.id}
            className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 relative flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
            style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
          >
            <div>
               <h3 className="text-xl font-black text-[#1A1A1A] flex items-center gap-2">
                 <MapPin size={18} className="text-[#F5C142]" /> 
                 {stop.city?.name || 'Unknown City'} <span className="text-sm text-[#6B7280] font-normal">({stop.city?.country})</span>
               </h3>
               {(stop.startDate || stop.endDate) && (
                 <p className="text-sm font-bold text-[#1A1A1A] mt-2 flex items-center gap-2">
                   <CalendarDays size={14} className="text-[#6B7280]"/>
                   {stop.startDate ? new Date(stop.startDate).toLocaleDateString() : 'TBD'} - {stop.endDate ? new Date(stop.endDate).toLocaleDateString() : 'TBD'}
                 </p>
               )}
               {stop.notes && (
                 <p className="text-sm text-[#6B7280] mt-2">{stop.notes}</p>
               )}
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeleteStop(stop.id)}
                  className="text-[#EF4444] hover:bg-red-50 p-2 rounded-xl border-2 border-transparent hover:border-[#EF4444] transition-colors"
                  title="Remove Section"
                >
                  <Trash2 size={18} />
                </button>
            </div>
          </div>
        ))}

        {/* Add New Stop Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-[#F5F0E8] rounded-3xl border-2 border-dashed border-[#1A1A1A] p-6 hover:bg-[#E8E3DB] transition-colors flex flex-col items-center justify-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-white border-2 border-[#1A1A1A] flex items-center justify-center">
              <Plus size={24} className="text-[#1A1A1A]" />
            </div>
            <span className="font-black text-[#1A1A1A] text-lg">Add Custom Stop</span>
          </button>
        ) : (
          <div className="bg-[#F5F0E8] rounded-3xl border-2 border-dashed border-[#1A1A1A] p-6 relative">
            <h3 className="text-lg font-black text-[#1A1A1A] mb-4">Add a new stop</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 z-50 relative">
                <label className="text-xs font-bold text-[#1A1A1A]">Search City</label>
                <CitySearchInput 
                  placeholder="Search for a city..." 
                  onChange={(cityId) => setNewStop({ ...newStop, cityId })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#1A1A1A]">Notes (Optional)</label>
                <textarea
                  placeholder="Where are you staying? Any transportation info?"
                  rows={2}
                  value={newStop.notes}
                  onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })}
                  className="border-2 border-[#E5E7EB] focus:border-[#1A1A1A] rounded-2xl px-4 py-2.5 text-sm w-full bg-white text-[#1A1A1A]
                             placeholder-[#9CA3AF] focus:outline-none transition-colors duration-150 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Arrival Date</label>
                  <div className="relative">
                    <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="date"
                      value={newStop.startDate}
                      onChange={(e) => setNewStop({ ...newStop, startDate: e.target.value })}
                      className="border-2 border-[#E5E7EB] focus:border-[#1A1A1A] rounded-2xl pl-9 pr-3 py-2.5 text-sm w-full bg-white text-[#1A1A1A]
                                 focus:outline-none transition-colors duration-150"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1A1A1A]">Departure Date</label>
                  <div className="relative">
                    <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="date"
                      value={newStop.endDate}
                      onChange={(e) => setNewStop({ ...newStop, endDate: e.target.value })}
                      className="border-2 border-[#E5E7EB] focus:border-[#1A1A1A] rounded-2xl pl-9 pr-3 py-2.5 text-sm w-full bg-white text-[#1A1A1A]
                                 focus:outline-none transition-colors duration-150"
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleAddStop}
                disabled={isSubmitting || !newStop.cityId}
                className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A]
                        text-white font-black text-sm rounded-2xl px-4 py-3
                        border-2 border-[#1A1A1A] hover:bg-gray-800
                        transition-colors duration-150 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />}
                Add Stop
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-full flex items-center justify-center gap-2 bg-white
                        text-[#1A1A1A] font-black text-sm rounded-2xl px-4 py-3
                        border-2 border-[#1A1A1A] hover:bg-slate-50
                        transition-colors duration-150 mt-3"
              >
                Cancel
              </button>
            </div>
        </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            onClick={() => navigate(`/trips/${id}`)}
            className="flex items-center justify-center gap-2 bg-[#F5C142]
                       text-[#1A1A1A] font-black text-sm rounded-full px-8 py-3.5
                       border-2 border-[#1A1A1A] hover:bg-[#E0AE30]
                       transition-colors duration-150"
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            <Check size={16} /> Finish
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryBuilderPage;
