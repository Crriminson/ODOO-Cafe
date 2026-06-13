import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon, MapPin, Clock, IndianRupee, Loader2, ExternalLink,
} from 'lucide-react';
import { getStops } from '../api/stops.api';
import axiosInstance from '../api/axiosInstance';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createNumberedIcon = (num, color = '#F5C142') => {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color}; border:2px solid #1A1A1A; border-radius:50%;
      width:30px; height:30px; display:flex; align-items:center; justify-content:center;
      font-weight:900; font-size:12px; color:#1A1A1A; box-shadow:2px 2px 0px #1A1A1A;
    ">${num}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

/* Auto-fit map to markers — includes both stop positions and activity pins */
const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [positions, map]);
  return null;
};

/* ─── Trip Map Page ────────────────────────────────────────────────────────── */

const TripMapPage = () => {
  const { id } = useParams();
  const { trip } = useOutletContext();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState(null);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getStops(id);
        const s = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        setStops(s);
        // Pre-load all activities for all stops so we can show pins
        const allActs = {};
        for (const stop of s) {
          try {
            const ar = await axiosInstance.get(`/trips/${id}/stops/${stop.id}/activities`);
            allActs[stop.id] = ar.data?.data || [];
          } catch { allActs[stop.id] = []; }
        }
        setAllActivities(allActs);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  // Load activities when a stop is selected
  useEffect(() => {
    if (!selectedStop) return;
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/trips/${id}/stops/${selectedStop.id}/activities`);
        setActivities(res.data?.data || []);
      } catch { setActivities([]); }
    };
    load();
  }, [selectedStop, id]);

  const positions = useMemo(() =>
    stops
      .filter(s => s.city?.latitude && s.city?.longitude)
      .map(s => [s.city.latitude, s.city.longitude]),
    [stops]
  );

  // All activity pins for map bounds + sidebar
  const pinnedActivities = useMemo(() => {
    return Object.values(allActivities).flat().filter(act => {
      if (!act.location) return false;
      const parts = act.location.split(',');
      if (parts.length !== 2) return false;
      const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
      return !isNaN(lat) && !isNaN(lng);
    });
  }, [allActivities]);

  // Combined positions for FitBounds — prefer activity pins when they exist
  const allMapPositions = useMemo(() => {
    const actPositions = pinnedActivities.map(act => {
      const [lat, lng] = act.location.split(',').map(parseFloat);
      return [lat, lng];
    });
    return actPositions.length > 0 ? [...positions, ...actPositions] : positions;
  }, [positions, pinnedActivities]);

  const defaultCenter = positions.length > 0 ? positions[0] : [20.5937, 78.9629]; // India center

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-[#F5C142]" />
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-20 h-20 bg-[#F5C142] rounded-full flex items-center justify-center mb-4 border-3 border-[#1A1A1A]"
          style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
          <MapIcon size={32} className="text-[#1A1A1A]" />
        </div>
        <h2 className="text-xl font-black text-[#1A1A1A] mb-2">No stops on the map</h2>
        <p className="text-sm text-[#6B7280] max-w-sm">
          Add stops to your trip first, then see your route visualized here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">

      {/* Left sidebar — itinerary stops */}
      <div className="w-[340px] flex-shrink-0 bg-white border-r-2 border-[#1A1A1A] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2 mb-1">
            <MapIcon size={18} className="text-[#F5C142]" />
            <h2 className="text-base font-black text-[#1A1A1A]">Trip Map</h2>
          </div>
          <p className="text-[10px] text-[#6B7280] uppercase tracking-widest font-bold">
            {trip?.name} — Route Visualisation
          </p>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="bg-[#F5F0E8] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#E5E7EB]">
              📍 {stops.length} stops
            </span>
            {pinnedActivities.length > 0 && (
              <span className="bg-orange-50 text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-200 text-orange-700">
                🎯 {pinnedActivities.length} activity pins
              </span>
            )}
          </div>
        </div>

        {/* Stop list */}
        <div className="px-3 py-3 space-y-2">
          {stops.map((stop, idx) => (
            <button
              key={stop.id}
              onClick={() => setSelectedStop(stop)}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all duration-150
                         ${selectedStop?.id === stop.id
                           ? 'bg-[#FFFBF0] border-[#F5C142]'
                           : 'bg-white border-[#E5E7EB] hover:border-[#1A1A1A]'
                         }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#1A1A1A] text-[10px] font-black px-2 py-0.5 rounded-md text-[#F5C142]">
                  ★
                </span>
                <span className="text-sm font-black text-[#1A1A1A]">{stop.city?.name}</span>
              </div>
              <p className="text-[10px] text-[#6B7280] flex items-center gap-1">
                <MapPin size={9} /> {stop.city?.country}
              </p>
            </button>
          ))}
        </div>

        {/* Selected stop activities */}
        {selectedStop && activities.length > 0 && (
          <div className="px-3 pb-4">
            <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest px-1 mb-2">
              Activities at {selectedStop.city?.name}
            </p>
            <div className="space-y-1.5">
              {activities.map((act, i) => (
                <div key={act.id} className="bg-[#F5F0E8] rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-[#1A1A1A]">
                    {act.customName || act.activity?.name || 'Activity'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[#6B7280]">
                    {act.startTime && <span className="flex items-center gap-0.5"><Clock size={8} /> {act.startTime}</span>}
                    {act.cost > 0 && <span className="flex items-center gap-0.5"><IndianRupee size={8} /> ₹{act.cost}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Pinned activities list */}
        {pinnedActivities.length > 0 && (
          <div className="px-3 pb-3 border-t border-[#E5E7EB]">
            <p className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest px-1 py-2">🎯 Activity Pins</p>
            <div className="space-y-1.5">
              {pinnedActivities.map((act, idx) => {
                let dateLabel = '';
                if (trip?.startDate && act.dayOffset !== undefined) {
                  const d = new Date(trip.startDate);
                  d.setDate(d.getDate() + act.dayOffset);
                  dateLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
                }
                return (
                  <div key={act.id}
                    className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-start gap-3"
                  >
                    <span className="mt-0.5 bg-[#FB923C] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#1A1A1A] text-[#1A1A1A] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#1A1A1A]">
                        {act.customName || act.activity?.name || 'Activity'}
                      </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {dateLabel && <span className="text-[10px] text-orange-700">📅 {dateLabel}</span>}
                      {act.startTime && <span className="text-[10px] text-[#6B7280]">🕐 {act.startTime}</span>}
                      {act.cost > 0 && <span className="text-[10px] text-[#6B7280]">💰 ₹{act.cost}</span>}
                    </div>
                    {act.notes && (
                      <p className="text-[10px] text-[#9CA3AF] mt-1 italic line-clamp-2">{act.notes}</p>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pinnedActivities.length === 0 && (
          <div className="px-4 py-4 border-t border-[#E5E7EB]">
            <div className="bg-[#F5F0E8] rounded-xl p-3 text-center">
              <p className="text-[11px] font-bold text-[#6B7280]">🗺️ No activity pins yet</p>
              <p className="text-[10px] text-[#9CA3AF] mt-1">Add activities in the Plan tab and pin their locations to see them here.</p>
            </div>
          </div>
        )}

      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={4}
          className="w-full h-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={allMapPositions} />

          {/* Route line */}
          {positions.length > 1 && (
            <Polyline
              positions={positions}
              pathOptions={{ color: '#F5C142', weight: 3, dashArray: '8, 8' }}
            />
          )}

          {/* Stop markers */}
          {stops.map((stop, idx) => {
            if (!stop.city?.latitude || !stop.city?.longitude) return null;
            return (
              <Marker
                key={stop.id}
                position={[stop.city.latitude, stop.city.longitude]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="
                    background:${selectedStop?.id === stop.id ? '#1A1A1A' : '#FFFFFF'};
                    border:2px solid #1A1A1A; border-radius:50%; width:20px; height:20px;
                    display:flex; align-items:center; justify-content:center;
                    font-size:10px; color:${selectedStop?.id === stop.id ? '#F5C142' : '#1A1A1A'};
                    box-shadow:2px 2px 0px #1A1A1A;
                  ">★</div>`,
                  iconSize: [20, 20], iconAnchor: [10, 10],
                })}
                eventHandlers={{ click: () => setSelectedStop(stop) }}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-bold text-sm">{stop.city.name}</p>
                    <p className="text-xs text-gray-500">{stop.city.country}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Activity location pins */}
          {Object.values(allActivities).flat().filter(act => act.location && act.location.split(',').length === 2 && !isNaN(parseFloat(act.location.split(',')[0]))).map((act, idx) => {
            const parts = act.location.split(',');
            if (parts.length !== 2) return null;
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (isNaN(lat) || isNaN(lng)) return null;

            // Calculate actual date from dayOffset + trip start
            let dateLabel = '';
            if (trip?.startDate && act.dayOffset !== undefined && act.dayOffset !== null) {
              const d = new Date(trip.startDate);
              d.setDate(d.getDate() + act.dayOffset);
              dateLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
            }

            const actIcon = createNumberedIcon(idx + 1, '#FB923C');

            return (
              <Marker key={act.id} position={[lat, lng]} icon={actIcon}>
                <Popup maxWidth={220}>
                  <div style={{ minWidth: 160 }}>
                    <p style={{ fontWeight: 900, fontSize: 13, marginBottom: 4, color: '#1A1A1A' }}>
                      {act.customName || act.activity?.name || 'Activity'}
                    </p>
                    {dateLabel && (
                      <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
                        📅 {dateLabel}
                        {act.dayOffset !== undefined ? ` · Day ${act.dayOffset + 1}` : ''}
                      </p>
                    )}
                    {(act.startTime || act.endTime) && (
                      <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
                        🕐 {act.startTime || ''}
                        {act.startTime && act.endTime ? ' – ' : ''}
                        {act.endTime || ''}
                      </p>
                    )}
                    {act.cost > 0 && (
                      <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
                        💰 ₹{act.cost.toLocaleString('en-IN')}
                      </p>
                    )}
                    {act.notes && (
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic', borderTop: '1px solid #E5E7EB', paddingTop: 4 }}>
                        {act.notes}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Google Maps link */}
        {positions.length > 0 && (
          <a
            href={`https://www.google.com/maps/dir/${positions.map(p => p.join(',')).join('/')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-full
                       border-2 border-[#1A1A1A] px-4 py-2 text-xs font-bold text-[#1A1A1A]
                       hover:bg-[#F5F0E8] transition-colors z-[1000]"
            style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
          >
            <ExternalLink size={12} /> Open in Google Maps
          </a>
        )}
      </div>
    </div>
  );
};

export default TripMapPage;
