import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../../shared/api/coupons.api.js';
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '../../../shared/api/promotions.api.js';
import { request } from '../../../shared/api/client.js';

/* ── shared style constants ────────────────────────────── */
const inputCls = 'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white text-[#1A1A1A] transition-colors duration-150 focus:outline-none';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[#1A1A1A]';

/* ── skeleton row ──────────────────────────────────────── */
function SkeletonRow({ cols }) {
  return (
    <tr className="border-b border-[#E5E7EB]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ background: '#E5E7EB', width: i === 0 ? '60%' : '40%' }} />
        </td>
      ))}
    </tr>
  );
}

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
        <h2 className="text-lg font-black mb-2 text-[#1A1A1A]">Delete?</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          "<strong>{name}</strong>" will be removed permanently.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
          <button onClick={onConfirm}
                  className="bg-[#EF4444] text-white font-bold text-sm rounded-lg px-4 py-2.5 border-2 border-[#1A1A1A] hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── coupon modal ─────────────────────────────────────── */
const EMPTY_COUPON = { code: '', discount_type: 'percentage', discount_value: '', is_active: true };

function CouponModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_COUPON);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
      await onSave({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        ...(initial ? { is_active: form.is_active } : {}),
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
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5 text-[#1A1A1A]">
          {initial ? 'Edit coupon' : 'New coupon code'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Code */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Code *</label>
            <input className={inputCls} value={form.code} onChange={set('code')} required
                   placeholder="e.g. WELCOME10"
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Type *</label>
              <select className={inputCls} value={form.discount_type} onChange={set('discount_type')}
                      style={{ borderColor: '#E5E7EB' }}
                      onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Value *</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.discount_value}
                     onChange={set('discount_value')} required
                     placeholder={form.discount_type === 'percentage' ? '10' : '150'}
                     style={{ borderColor: '#E5E7EB' }}
                     onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                     onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
            </div>
          </div>

          {/* Status — only when editing */}
          {initial && (
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
          )}

          {err && <div className="border-2 rounded-lg px-3 py-2.5 text-sm"
                       style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}>{err}</div>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
                    className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (initial ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── promotion modal ──────────────────────────────────── */
const EMPTY_PROMO = {
  name: '', applies_to: 'product', product_id: '', min_quantity: '',
  min_order_amount: '', discount_type: 'percentage', discount_value: '', is_active: true,
};

function PromoModal({ initial, products, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_PROMO);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
      await onSave({
        name: form.name.trim(),
        applies_to: form.applies_to,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        product_id: form.applies_to === 'product' && form.product_id ? parseInt(form.product_id, 10) : null,
        min_quantity: form.applies_to === 'product' && form.min_quantity ? parseInt(form.min_quantity, 10) : null,
        min_order_amount: form.applies_to === 'order' && form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        ...(initial ? { is_active: form.is_active } : {}),
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
         style={{ background: 'rgba(26,26,26,0.5)' }} onClick={onClose}>
      <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
           style={{ boxShadow: 'var(--shadow-modal)' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black mb-5 text-[#1A1A1A]">
          {initial ? 'Edit promotion' : 'New promotion'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Campaign name *</label>
            <input className={inputCls} value={form.name} onChange={set('name')} required
                   placeholder="e.g. Buy 2 Espressos, Get 10% Off"
                   style={{ borderColor: '#E5E7EB' }}
                   onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                   onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
          </div>

          {/* Applies to */}
          <div className="flex flex-col gap-1">
            <label className={labelCls}>Trigger type *</label>
            <select className={inputCls} value={form.applies_to} onChange={set('applies_to')}
                    style={{ borderColor: '#E5E7EB' }}
                    onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
              <option value="product">Specific product quantity</option>
              <option value="order">Order total amount</option>
            </select>
          </div>

          {/* Product-specific fields */}
          {form.applies_to === 'product' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Product *</label>
                <select className={inputCls} value={form.product_id} onChange={set('product_id')} required
                        style={{ borderColor: '#E5E7EB' }}
                        onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                        onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
                  <option value="">— Select —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelCls}>Min qty *</label>
                <input className={inputCls} type="number" min="1" value={form.min_quantity}
                       onChange={set('min_quantity')} required placeholder="2"
                       style={{ borderColor: '#E5E7EB' }}
                       onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                       onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
              </div>
            </div>
          )}

          {/* Order-specific fields */}
          {form.applies_to === 'order' && (
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Min cart total (₹) *</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.min_order_amount}
                     onChange={set('min_order_amount')} required placeholder="500.00"
                     style={{ borderColor: '#E5E7EB' }}
                     onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                     onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
            </div>
          )}

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Reward type *</label>
              <select className={inputCls} value={form.discount_type} onChange={set('discount_type')}
                      style={{ borderColor: '#E5E7EB' }}
                      onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                      onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Value *</label>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.discount_value}
                     onChange={set('discount_value')} required placeholder="10"
                     style={{ borderColor: '#E5E7EB' }}
                     onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                     onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')} />
            </div>
          </div>

          {/* Status — only when editing */}
          {initial && (
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
          )}

          {err && <div className="border-2 rounded-lg px-3 py-2.5 text-sm"
                       style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}>{err}</div>}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
                    className="text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)', opacity: saving ? 0.7 : 1 }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : (initial ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── status badge helper ───────────────────────────────── */
function StatusBadge({ active }) {
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={active
            ? { background: '#D1FAE5', color: '#065F46' }
            : { background: '#F3F4F6', color: '#6B7280' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ── action buttons ────────────────────────────────────── */
function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button onClick={onEdit} aria-label="Edit"
              className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#F5F0E8] transition-colors">
        <Pencil size={13} strokeWidth={2} />
      </button>
      <button onClick={onDelete} aria-label="Delete"
              className="w-8 h-8 rounded-lg border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#FEF2F2] transition-colors">
        <Trash2 size={13} strokeWidth={2} style={{ color: '#EF4444' }} />
      </button>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────── */
export default function CouponsPromotions() {
  const [tab, setTab]             = useState('coupons');
  const [coupons, setCoupons]     = useState([]);
  const [promos, setPromos]       = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiErr, setApiErr]       = useState('');

  // modal state: null | {} (add) | row (edit)
  const [couponModal,  setCouponModal]  = useState(null);
  const [promoModal,   setPromoModal]   = useState(null);
  const [deleteModal,  setDeleteModal]  = useState(null); // { id, name, type }

  const load = useCallback(async () => {
    setLoading(true);
    setApiErr('');
    try {
      const [c, p, pr] = await Promise.all([
        getCoupons(),
        getPromotions(),
        request('/products'),
      ]);
      setCoupons(c.coupons || []);
      setPromos(p.promotions || []);
      setProducts(pr.products || []);
    } catch (e) {
      setApiErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── coupon CRUD ── */
  const saveCoupon = async (data) => {
    if (couponModal?.id) await updateCoupon(couponModal.id, data);
    else                  await createCoupon(data);
    await load();
  };

  const confirmDeleteCoupon = async () => {
    await deleteCoupon(deleteModal.id);
    setDeleteModal(null);
    await load();
  };

  /* ── promo CRUD ── */
  const savePromo = async (data) => {
    if (promoModal?.id) await updatePromotion(promoModal.id, data);
    else                 await createPromotion(data);
    await load();
  };

  const confirmDeletePromo = async () => {
    await deletePromotion(deleteModal.id);
    setDeleteModal(null);
    await load();
  };

  return (
    <div>
      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
             style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
          <Ticket size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Coupons &amp; Promotions</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-6 ml-12">
        Manage manual discount codes and automated promotion rules applied at checkout.
      </p>

      {/* API error */}
      {apiErr && (
        <div className="border-2 rounded-xl px-4 py-3 text-sm mb-4"
             style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }} role="alert">
          {apiErr}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {[
          { key: 'coupons',    label: 'Coupon Codes' },
          { key: 'promotions', label: 'Automated Promotions' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
                  className="px-4 py-2 rounded-lg border-2 text-sm font-bold transition-colors duration-150"
                  style={tab === key
                    ? { background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }
                    : { background: '#fff', borderColor: '#1A1A1A', color: '#6B7280' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Coupons tab ── */}
      {tab === 'coupons' && (
        <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
             style={{ boxShadow: 'var(--shadow-xl)' }}>
          {/* toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1A1A1A]"
               style={{ background: '#F5F0E8' }}>
            <span className="text-sm font-bold text-[#1A1A1A]">
              {coupons.length} code{coupons.length !== 1 ? 's' : ''}
            </span>
            <button onClick={() => setCouponModal({})}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
              <Plus size={14} strokeWidth={2} /> Add coupon
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
                {['Code', 'Type', 'Value', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A] ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                : coupons.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-[#1A1A1A] mb-1">No coupon codes yet</p>
                    <p className="text-xs text-[#6B7280] mb-4">Create your first discount code for checkout.</p>
                    <button onClick={() => setCouponModal({})}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                            style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
                      <Plus size={14} strokeWidth={2} /> Add coupon
                    </button>
                  </td></tr>
                ) : coupons.map((c) => (
                  <tr key={c.id} className="border-b border-[#E5E7EB] hover:bg-[#F5F0E8] transition-colors">
                    <td className="px-4 py-3 font-mono font-black text-[#1A1A1A]">{c.code}</td>
                    <td className="px-4 py-3 text-[#6B7280] capitalize">{c.discount_type}</td>
                    <td className="px-4 py-3 font-mono text-[#1A1A1A]">
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${parseFloat(c.discount_value).toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-right"><StatusBadge active={c.is_active} /></td>
                    <td className="px-4 py-3">
                      <ActionButtons
                        onEdit={() => setCouponModal(c)}
                        onDelete={() => setDeleteModal({ id: c.id, name: c.code, type: 'coupon' })}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Promotions tab ── */}
      {tab === 'promotions' && (
        <div className="bg-white border-2 border-[#1A1A1A] rounded-2xl overflow-hidden"
             style={{ boxShadow: 'var(--shadow-xl)' }}>
          {/* toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1A1A1A]"
               style={{ background: '#F5F0E8' }}>
            <span className="text-sm font-bold text-[#1A1A1A]">
              {promos.length} rule{promos.length !== 1 ? 's' : ''}
            </span>
            <button onClick={() => setPromoModal({})}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                    style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
              <Plus size={14} strokeWidth={2} /> Add promotion
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F5F0E8] border-b-2 border-[#1A1A1A]">
                {['Name', 'Trigger', 'Reward', 'Status', 'Actions'].map((h, i) => (
                  <th key={h} className={`text-xs font-bold uppercase tracking-wide px-4 py-3 text-[#1A1A1A] ${i >= 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                : promos.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-bold text-[#1A1A1A] mb-1">No promotions yet</p>
                    <p className="text-xs text-[#6B7280] mb-4">Add an automated rule to apply discounts at checkout.</p>
                    <button onClick={() => setPromoModal({})}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black border-2 hover:bg-[#E0AE30] transition-colors"
                            style={{ background: '#F5C142', borderColor: '#1A1A1A', color: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
                      <Plus size={14} strokeWidth={2} /> Add promotion
                    </button>
                  </td></tr>
                ) : promos.map((p) => {
                  const prod = products.find((x) => x.id === p.product_id);
                  const trigger = p.applies_to === 'product'
                    ? `${prod?.name || `Product #${p.product_id}`} × ${p.min_quantity}`
                    : `Cart ≥ ₹${parseFloat(p.min_order_amount).toFixed(0)}`;
                  const reward = p.discount_type === 'percentage'
                    ? `${p.discount_value}% off`
                    : `₹${parseFloat(p.discount_value).toFixed(2)} off`;
                  return (
                    <tr key={p.id} className="border-b border-[#E5E7EB] hover:bg-[#F5F0E8] transition-colors">
                      <td className="px-4 py-3 font-bold text-[#1A1A1A]">{p.name}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{trigger}</td>
                      <td className="px-4 py-3 font-mono text-[#1A1A1A]">{reward}</td>
                      <td className="px-4 py-3 text-right"><StatusBadge active={p.is_active} /></td>
                      <td className="px-4 py-3">
                        <ActionButtons
                          onEdit={() => setPromoModal(p)}
                          onDelete={() => setDeleteModal({ id: p.id, name: p.name, type: 'promo' })}
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {couponModal !== null && (
        <CouponModal
          initial={couponModal?.id ? couponModal : null}
          onSave={saveCoupon}
          onClose={() => setCouponModal(null)}
        />
      )}
      {promoModal !== null && (
        <PromoModal
          initial={promoModal?.id ? promoModal : null}
          products={products}
          onSave={savePromo}
          onClose={() => setPromoModal(null)}
        />
      )}
      {deleteModal && (
        <ConfirmModal
          name={deleteModal.name}
          onConfirm={deleteModal.type === 'coupon' ? confirmDeleteCoupon : confirmDeletePromo}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
