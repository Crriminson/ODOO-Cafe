import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../../shared/api/categories.api.js';

/* ── helpers ─────────────────────────────────────────── */
const PRESET_COLORS = [
  '#F5C142', '#10B981', '#3B82F6', '#F59E0B',
  '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6',
];

const EMPTY_FORM = { name: '', color: PRESET_COLORS[0] };

const inputCls = 'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white transition-colors duration-150 focus:outline-none';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[#1A1A1A]';

/* ── skeleton ────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-[#E5E7EB]">
      {[1, 2, 3].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-lg animate-pulse" style={{ background: '#E5E7EB', width: i === 1 ? '50%' : '30%' }} />
        </td>
      ))}
    </tr>
  );
}

/* ── confirm modal ───────────────────────────────────── */
function ConfirmModal({ category, onConfirm, onCancel }) {
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
        <h2 className="text-lg font-black mb-2 text-[#1A1A1A]">Delete category?</h2>
        <p className="text-sm mb-6 text-[#6B7280]">
          "<strong>{category.name}</strong>" will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#1A1A1A]">Cancel</button>
          <button onClick={onConfirm}
                  className="bg-[#EF4444] text-white font-bold text-sm rounded-lg px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-red-600 transition-colors duration-150">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── category form modal ─────────────────────────────── */
function CategoryModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
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
      await onSave(form);
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
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5 text-[#1A1A1A]">
          {initial ? 'Edit category' : 'Add category'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name}
                   onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                   required placeholder="Coffee"
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>

          {/* Color picker */}
          <div className="flex flex-col gap-2">
            <label className={labelCls}>Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button key={c} type="button"
                        aria-label={`Pick color ${c}`}
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="w-8 h-8 rounded-lg border-2 transition-transform duration-150 hover:scale-110"
                        style={{
                          background: c,
                          borderColor: form.color === c ? '#1A1A1A' : 'transparent',
                          boxShadow: form.color === c ? 'var(--shadow-sm)' : 'none',
                        }} />
              ))}
              {/* Custom hex */}
              <input type="color" value={form.color}
                     onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                     className="w-8 h-8 rounded-lg border-2 border-[#E5E7EB] cursor-pointer"
                     title="Custom color" />
            </div>
            {/* Preview */}
            <div className="flex items-center gap-2 mt-1">
              <span className="w-5 h-5 rounded-full border-2 border-[#1A1A1A]"
                    style={{ background: form.color }} />
              <span className="text-xs font-mono text-[#6B7280]">{form.color}</span>
            </div>
          </div>

          {err && (
            <div className="border-2 rounded-lg px-3 py-2.5 text-sm"
                 style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}
                 role="alert">{err}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 transition-colors duration-150 hover:bg-[#E0AE30]"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────── */
export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [apiErr, setApiErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr('');
    try {
      const r = await getCategories();
      setCategories(r.categories || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    if (editTarget?.id) {
      await updateCategory(editTarget.id, data);
    } else {
      await createCategory(data);
    }
    await load();
  };

  const handleDelete = async () => {
    await deleteCategory(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  };

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <Tag size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Categories</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">Organise your menu with colour-coded categories.</p>

      {/* Page-level card */}
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
           style={{ boxShadow: 'var(--shadow-xl)' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b-2 border-[#1A1A1A]"
             style={{ background: '#F5F0E8' }}>
          <span className="text-sm font-bold text-[#1A1A1A]">{categories.length} categories</span>
          <button onClick={() => setEditTarget({})}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors duration-150"
                  style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
            <Plus size={15} strokeWidth={2} /> Add category
          </button>
        </div>

        {apiErr && (
          <div className="border-b-2 border-[#EF4444] px-4 py-2.5 text-sm"
               style={{ background: '#FEF2F2', color: '#EF4444' }} role="alert">{apiErr}</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
                <th className="text-left text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Color</th>
                <th className="text-left text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Name</th>
                <th className="text-right text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-[#1A1A1A] mb-1">No categories yet</p>
                    <p className="text-xs text-[#6B7280] mb-4">Add your first category to organise the menu.</p>
                    <button onClick={() => setEditTarget({})}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors duration-150"
                            style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
                      <Plus size={14} strokeWidth={2} /> Add category
                    </button>
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-[#E5E7EB] hover:bg-[#F5F0E8] transition-colors">
                    <td className="px-4 py-3">
                      <span className="w-5 h-5 rounded-full inline-block border-2 border-[#1A1A1A]"
                            style={{ background: c.color || '#E5E7EB' }} />
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1A1A1A]">{c.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button aria-label={`Edit ${c.name}`} onClick={() => setEditTarget(c)}
                                className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#F5F0E8] transition-colors duration-150">
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        <button aria-label={`Delete ${c.name}`} onClick={() => setDeleteTarget(c)}
                                className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#FEF2F2] transition-colors duration-150">
                          <Trash2 size={13} strokeWidth={2} style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget !== null && (
        <CategoryModal initial={editTarget?.id ? editTarget : null} onSave={handleSave} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <ConfirmModal category={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
