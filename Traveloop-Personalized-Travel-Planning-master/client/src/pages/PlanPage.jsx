import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CalendarDays, GripVertical, Clock, IndianRupee, Trash2, Edit3,
  Loader2, Plus, X, MapPin, Save, Search
} from 'lucide-react';
import { getStops, createStop } from '../api/stops.api';
import axiosInstance from '../api/axiosInstance';
import { searchEntities } from '../api/search.api';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Click-to-place pin helper
const MapPinPlacer = ({ onPin }) => {
  useMapEvents({ click(e) { onPin(e.latlng.lat, e.latlng.lng); } });
  return null;
};

// Droppable day column wrapper
const DroppableDay = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}
      className={`flex-1 flex flex-col gap-2 min-h-[80px] rounded-lg transition-colors ${isOver ? 'bg-amber-50 ring-2 ring-amber-300' : ''}`}>
      {children}
    </div>
  );
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getDaysArray = (start, end) => {
  if (!start || !end) return [{ label: 'Day 1', date: null }];
  const days = [];
  const s = new Date(start);
  const e = new Date(end);
  let i = 1;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push({
      label: `D${i}`,
      date: new Date(d),
      dayIndex: i - 1,
    });
    i++;
  }
  return days.length > 0 ? days : [{ label: 'Day 1', date: null, dayIndex: 0 }];
};

const CAT_COLORS = {
  SIGHTSEEING: 'border-l-amber-400', FOOD: 'border-l-orange-400',
  ADVENTURE: 'border-l-sky-400', CULTURAL: 'border-l-violet-400',
  RELAXATION: 'border-l-emerald-400', SHOPPING: 'border-l-pink-400',
  TRANSPORT: 'border-l-slate-400', OTHER: 'border-l-gray-400',
};

const CAT_EMOJI = {
  SIGHTSEEING: '🏛️', FOOD: '🍜', ADVENTURE: '🏔️', CULTURAL: '🎭',
  RELAXATION: '🧘', SHOPPING: '🛍️', TRANSPORT: '🚌', OTHER: '📌',
};

/* ─── Sortable Activity Card ──────────────────────────────────────────────── */

