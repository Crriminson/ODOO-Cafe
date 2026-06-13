import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Loader2, Plus, MapPin, CalendarDays, AlignLeft,
  Wallet, ArrowLeft, Sparkles, Search, Globe,
} from 'lucide-react';

import { createTrip } from '../api/trips.api';
import { searchEntities } from '../api/search.api';

/* Fix leaflet default marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:#F5C142; border:3px solid #1A1A1A; border-radius:50%;
    width:36px; height:36px; display:flex; align-items:center; justify-content:center;
    font-size:16px; box-shadow:3px 3px 0px #1A1A1A;
  ">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/* ─── Map click handler ───────────────────────────────────────────── */
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
      // Reverse geocode with Nominatim
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
        );
        const data = await res.json();
        const name = data.address?.city || data.address?.town || data.address?.village || data.address?.state || data.display_name?.split(',')[0] || '';
        const country = data.address?.country || '';
        if (name) {
          onLocationSelect(lat, lng, `${name}${country ? ', ' + country : ''}`);
        }
      } catch { /* ignore geocoding failure */ }
    },
  });
  return null;
};

/* ─── Fly map to coordinates ──────────────────────────────────────── */
const FlyTo = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 10, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

/* ─── Section heading ──────────────────────────────────────────────── */
const SectionHead = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F5C142] border-2 border-[#1A1A1A] flex-shrink-0"
      style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
      <Icon size={15} strokeWidth={2.5} className="text-[#1A1A1A]" />
    </div>
    <h2 className="text-base font-black text-[#1A1A1A]">{label}</h2>
    <div className="flex-1 h-0.5 rounded-full bg-[#1A1A1A]/15" />
  </div>
);

