import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Users, Pencil, Trash2, Loader2 } from 'lucide-react';
import { request } from '../../../shared/api/client.js';

/* ── helpers ─────────────────────────────────────────── */
const inputCls = 'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white transition-colors duration-150 focus:outline-none';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[#1A1A1A]';

/* ── skeleton card ───────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="border-2 border-[#E5E7EB] rounded-xl p-4 flex flex-col gap-2 animate-pulse">
      <div className="h-6 w-12 rounded" style={{ background: '#E5E7EB' }} />
      <div className="h-3 w-16 rounded" style={{ background: '#E5E7EB' }} />
    </div>
  );
}

/* ── confirm delete modal ────────────────────────────── */
function ConfirmModal({ item, itemType, onConfirm, onCancel }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onCancel}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-2 text-[#1A1A1A]">Delete {itemType}?</h2>
        <p className="text-sm mb-6 text-[#6B7280]">
          "<strong>{item.name}</strong>" will be removed. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
          <button onClick={onConfirm}
                  className="bg-[#EF4444] text-white font-bold text-sm rounded-lg px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-red-600 transition-colors duration-150">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── floor form modal ────────────────────────────────── */
function FloorModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try { await onSave(form); onClose(); }
    catch (ex) { setErr(ex.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5 text-[#1A1A1A]">{initial ? 'Edit floor' : 'Add floor'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Floor name *</label>
            <input className={inputCls} value={form.name}
                   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                   required placeholder="Main Floor"
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>
          {err && <div className="border-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }} role="alert">{err}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors duration-150"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save floor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── table form modal ────────────────────────────────── */
function TableModal({ initial, floorId, onSave, onClose }) {
  const [form, setForm] = useState(initial || { table_number: '', seats: 4, floor_id: floorId, is_active: true });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await onSave({ ...form, table_number: parseInt(form.table_number), seats: parseInt(form.seats), floor_id: floorId });
      onClose();
    } catch (ex) { setErr(ex.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5 text-[#1A1A1A]">{initial ? 'Edit table' : 'Add table'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Table # *</label>
              <input className={inputCls} type="number" min="1" value={form.table_number}
                     onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
                     required placeholder="1"
                     style={{ borderColor: '#E5E7EB' }}
                     onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                     onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Seats *</label>
              <input className={inputCls} type="number" min="1" max="20" value={form.seats}
                     onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                     required placeholder="4"
                     style={{ borderColor: '#E5E7EB' }}
                     onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                     onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Status</label>
            <select className={inputCls} value={form.is_active ? 'true' : 'false'}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'true' }))}
                    style={{ borderColor: '#E5E7EB' }}
                    onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          {err && <div className="border-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }} role="alert">{err}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── table card ──────────────────────────────────────── */
function TableCard({ table, onEdit, onDelete }) {
  const occupied = table.has_active_order;
  return (
    <div className="border-2 border-[#1A1A1A] rounded-xl p-4 text-center relative hover:translate-y-[-2px] transition-transform duration-150 cursor-pointer"
         style={{ background: occupied ? '#F5C142' : '#fff', boxShadow: 'var(--shadow-lg)' }}>
      {occupied && (
        <span className="absolute top-2 right-2 text-xs font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 rounded">●</span>
      )}
      {!table.is_active && (
        <span className="absolute top-2 left-2 text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: '#F3F4F6', color: '#6B7280' }}>Off</span>
      )}
      <p className="font-mono font-black text-2xl text-[#1A1A1A]">T{table.table_number}</p>
      <p className="text-xs text-[#1A1A1A] flex items-center justify-center gap-1 mt-1">
        <Users size={12} /> {table.seats} seats
      </p>
      {/* Actions */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <button aria-label={`Edit table ${table.table_number}`} onClick={() => onEdit(table)}
                className="w-7 h-7 rounded-md border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#F5F0E8] transition-colors">
          <Pencil size={11} strokeWidth={2} />
        </button>
        <button aria-label={`Delete table ${table.table_number}`} onClick={() => onDelete(table)}
                className="w-7 h-7 rounded-md border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#FEF2F2] transition-colors">
          <Trash2 size={11} strokeWidth={2} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────── */
export default function FloorsAndTables() {
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiErr, setApiErr] = useState('');
  const [floorModal, setFloorModal] = useState(null);   // null | {} | floor
  const [tableModal, setTableModal] = useState(null);   // null | { floorId, table? }
  const [deleteModal, setDeleteModal] = useState(null); // null | { item, type }

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr('');
    try {
      const r = await request('/floors');
      setFloors(r.floors || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load floors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveFloor = async (data) => {
    if (floorModal?.id) {
      await request(`/floors/${floorModal.id}`, { method: 'PUT', body: data });
    } else {
      await request('/floors', { method: 'POST', body: data });
    }
    await load();
  };

  const saveTable = async (data) => {
    if (tableModal.table) {
      await request(`/tables/${tableModal.table.id}`, { method: 'PUT', body: data });
    } else {
      await request(`/floors/${tableModal.floorId}/tables`, { method: 'POST', body: data });
    }
    await load();
  };

  const confirmDelete = async () => {
    const { item, type } = deleteModal;
    if (type === 'floor') await request(`/floors/${item.id}`, { method: 'DELETE' });
    else await request(`/tables/${item.id}`, { method: 'DELETE' });
    setDeleteModal(null);
    await load();
  };

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <Layers size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Floors & Tables</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">Lay out your restaurant. Amber tables have an active order.</p>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-[#1A1A1A]">{floors.length} floor{floors.length !== 1 ? 's' : ''}</span>
        <button onClick={() => setFloorModal({})}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
          <Plus size={15} strokeWidth={2} /> Add floor
        </button>
      </div>

      {apiErr && (
        <div className="border-2 rounded-xl px-4 py-3 text-sm mb-4"
             style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }} role="alert">{apiErr}</div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-32 rounded mb-4" style={{ background: '#E5E7EB' }} />
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((j) => <SkeletonCard key={j} />)}
              </div>
            </div>
          ))}
        </div>
      ) : floors.length === 0 ? (
        <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-12 text-center"
             style={{ boxShadow: 'var(--shadow-xl)' }}>
          <p className="text-sm font-bold text-[#1A1A1A] mb-1">No floors yet</p>
          <p className="text-xs text-[#6B7280] mb-4">Add a floor to start laying out your restaurant.</p>
          <button onClick={() => setFloorModal({})}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                  style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
            <Plus size={14} strokeWidth={2} /> Add floor
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {floors.map((floor) => (
            <div key={floor.id} className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
                 style={{ boxShadow: 'var(--shadow-xl)' }}>
              {/* Floor header */}
              <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1A1A1A]"
                   style={{ background: '#F5F0E8' }}>
                <h2 className="text-lg font-bold text-[#1A1A1A]">{floor.name}</h2>
                <div className="flex items-center gap-2">
                  <button aria-label={`Add table to ${floor.name}`}
                          onClick={() => setTableModal({ floorId: floor.id, table: null })}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black border-2 hover:bg-[#E0AE30] transition-colors"
                          style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
                    <Plus size={12} strokeWidth={2} /> Table
                  </button>
                  <button aria-label={`Edit floor ${floor.name}`}
                          onClick={() => setFloorModal(floor)}
                          className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-white transition-colors">
                    <Pencil size={13} strokeWidth={2} />
                  </button>
                  <button aria-label={`Delete floor ${floor.name}`}
                          onClick={() => setDeleteModal({ item: floor, type: 'floor' })}
                          className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#FEF2F2] transition-colors">
                    <Trash2 size={13} strokeWidth={2} style={{ color: '#EF4444' }} />
                  </button>
                </div>
              </div>

              {/* Table grid */}
              <div className="p-5">
                {(floor.tables || []).length === 0 ? (
                  <p className="text-sm text-center text-[#9CA3AF] py-6">
                    No tables — click <strong>+ Table</strong> to add one.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {(floor.tables || []).map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        onEdit={(t) => setTableModal({ floorId: floor.id, table: t })}
                        onDelete={(t) => setDeleteModal({ item: t, type: 'table' })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {floorModal !== null && (
        <FloorModal initial={floorModal?.id ? floorModal : null} onSave={saveFloor} onClose={() => setFloorModal(null)} />
      )}
      {tableModal !== null && (
        <TableModal
          initial={tableModal.table}
          floorId={tableModal.floorId}
          onSave={saveTable}
          onClose={() => setTableModal(null)}
        />
      )}
      {deleteModal && (
        <ConfirmModal item={deleteModal.item} itemType={deleteModal.type} onConfirm={confirmDelete} onCancel={() => setDeleteModal(null)} />
      )}
    </div>
  );
}