const SortableActivity = ({ activity, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cat = activity.activity?.category || 'OTHER';
  const name = activity.customName || activity.activity?.name || 'Activity';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 bg-white rounded-xl border-2 border-[#1A1A1A] border-l-4
                 ${CAT_COLORS[cat] || CAT_COLORS.OTHER}
                 px-3 py-2.5 group hover:bg-[#FFFBF0] transition-colors`}
      {...attributes}
    >
      {/* Drag handle */}
      <button {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-[#D1D5DB] hover:text-[#1A1A1A]">
        <GripVertical size={14} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{CAT_EMOJI[cat] || '📌'}</span>
          <p className="text-sm font-bold text-[#1A1A1A] truncate">{name}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-[#9CA3AF]">
          {activity.startTime && (
            <span className="flex items-center gap-0.5"><Clock size={9} /> {activity.startTime}</span>
          )}
          {activity.cost > 0 && (
            <span className="flex items-center gap-0.5"><IndianRupee size={9} /> ₹{activity.cost}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(activity)} className="p-1 rounded hover:bg-[#F5F0E8]">
          <Edit3 size={12} className="text-[#6B7280]" />
        </button>
        <button onClick={() => onDelete(activity)} className="p-1 rounded hover:bg-red-50">
          <Trash2 size={12} className="text-[#EF4444]" />
        </button>
      </div>
    </div>
  );
};

/* ─── Overlay card (shown while dragging) ─────────────────────────────────── */

const DragOverlayCard = ({ activity }) => {
  const name = activity?.customName || activity?.activity?.name || 'Activity';
  return (
    <div className="bg-[#F5C142] rounded-xl border-2 border-[#1A1A1A] px-4 py-3 shadow-lg w-[220px]"
      style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
      <p className="text-sm font-black text-[#1A1A1A] truncate">{name}</p>
    </div>
  );
};

/* ─── Edit / Add Floating Panel ───────────────────────────────────────────── */

const EditPanel = ({ activity, onSave, onClose, dayIndex, stopId }) => {
  const [customName, setCustomName] = useState(activity?.customName || activity?.activity?.name || '');
  const [startTime, setStartTime] = useState(activity?.startTime || '');
  const [endTime, setEndTime] = useState(activity?.endTime || '');
  const [cost, setCost] = useState(activity?.cost || 0);
  const [location, setLocation] = useState(activity?.location || '');
  const [notes, setNotes] = useState(activity?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Parse existing pin if present
  const existingPin = useMemo(() => {
    if (!location) return null;
    const p = location.split(',');
    if (p.length !== 2) return null;
    const lat = parseFloat(p[0]), lng = parseFloat(p[1]);
    return isNaN(lat) || isNaN(lng) ? null : [lat, lng];
  }, [location]);

  const handlePin = (lat, lng) => {
    setLocation(`${lat.toFixed(6)},${lng.toFixed(6)}`);
  };

  const handleSave = async () => {
    if (!customName.trim()) return alert("Name is required");
    setSaving(true);
    await onSave({ ...activity, customName, startTime, endTime, cost: Number(cost), location, notes, dayOffset: dayIndex, stopId });
    setSaving(false);
  };

  const pinIcon = L.divIcon({
    className: '',
    html: `<div style="background:#F5C142;border:2px solid #1A1A1A;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;">📍</div>`,
    iconSize: [20, 20], iconAnchor: [10, 10],
  });

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 w-[440px] max-w-[95vw] space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#1A1A1A]">{activity ? 'Edit Activity' : 'Add Custom Activity'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F5F0E8]"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Name</label>
            <input value={customName} onChange={e => setCustomName(e.target.value)}
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#1A1A1A] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Start Time</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#1A1A1A] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">End Time</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#1A1A1A] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Cost (₹)</label>
            <input type="number" value={cost} onChange={e => setCost(e.target.value)}
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#1A1A1A] focus:outline-none" />
          </div>

          {/* Location / Map Pin */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Pin Location</label>
              <button
                type="button"
                onClick={() => setShowMap(v => !v)}
                className="text-[10px] font-bold text-[#F5C142] border border-[#F5C142] rounded-lg px-2 py-0.5 hover:bg-[#FEF3C7] transition-colors"
              >
                {showMap ? 'Hide Map' : (existingPin ? '📍 Repin' : '📍 Pin on Map')}
              </button>
            </div>
            {location && (
              <p className="text-[10px] text-[#6B7280] mb-1">📍 {location}</p>
            )}
            {showMap && (
              <div className="rounded-xl overflow-hidden border-2 border-[#1A1A1A]" style={{ height: 200 }}>
                <MapContainer
                  center={existingPin || [20.5937, 78.9629]}
                  zoom={existingPin ? 13 : 4}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapPinPlacer onPin={handlePin} />
                  {existingPin && <Marker position={existingPin} icon={pinIcon} />}
                </MapContainer>
              </div>
            )}
            {showMap && (
              <p className="text-[10px] text-[#9CA3AF] mt-1">Click anywhere on the map to drop a pin</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#1A1A1A] focus:outline-none resize-none" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm
                     rounded-xl px-4 py-3 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors disabled:opacity-50"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>
    </div>
  );
};

/* ─── Add Stop Panel ──────────────────────────────────────────────────────── */
const AddStopPanel = ({ tripId, onAdded, onClose }) => {
  const [cityName, setCityName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!cityName.trim()) return alert('City name is required');
    setSaving(true);
    try {
      await createStop(tripId, { cityName });
      onAdded();
    } catch (err) {
      alert('Failed to add stop');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl border-2 border-[#1A1A1A] p-6 w-[400px] max-w-[90vw] space-y-4"
        style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-[#1A1A1A]">Add a Stop</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F5F0E8]"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">City Name</label>
            <input value={cityName} onChange={e => setCityName(e.target.value)} placeholder="e.g. Manali, Paris"
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#1A1A1A] focus:outline-none" />
          </div>
        </div>
        <button onClick={handleAdd} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm
                     rounded-xl px-4 py-3 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors disabled:opacity-50"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Add Stop
        </button>
      </div>
    </div>
  );
};

/* ─── Plan Page ────────────────────────────────────────────────────────────── */

const PlanPage = () => {
  const { id } = useParams();
  const { trip } = useOutletContext();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesByStop, setActivitiesByStop] = useState({});
  const [editingActivity, setEditingActivity] = useState(null);
  const [addingActivityDay, setAddingActivityDay] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [showAddStop, setShowAddStop] = useState(false);
  // Track the original day when a drag starts so handleDragEnd always knows where it came from
  const dragOriginDay = React.useRef(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const days = useMemo(() => getDaysArray(trip?.startDate, trip?.endDate), [trip]);

  // Load stops + their activities
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStops(id);
      const s = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
      setStops(s);

      // Fetch activities for each stop
      const map = {};
      for (const stop of s) {
        try {
          const actRes = await axiosInstance.get(`/trips/${id}/stops/${stop.id}/activities`);
          const acts = actRes.data?.data || [];
          map[stop.id] = Array.isArray(acts) ? acts.map(a => ({ ...a, stopId: stop.id })) : [];
        } catch { map[stop.id] = []; }
      }
      setActivitiesByStop(map);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // All activities flat (for drag context)
  const allActivities = useMemo(() => {
    return Object.values(activitiesByStop).flat();
  }, [activitiesByStop]);

  // Group activities by dayOffset
  const activitiesByDay = useMemo(() => {
    const map = {};
    days.forEach((_, i) => { map[i] = []; });
    allActivities.forEach(act => {
      const day = act.dayOffset || 0;
      if (!map[day]) map[day] = [];
      map[day].push(act);
    });
    // Sort each day by orderIndex
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    });
    return map;
  }, [allActivities, days]);

  const handleDragStart = (event) => {
    const actId = event.active.id;
    setActiveId(actId);
    // Record original day BEFORE any optimistic moves happen
    dragOriginDay.current = getActDay(actId);
  };

  // Helper: which day does an activity belong to?
  const getActDay = useCallback((actId) => {
    const key = Object.keys(activitiesByDay).find(k =>
      activitiesByDay[k].some(a => a.id === actId)
    );
    return key !== undefined ? parseInt(key) : null;
  }, [activitiesByDay]);

  // Called while dragging — move card to new column optimistically
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeActId = active.id;
    const overId = String(over.id);

    const srcDay = getActDay(activeActId);
    let destDay;
    if (overId.startsWith('day-col-')) {
      destDay = parseInt(overId.replace('day-col-', ''));
    } else {
      destDay = getActDay(overId);
    }
    if (srcDay === null || destDay === null || srcDay === destDay) return;

    const activity = allActivities.find(a => a.id === activeActId);
    if (!activity) return;

    // Optimistic cross-column move
    setActivitiesByStop(prev => {
      const next = { ...prev };
      if (next[activity.stopId]) {
        next[activity.stopId] = next[activity.stopId].map(a =>
          a.id === activeActId ? { ...a, dayOffset: destDay } : a
        );
      }
      return next;
    });
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    const originDay = dragOriginDay.current;
    dragOriginDay.current = null;

    if (!over) return;

    const activeActId = active.id;
    const overId = String(over.id);
    const activity = allActivities.find(a => a.id === activeActId);
    if (!activity) return;

    // Resolve destination day from the over target
    let destDay;
    if (overId.startsWith('day-col-')) {
      destDay = parseInt(overId.replace('day-col-', ''));
    } else {
      destDay = getActDay(overId);
    }
    if (destDay === null) return;

    // Cross-column drop — use originDay to detect actual move
    if (originDay !== null && destDay !== originDay) {
      // Optimistic state is already applied by handleDragOver; just persist
      try {
        await axiosInstance.put(
          `/trips/${id}/stops/${activity.stopId}/activities/${activeActId}`,
          { customName: activity.customName, cost: activity.cost, dayOffset: destDay,
            notes: activity.notes || null, startTime: activity.startTime || null,
            endTime: activity.endTime || null, location: activity.location || null }
        );
      } catch {
        // Rollback: reload from server
        loadData();
      }
      return;
    }

    // Same-column reorder
    const dayKey = String(originDay ?? destDay);
    if (activeActId === overId) return;
    const items = [...(activitiesByDay[dayKey] || [])];
    const oldIdx = items.findIndex(a => a.id === activeActId);
    const newIdx = items.findIndex(a => a.id === overId);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(items, oldIdx, newIdx);

    setActivitiesByStop(prev => {
      const next = { ...prev };
      if (next[activity.stopId]) {
        next[activity.stopId] = next[activity.stopId].map(a => {
          const idx = reordered.findIndex(r => r.id === a.id);
          return idx >= 0 ? { ...a, orderIndex: idx } : a;
        });
      }
      return next;
    });

    try {
      await axiosInstance.patch(`/trips/${id}/stops/${activity.stopId}/activities/reorder`, {
        items: reordered.map((a, i) => ({ id: a.id, orderIndex: i })),
      });
    } catch { /* ignore */ }
  };

  const handleDelete = async (activity) => {
    if (!confirm('Remove this activity?')) return;
    try {
      await axiosInstance.delete(`/trips/${id}/stops/${activity.stopId}/activities/${activity.id}`);
      setActivitiesByStop(prev => {
        const next = { ...prev };
        if (next[activity.stopId]) {
          next[activity.stopId] = next[activity.stopId].filter(a => a.id !== activity.id);
        }
        return next;
      });
    } catch { /* ignore */ }
  };

  const handleEditSave = async (updated) => {
    try {
      await axiosInstance.put(
        `/trips/${id}/stops/${updated.stopId}/activities/${updated.id}`,
        {
          customName: updated.customName,
          startTime: updated.startTime || null,
          endTime: updated.endTime || null,
          cost: updated.cost,
          notes: updated.notes || null,
        }
      );
      setActivitiesByStop(prev => {
        const next = { ...prev };
        if (next[updated.stopId]) {
          next[updated.stopId] = next[updated.stopId].map(a =>
            a.id === updated.id ? { ...a, ...updated } : a
          );
        }
        return next;
      });
    } catch { /* ignore */ }
    setEditingActivity(null);
  };

  const handleAddActivity = async (newActivity) => {
    try {
      const res = await axiosInstance.post(
        `/trips/${id}/stops/${newActivity.stopId}/activities`,
        {
          customName: newActivity.customName,
          startTime: newActivity.startTime || null,
          endTime: newActivity.endTime || null,
          cost: newActivity.cost,
          notes: newActivity.notes || null,
          dayOffset: newActivity.dayOffset
        }
      );
      // Stamp stopId so DnD & map can identify it
      const addedAct = { ...(res.data.data || {}), stopId: newActivity.stopId };
      setActivitiesByStop(prev => {
        const next = { ...prev };
        if (!next[newActivity.stopId]) next[newActivity.stopId] = [];
        next[newActivity.stopId] = [...next[newActivity.stopId], addedAct];
        return next;
      });
    } catch (err) { alert('Failed to add activity'); }
    setAddingActivityDay(null);
  };

  const draggedActivity = activeId ? allActivities.find(a => a.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-[#F5C142]" />
      </div>
    );
  }

  // Compute total budget for the header bar
  const totalCost = allActivities.reduce((s, a) => s + (a.cost || 0), 0);

  return (
    <div className="px-6 py-6 space-y-5 h-full flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays size={22} className="text-[#F5C142]" />
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">Planning Board</h1>
            <p className="text-xs text-[#6B7280]">
              {trip?.name} · {formatDate(trip?.startDate)} — {formatDate(trip?.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {stops.length > 0 && (
            <button
              onClick={() => setShowAddStop(true)}
              className="flex items-center gap-1.5 bg-[#1A1A1A] text-white px-4 py-2 rounded-full text-sm font-bold border-2 border-[#1A1A1A] hover:bg-[#333]"
              style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
            >
              <Plus size={14} /> Add Stop
            </button>
          )}

          {/* Budget bar */}
          <div className="flex items-center gap-3 bg-white rounded-full border-2 border-[#1A1A1A] px-4 py-2"
            style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
            <IndianRupee size={14} className="text-[#1A1A1A]" />
            <span className="text-sm font-black text-[#1A1A1A]">₹{totalCost.toLocaleString('en-IN')}</span>
            {trip?.totalBudget && (
              <span className="text-xs text-[#6B7280]">/ ₹{trip.totalBudget.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </div>

      {stops.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-20 h-20 bg-[#F5C142] rounded-full flex items-center justify-center mb-4 border-3 border-[#1A1A1A]"
            style={{ boxShadow: '4px 4px 0px #1A1A1A' }}>
            <CalendarDays size={32} className="text-[#1A1A1A]" />
          </div>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-2">No stops yet</h2>
          <p className="text-sm text-[#6B7280] max-w-sm mb-4">
            Add a stop to this trip to start planning your daily itinerary.
          </p>
          <button
            onClick={() => setShowAddStop(true)}
            className="flex items-center gap-2 bg-[#F5C142] text-[#1A1A1A] font-black text-sm px-6 py-3 rounded-full border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors"
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            <Plus size={16} /> Add First Stop
          </button>
        </div>
      ) : (
        /* Day columns — horizontal scroll */
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-4 pb-4 min-h-[400px]" style={{ minWidth: `${days.length * 280}px` }}>
              {days.map((day, dayIdx) => {
                const dayActs = activitiesByDay[dayIdx] || [];
                // Find which stop covers this day
                const dayStop = stops[Math.min(dayIdx, stops.length - 1)];
                const dayCost = dayActs.reduce((s, a) => s + (a.cost || 0), 0);

                return (
                  <div key={dayIdx} className="w-[260px] flex-shrink-0 flex flex-col">
                    {/* Day header */}
                    <div className="bg-[#F5C142] rounded-t-2xl border-2 border-[#1A1A1A] px-4 py-3"
                      style={{ boxShadow: '2px 2px 0px #1A1A1A' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#1A1A1A] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                            {day.label}
                          </span>
                          <span className="text-xs font-bold text-[#1A1A1A]">
                            {day.date ? formatDate(day.date) : 'Flexible'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] text-[#1A1A1A]/70 flex items-center gap-1">
                          <MapPin size={9} /> {dayStop?.city?.name || 'TBD'}
                        </p>
                        <p className="text-[10px] font-bold text-[#1A1A1A]">₹{dayCost.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Activities column — wrapped in DroppableDay for cross-column drops */}
                    <div className="bg-white/60 border-2 border-t-0 border-[#1A1A1A] rounded-b-2xl px-2 py-2 flex-1 flex flex-col gap-2">
                      <DroppableDay id={`day-col-${dayIdx}`}>
                        <SortableContext items={dayActs.map(a => a.id)} strategy={verticalListSortingStrategy}>
                          {dayActs.map(act => (
                            <SortableActivity
                              key={act.id}
                              activity={act}
                              onEdit={setEditingActivity}
                              onDelete={handleDelete}
                            />
                          ))}
                        </SortableContext>

                        {dayActs.length === 0 && (
                          <div className="flex items-center justify-center h-[80px] border-2 border-dashed border-[#D1D5DB] rounded-xl text-xs text-[#9CA3AF] font-bold">
                            Drop activities here
                          </div>
                        )}
                      </DroppableDay>

                      <button
                        onClick={() => setAddingActivityDay({ dayIndex: dayIdx, stopId: dayStop.id })}
                        className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-[#E5E7EB] rounded-xl text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] hover:border-[#1A1A1A] transition-colors"
                      >
                        <Plus size={14} /> Add Custom Activity
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {draggedActivity ? <DragOverlayCard activity={draggedActivity} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit panel */}
      {editingActivity && (
        <EditPanel activity={editingActivity} onSave={handleEditSave} onClose={() => setEditingActivity(null)} />
      )}

      {/* Add panel */}
      {addingActivityDay && (
        <EditPanel 
          activity={null} 
          dayIndex={addingActivityDay.dayIndex}
          stopId={addingActivityDay.stopId}
          onSave={handleAddActivity} 
          onClose={() => setAddingActivityDay(null)} 
        />
      )}

      {/* Add Stop Panel */}
      {showAddStop && (
        <AddStopPanel tripId={id} onAdded={() => { setShowAddStop(false); loadData(); }} onClose={() => setShowAddStop(false)} />
      )}
    </div>
  );
};

export default PlanPage;
