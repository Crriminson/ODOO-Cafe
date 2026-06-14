import { useState, useEffect, useCallback } from 'react';
import { ChefHat, Plus, Pencil, Trash2, Loader2, Search, Coffee } from 'lucide-react';
import { getCooks, createCook, updateCook, deleteCook } from '../../../shared/api/cooks.api.js';
import { getCategories } from '../../../shared/api/categories.api.js';

/* ── shared style tokens ───────────────────────────────── */
const inputCls = 'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white text-[#1A1A1A] transition-colors duration-150 focus:outline-none';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[#1A1A1A]';

/* ── confirm delete modal ─────────────────────────────── */
function ConfirmModal({ name, onConfirm, onCancel }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onCancel}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-sm w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-2 text-[#1A1A1A]">Remove cook?</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          "<strong>{name}</strong>" will be archived and removed from the kitchen rotation.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
                  className="bg-[#EF4444] text-white font-bold text-sm rounded-lg px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-red-600 transition-colors">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── cook form modal ──────────────────────────────────── */
const EMPTY_FORM = { name: '', category_preferences: [], is_active: true };

function CookModal({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, is_active: initial.is_active,
          category_preferences: (initial.category_preferences || []).map((c) => c.id ?? c) }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const toggleCat = (id) =>
    setForm((f) => ({
      ...f,
      category_preferences: f.category_preferences.includes(id)
        ? f.category_preferences.filter((x) => x !== id)
        : [...f.category_preferences, id],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const payload = {
        name: form.name.trim(),
        category_preferences: form.category_preferences,
        ...(initial ? { is_active: form.is_active } : {}),
      };
      await onSave(payload);
      onClose();
    } catch (ex) {
      setErr(ex.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5 text-[#1A1A1A]">
          {initial ? 'Edit cook profile' : 'Add kitchen staff'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} required placeholder="e.g. Chef Raj"
                   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>

          {/* Category preferences */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Category preferences</label>
            <p className="text-xs text-[#6B7280] -mt-1">
              Select which item types this cook handles. Leave empty to receive all items.
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.length === 0
                ? <p className="text-xs text-[#9CA3AF] italic">No categories yet</p>
                : categories.map((cat) => {
                  const selected = form.category_preferences.includes(cat.id);
                  return (
                    <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all duration-150"
                            style={{
                              borderColor: '#1A1A1A',
                              background: selected ? cat.color : '#fff',
                              color: '#1A1A1A',
                              opacity: selected ? 1 : 0.6,
                              boxShadow: selected ? 'var(--shadow-sm)' : 'none',
                            }}>
                      {selected && <span className="text-[10px]">✓</span>}
                      {cat.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Status — only on edit */}
          {initial && (
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.is_active ? 'true' : 'false'}
                      onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'true' }))}
                      style={{ borderColor: '#E5E7EB' }}
                      onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
                <option value="true">Active — available for allocation</option>
                <option value="false">Inactive — removed from rotation</option>
              </select>
            </div>
          )}

          {err && (
            <div className="border-2 rounded-lg px-3 py-2.5 text-sm"
                 style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}>
              {err}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
                    className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A',
                             boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (initial ? 'Update' : 'Add cook')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── skeleton card ─────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 space-y-3"
         style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="h-5 w-2/3 rounded animate-pulse" style={{ background: '#E5E7EB' }} />
      <div className="h-3 w-1/3 rounded animate-pulse" style={{ background: '#E5E7EB' }} />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-16 rounded-lg animate-pulse" style={{ background: '#E5E7EB' }} />
        <div className="h-6 w-20 rounded-lg animate-pulse" style={{ background: '#E5E7EB' }} />
      </div>
    </div>
  );
}

/* ── cook card ─────────────────────────────────────────── */
function CookCard({ cook, onEdit, onToggle, onDelete }) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(cook);
    setToggling(false);
  };

  return (
    <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-5 flex flex-col gap-4"
         style={{ boxShadow: 'var(--shadow-lg)', opacity: cook.is_active ? 1 : 0.65 }}>
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black text-base text-[#1A1A1A] leading-tight">{cook.name}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {cook.is_active ? 'Available for order allocation' : 'Not in rotation'}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
              style={cook.is_active
                ? { background: '#D1FAE5', color: '#065F46' }
                : { background: '#F3F4F6', color: '#6B7280' }}>
          {cook.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* category chips */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 flex items-center gap-1">
          <Coffee size={10} /> Handles
        </p>
        {(cook.category_preferences || []).length === 0 ? (
          <span className="text-xs text-[#9CA3AF] italic">All categories</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {cook.category_preferences.map((pref) => (
              <span key={pref.id}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#1A1A1A]"
                    style={{ background: pref.color || '#F5C142', color: '#1A1A1A' }}>
                {pref.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 pt-1 border-t-2 border-[#E5E7EB]">
        <button onClick={handleToggle} disabled={toggling}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold border-2 border-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
                style={{ opacity: toggling ? 0.6 : 1 }}>
          {toggling ? <Loader2 size={12} className="animate-spin" /> : null}
          {cook.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={onEdit} aria-label="Edit cook"
                className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#F5F0E8] transition-colors">
          <Pencil size={13} strokeWidth={2} />
        </button>
        <button onClick={onDelete} aria-label="Delete cook"
                className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#FEF2F2] transition-colors">
          <Trash2 size={13} strokeWidth={2} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────── */
export default function Cooks() {
  const [cooks,      setCooks]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [apiErr,     setApiErr]     = useState('');
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all'); // 'all' | 'active' | 'inactive'

  const [cookModal,   setCookModal]   = useState(null); // null | {} (add) | cook (edit)
  const [deleteModal, setDeleteModal] = useState(null); // null | { id, name }

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr('');
    try {
      const [cd, catd] = await Promise.all([getCooks(), getCategories()]);
      setCooks(cd.cooks || []);
      setCategories(catd.categories || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveCook = async (data) => {
    if (cookModal?.id) await updateCook(cookModal.id, data);
    else               await createCook(data);
    await load();
  };

  const toggleActive = async (cook) => {
    await updateCook(cook.id, { name: cook.name, is_active: !cook.is_active });
    await load();
  };

  const confirmDelete = async () => {
    await deleteCook(deleteModal.id);
    setDeleteModal(null);
    await load();
  };

  const visible = cooks.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && c.is_active) ||
      (filter === 'inactive' && !c.is_active);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <ChefHat size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Kitchen Staff</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">
        Manage cook profiles, active status, and category preferences for order allocation.
      </p>

      {/* API error */}
      {apiErr && (
        <div className="border-2 rounded-xl px-4 py-3 text-sm mb-5"
             style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }} role="alert">
          {apiErr}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search by name…"
                 className="w-full border-2 rounded-lg pl-8 pr-3 py-2 text-sm bg-white text-[#1A1A1A] focus:outline-none transition-colors"
                 style={{ borderColor: '#E5E7EB' }}
                 onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                 onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
                    className="px-3 py-2 rounded-lg border-2 text-sm font-bold transition-colors duration-150"
                    style={filter === key
                      ? { background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }
                      : { background: '#fff', borderColor: '#1A1A1A', color: '#6B7280' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button onClick={() => setCookModal({})}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors ml-auto"
                style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
          <Plus size={14} strokeWidth={2} /> Add cook
        </button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : visible.length === 0
            ? (
              <div className="col-span-full bg-white border-2 border-[#1A1A1A] rounded-2xl px-6 py-12 text-center"
                   style={{ boxShadow: 'var(--shadow-lg)' }}>
                <p className="text-sm font-bold text-[#1A1A1A] mb-1">
                  {search || filter !== 'all' ? 'No cooks match your filter' : 'No kitchen staff yet'}
                </p>
                <p className="text-xs text-[#6B7280] mb-4">
                  {search || filter !== 'all' ? 'Try adjusting your search or filter.' : 'Add your first cook to start managing order allocation.'}
                </p>
                {!search && filter === 'all' && (
                  <button onClick={() => setCookModal({})}
                          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                          style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
                    <Plus size={14} strokeWidth={2} /> Add cook
                  </button>
                )}
              </div>
            )
            : visible.map((cook) => (
              <CookCard key={cook.id} cook={cook}
                        onEdit={() => setCookModal(cook)}
                        onToggle={toggleActive}
                        onDelete={() => setDeleteModal({ id: cook.id, name: cook.name })} />
            ))}
      </div>

      {/* Modals */}
      {cookModal !== null && (
        <CookModal
          initial={cookModal?.id ? cookModal : null}
          categories={categories}
          onSave={saveCook}
          onClose={() => setCookModal(null)}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          name={deleteModal.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
