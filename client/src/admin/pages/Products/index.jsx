import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../../shared/api/products.api.js';
import { getCategories } from '../../../shared/api/categories.api.js';

/* ── helpers ─────────────────────────────────────────── */
const fmt = (v) => `₹${parseFloat(v || 0).toFixed(2)}`;

const EMPTY_FORM = { name: '', category_id: '', price: '', is_active: true };

const inputCls =
  'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white transition-colors duration-150 focus:outline-none';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[#1A1A1A]';

/* ── skeleton row ────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-[#E5E7EB]">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded-lg animate-pulse" style={{ background: '#E5E7EB', width: i === 1 ? '60%' : '40%' }} />
        </td>
      ))}
    </tr>
  );
}

/* ── confirm modal ───────────────────────────────────── */
function ConfirmModal({ product, onConfirm, onCancel }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }}
         onClick={onCancel}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }}
           onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-2" style={{ color: '#1A1A1A' }}>Delete product?</h2>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          "<strong>{product.name}</strong>" will be soft-deleted. This can't be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
                  className="text-sm font-medium transition-colors duration-150"
                  style={{ color: '#6B7280' }}
                  onMouseEnter={(e) => (e.target.style.color = '#1A1A1A')}
                  onMouseLeave={(e) => (e.target.style.color = '#6B7280')}>
            Cancel
          </button>
          <button onClick={onConfirm}
                  className="bg-[#EF4444] text-white font-bold text-sm rounded-lg px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-red-600 transition-colors duration-150">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── product form modal ──────────────────────────────── */
function ProductModal({ initial, categories, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await onSave({
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        price: parseFloat(form.price),
        tax_rate: 0,
      });
      onClose();
    } catch (ex) {
      setErr(ex.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
         style={{ background: 'rgba(26,26,26,0.5)' }}
         onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-lg w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }}
           onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5" style={{ color: '#1A1A1A' }}>
          {initial ? 'Edit product' : 'Add product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={form.name} onChange={set('name')} required
                   placeholder="Cappuccino"
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>

          {/* Category + Active row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category_id} onChange={set('category_id')}
                      style={{ borderColor: '#E5E7EB' }}
                      onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
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
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Price (₹) *</label>
            <input className={inputCls} type="number" min="0" step="0.01" value={form.price}
                   onChange={set('price')} required placeholder="120.00"
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>

          {err && (
            <div className="border-2 rounded-lg px-3 py-2.5 text-sm"
                 style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}
                 role="alert">{err}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
                    className="text-sm font-medium transition-colors duration-150"
                    style={{ color: '#6B7280' }}
                    onMouseEnter={(e) => (e.target.style.color = '#1A1A1A')}
                    onMouseLeave={(e) => (e.target.style.color = '#6B7280')}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 transition-colors duration-150"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── main page ───────────────────────────────────────── */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);   // null = closed, {} = new, {...} = edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [apiErr, setApiErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr('');
    try {
      const [pr, cr] = await Promise.all([getProducts(), getCategories()]);
      setProducts(pr.products || []);
      setCategories(cr.categories || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* debounced search filter */
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const handleSave = async (data) => {
    if (editTarget?.id) {
      await updateProduct(editTarget.id, data);
    } else {
      await createProduct(data);
    }
    await load();
  };

  const handleDelete = async () => {
    await deleteProduct(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  };

  return (
    <div>
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <Package size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Products</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">Manage your menu items, prices, and categories.</p>

      {/* Page-level card */}
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
           style={{ boxShadow: 'var(--shadow-xl)' }}>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b-2 border-[#1A1A1A]"
             style={{ background: '#F5F0E8' }}>
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="border-2 rounded-lg pl-8 pr-3 py-2 text-sm w-full bg-white transition-colors duration-150 focus:outline-none"
              style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
              onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Add button */}
          <button
            onClick={() => setEditTarget({})}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 transition-colors duration-150 hover:bg-[#E0AE30]"
            style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
            <Plus size={15} strokeWidth={2} /> Add product
          </button>
        </div>

        {apiErr && (
          <div className="border-b-2 border-[#EF4444] px-4 py-2.5 text-sm"
               style={{ background: '#FEF2F2', color: '#EF4444' }}
               role="alert">{apiErr}</div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
                <th className="text-left text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Name</th>
                <th className="text-left text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Category</th>
                <th className="text-right text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Price (₹)</th>
                <th className="text-center text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Status</th>
                <th className="text-right text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-[#1A1A1A] mb-1">No products yet</p>
                    <p className="text-xs text-[#6B7280] mb-4">Add your first menu item to get started.</p>
                    <button
                      onClick={() => setEditTarget({})}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors duration-150"
                      style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
                      <Plus size={14} strokeWidth={2} /> Add product
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const cat = catMap[p.category_id];
                  return (
                    <tr key={p.id} className="border-b border-[#E5E7EB] hover:bg-[#F5F0E8] transition-colors">
                      <td className="px-4 py-3 font-bold text-[#1A1A1A]">{p.name}</td>
                      <td className="px-4 py-3">
                        {cat ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ background: cat.color || '#E5E7EB' }} />
                            <span className="text-[#1A1A1A]">{cat.name}</span>
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[#1A1A1A]">{fmt(p.price)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                              style={p.is_active
                                ? { background: '#D1FAE5', color: '#065F46' }
                                : { background: '#F3F4F6', color: '#6B7280' }}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button aria-label={`Edit ${p.name}`}
                                  onClick={() => setEditTarget(p)}
                                  className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#F5F0E8] transition-colors duration-150">
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                          <button aria-label={`Delete ${p.name}`}
                                  onClick={() => setDeleteTarget(p)}
                                  className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#FEF2F2] transition-colors duration-150">
                            <Trash2 size={13} strokeWidth={2} style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editTarget !== null && (
        <ProductModal
          initial={editTarget?.id ? editTarget : null}
          categories={categories}
          onSave={handleSave}
          onClose={() => setEditTarget(null)}
        />
      )}
      {deleteTarget && (
        <ConfirmModal
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}