/* ─── Create Trip Page ──────────────────────────────────────────────── */
const CreateTripPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [markerPos, setMarkerPos] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      totalBudget: '',
    },
  });

  // Handle query params from dashboard destination cards
  useEffect(() => {
    const dest = searchParams.get('destination');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (dest) {
      setLocationName(dest);
      setValue('name', `Trip to ${dest}`);
      setValue('description', dest);
    }
    if (lat && lng) {
      const latN = parseFloat(lat);
      const lngN = parseFloat(lng);
      setMapCenter([latN, lngN]);
      setMarkerPos([latN, lngN]);
    }
  }, [searchParams, setValue]);

  // City search
  const handleCitySearch = useCallback(async () => {
    if (!citySearchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await searchEntities(citySearchQuery, 'city');
      setCityResults(res.data?.cities || []);
    } catch { setCityResults([]); }
    finally { setSearching(false); }
  }, [citySearchQuery]);

  const handleSelectCity = (city) => {
    setLocationName(`${city.name}, ${city.country}`);
    setMarkerPos([city.latitude, city.longitude]);
    setMapCenter([city.latitude, city.longitude]);
    setValue('description', `${city.name}, ${city.country}`);
    if (!register('name').value) {
      setValue('name', `Trip to ${city.name}`);
    }
    setCityResults([]);
    setCitySearchQuery('');
  };

  const handleMapLocationSelect = (lat, lng, name) => {
    setMarkerPos([lat, lng]);
    if (name) {
      setLocationName(name);
      setValue('description', name);
    }
  };

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      const payload = {
        name: data.name,
        ...(data.description && { description: data.description }),
        ...(data.startDate && { startDate: new Date(data.startDate).toISOString() }),
        ...(data.endDate && { endDate: new Date(data.endDate).toISOString() }),
        ...(data.totalBudget && { totalBudget: Number(data.totalBudget) }),
      };
      const envelope = await createTrip(payload);
      const tripId = envelope.data?.id || envelope.data?.trip?.id;
      navigate(tripId ? `/trips/${tripId}` : '/trips');
    } catch (err) {
      const msg = err.response?.data?.message;
      setApiError(msg || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-full px-8 md:px-14 py-8" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#6B7280] hover:text-[#1A1A1A] transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-[2rem] font-black text-[#1A1A1A] leading-tight">Plan a new trip</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Search or click the map to pick your destination, then fill in the details.
        </p>
      </div>

      {apiError && (
        <div className="mb-6 rounded-2xl border-2 border-[#EF4444] bg-red-50 px-4 py-3 text-sm font-medium text-[#EF4444]">
          {apiError}
        </div>
      )}

      <div className="flex gap-8 flex-col lg:flex-row">

        {/* Left — Map */}
        <div className="flex-1 min-w-0">
          <SectionHead icon={Globe} label="Pick Your Destination" />

          {/* City search bar */}
          <div className="relative mb-4">
            <div className="flex items-center gap-2 bg-white border-2 border-[#1A1A1A] rounded-full px-4 py-2.5"
              style={{ boxShadow: '3px 3px 0px #1A1A1A' }}>
              <Search size={15} className="text-[#9CA3AF] flex-shrink-0" />
              <input
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCitySearch()}
                placeholder="Search cities… (e.g. Manali, Tokyo, Paris)"
                className="text-sm bg-transparent text-[#1A1A1A] placeholder-[#9CA3AF] w-full focus:outline-none"
              />
              {searching && <Loader2 size={14} className="animate-spin text-[#F5C142]" />}
            </div>

            {/* Search results dropdown */}
            {cityResults.length > 0 && (
              <div className="absolute z-[1000] top-full mt-2 left-0 right-0 bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
                style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
                {cityResults.map(city => (
                  <button
                    key={city.id}
                    onClick={() => handleSelectCity(city)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] transition-colors text-left border-b border-[#F5F0E8] last:border-none"
                  >
                    <MapPin size={14} className="text-[#F5C142] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]">{city.name}</p>
                      <p className="text-[10px] text-[#6B7280]">{city.country} · {city.region}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected location badge */}
          {locationName && (
            <div className="mb-3 flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-[#F5C142] text-[#1A1A1A] text-xs font-black px-3 py-1.5 rounded-full border-2 border-[#1A1A1A]"
                style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
                <MapPin size={11} /> {locationName}
              </span>
            </div>
          )}

          {/* Leaflet Map */}
          <div className="rounded-2xl border-2 border-[#1A1A1A] overflow-hidden" style={{ boxShadow: '4px 4px 0px #1A1A1A', height: '400px' }}>
            <MapContainer
              center={mapCenter}
              zoom={5}
              className="w-full h-full"
              style={{ zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleMapLocationSelect} />
              <FlyTo center={mapCenter} zoom={10} />
              {markerPos && <Marker position={markerPos} icon={pinIcon} />}
            </MapContainer>
          </div>

          <p className="text-[10px] text-[#9CA3AF] mt-2 text-center">
            Click anywhere on the map to pick a destination, or use the search bar above.
          </p>
        </div>

        {/* Right — Form */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Trip Name */}
            <div className="bg-white rounded-2xl border-2 border-[#1A1A1A] p-5 space-y-4"
              style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
              <SectionHead icon={Sparkles} label="Trip Details" />
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Trip Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Adventure 2026"
                  className="w-full mt-1 border-2 border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                  {...register('name', { required: 'Trip name is required' })}
                />
                {errors.name && <p className="text-xs text-[#EF4444] mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Destination</label>
                <input
                  type="text"
                  placeholder="Auto-filled from map / search"
                  className="w-full mt-1 border-2 border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none bg-[#F9FAFB]"
                  {...register('description')}
                  readOnly
                />
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-2xl border-2 border-[#1A1A1A] p-5 space-y-4"
              style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
              <SectionHead icon={CalendarDays} label="Travel Dates" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Start</label>
                  <input type="date" className="w-full mt-1 border-2 border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                    {...register('startDate')} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">End</label>
                  <input type="date" className="w-full mt-1 border-2 border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                    {...register('endDate')} />
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-white rounded-2xl border-2 border-[#1A1A1A] p-5 space-y-4"
              style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
              <SectionHead icon={Wallet} label="Budget" />
              <div>
                <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Total Budget (₹)</label>
                <input type="number" placeholder="e.g. 50000" className="w-full mt-1 border-2 border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                  {...register('totalBudget')} />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#F5C142] text-[#1A1A1A]
                         font-black text-sm rounded-xl px-6 py-3.5 border-2 border-[#1A1A1A]
                         hover:bg-[#E0AE30] transition-colors disabled:opacity-50"
              style={{ boxShadow: '4px 4px 0px #1A1A1A' }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} strokeWidth={3} />}
              Create Trip
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTripPage;
