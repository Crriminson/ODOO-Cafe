// TODO: Replace inline form/table with P1's Modal and DataTable components
// once client/src/admin/components/Modal.jsx and DataTable.jsx are implemented.

import React, { useState, useEffect } from 'react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../../shared/api/coupons.api.js';
import { getPromotions, createPromotion, updatePromotion, deletePromotion } from '../../../shared/api/promotions.api.js';
import api from '../../../shared/api/client.js';

export default function CouponsPromotions() {
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'promotions'
  const [coupons, setCoupons] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon Form State
  const [couponForm, setCouponForm] = useState({
    id: null,
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    is_active: true,
  });

  // Promotion Form State
  const [promoForm, setPromoForm] = useState({
    id: null,
    name: '',
    applies_to: 'product',
    product_id: '',
    min_quantity: '',
    min_order_amount: '',
    discount_type: 'percentage',
    discount_value: '',
    is_active: true,
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const couponsData = await getCoupons();
      setCoupons(couponsData.coupons || []);

      const promotionsData = await getPromotions();
      setPromotions(promotionsData.promotions || []);

      // Fetch products for promotion selectors
      const productsData = await api.get('/products');
      setProducts(productsData.products || []);
    } catch (err) {
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Coupon Submit
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        code: couponForm.code,
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
      };

      if (couponForm.id) {
        payload.is_active = couponForm.is_active;
        await updateCoupon(couponForm.id, payload);
      } else {
        await createCoupon(payload);
      }

      // Reset form and reload
      setCouponForm({ id: null, code: '', discount_type: 'percentage', discount_value: '', is_active: true });
      fetchData();
    } catch (err) {
      setError(err.message || 'Action failed.');
    }
  };

  // Handle Promotion Submit
  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: promoForm.name,
        applies_to: promoForm.applies_to,
        discount_type: promoForm.discount_type,
        discount_value: parseFloat(promoForm.discount_value),
        product_id: promoForm.applies_to === 'product' && promoForm.product_id ? parseInt(promoForm.product_id, 10) : null,
        min_quantity: promoForm.applies_to === 'product' && promoForm.min_quantity ? parseInt(promoForm.min_quantity, 10) : null,
        min_order_amount: promoForm.applies_to === 'order' && promoForm.min_order_amount ? parseFloat(promoForm.min_order_amount) : null,
      };

      if (promoForm.id) {
        payload.is_active = promoForm.is_active;
        await updatePromotion(promoForm.id, payload);
      } else {
        await createPromotion(payload);
      }

      setPromoForm({
        id: null,
        name: '',
        applies_to: 'product',
        product_id: '',
        min_quantity: '',
        min_order_amount: '',
        discount_type: 'percentage',
        discount_value: '',
        is_active: true,
      });
      fetchData();
    } catch (err) {
      setError(err.message || 'Action failed.');
    }
  };

  const handleEditCoupon = (coupon) => {
    setCouponForm({
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      is_active: coupon.is_active,
    });
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete coupon.');
    }
  };

  const handleEditPromo = (promo) => {
    setPromoForm({
      id: promo.id,
      name: promo.name,
      applies_to: promo.applies_to,
      product_id: promo.product_id || '',
      min_quantity: promo.min_quantity || '',
      min_order_amount: promo.min_order_amount || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      is_active: promo.is_active,
    });
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await deletePromotion(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete promotion.');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Discounts & Campaigns</h1>
        <p style={styles.subtitle}>Manage manual coupon codes and automated kitchen promotions.</p>
      </header>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          onClick={() => setActiveTab('coupons')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'coupons' ? styles.activeTabButton : {}),
          }}
        >
          Coupon Codes
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          style={{
            ...styles.tabButton,
            ...(activeTab === 'promotions' ? styles.activeTabButton : {}),
          }}
        >
          Automated Promotions
        </button>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}
      {loading && <div style={styles.loadingBanner}>Loading data...</div>}

      {/* Coupon Panel */}
      {activeTab === 'coupons' && (
        <div style={styles.panelGrid}>
          {/* List Table */}
          <div style={styles.tableCard}>
            <h2 style={styles.cardHeader}>Active Coupons</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Value</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={styles.tdEmpty}>No coupons defined yet.</td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} style={styles.tr}>
                      <td style={styles.td}><strong>{coupon.code}</strong></td>
                      <td style={styles.td}>{coupon.discount_type}</td>
                      <td style={styles.td}>
                        {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                      </td>
                      <td style={styles.td}>
                        <span style={coupon.is_active ? styles.statusActive : styles.statusInactive}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleEditCoupon(coupon)} style={styles.actionEdit}>Edit</button>
                        <button onClick={() => handleDeleteCoupon(coupon.id)} style={styles.actionDelete}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Form */}
          <div style={styles.formCard}>
            <h2 style={styles.cardHeader}>{couponForm.id ? 'Edit Coupon' : 'Create New Coupon'}</h2>
            <form onSubmit={handleCouponSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Coupon Code</label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  placeholder="e.g. WELCOME10"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Discount Type</label>
                <select
                  value={couponForm.discount_type}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                  style={styles.select}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={couponForm.discount_value}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })}
                  placeholder={couponForm.discount_type === 'percentage' ? 'e.g. 10' : 'e.g. 150'}
                  style={styles.input}
                  required
                />
              </div>

              {couponForm.id && (
                <div style={styles.formGroupRow}>
                  <input
                    type="checkbox"
                    id="coupon_is_active"
                    checked={couponForm.is_active}
                    onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <label htmlFor="coupon_is_active" style={styles.checkboxLabel}>Active / Available at Checkout</label>
                </div>
              )}

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  {couponForm.id ? 'Update Coupon' : 'Create Coupon'}
                </button>
                {couponForm.id && (
                  <button
                    type="button"
                    onClick={() => setCouponForm({ id: null, code: '', discount_type: 'percentage', discount_value: '', is_active: true })}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promotion Panel */}
      {activeTab === 'promotions' && (
        <div style={styles.panelGrid}>
          {/* List Table */}
          <div style={styles.tableCard}>
            <h2 style={styles.cardHeader}>Campaign Rules</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Applies To</th>
                  <th style={styles.th}>Trigger Rule</th>
                  <th style={styles.th}>Reward</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.tdEmpty}>No promotions defined yet.</td>
                  </tr>
                ) : (
                  promotions.map((promo) => (
                    <tr key={promo.id} style={styles.tr}>
                      <td style={styles.td}><strong>{promo.name}</strong></td>
                      <td style={styles.td}>{promo.applies_to}</td>
                      <td style={styles.td}>
                        {promo.applies_to === 'product' ? (
                          <span>
                            Product: {products.find(p => p.id === promo.product_id)?.name || `ID ${promo.product_id}`} (Qty &ge; {promo.min_quantity})
                          </span>
                        ) : (
                          <span>Cart Total &ge; ₹{promo.min_order_amount}</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {promo.discount_type === 'percentage' ? `${promo.discount_value}% Off` : `₹${promo.discount_value} Off`}
                      </td>
                      <td style={styles.td}>
                        <span style={promo.is_active ? styles.statusActive : styles.statusInactive}>
                          {promo.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleEditPromo(promo)} style={styles.actionEdit}>Edit</button>
                        <button onClick={() => handleDeletePromo(promo.id)} style={styles.actionDelete}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Form */}
          <div style={styles.formCard}>
            <h2 style={styles.cardHeader}>{promoForm.id ? 'Edit Campaign' : 'Create Campaign'}</h2>
            <form onSubmit={handlePromoSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Campaign Name</label>
                <input
                  type="text"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  placeholder="e.g. Buy 2 Espressos, Get 10% Off"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Trigger Type (Applies To)</label>
                <select
                  value={promoForm.applies_to}
                  onChange={(e) => setPromoForm({ ...promoForm, applies_to: e.target.value })}
                  style={styles.select}
                >
                  <option value="product">Specific Product Quantity</option>
                  <option value="order">Order Total Amount</option>
                </select>
              </div>

              {/* Conditional Fields: Product */}
              {promoForm.applies_to === 'product' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Target Product</label>
                    <select
                      value={promoForm.product_id}
                      onChange={(e) => setPromoForm({ ...promoForm, product_id: e.target.value })}
                      style={styles.select}
                      required
                    >
                      <option value="">-- Select Product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Minimum Quantity Required</label>
                    <input
                      type="number"
                      value={promoForm.min_quantity}
                      onChange={(e) => setPromoForm({ ...promoForm, min_quantity: e.target.value })}
                      placeholder="e.g. 2"
                      style={styles.input}
                      required
                    />
                  </div>
                </>
              )}

              {/* Conditional Fields: Order Total */}
              {promoForm.applies_to === 'order' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Minimum Cart Total (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={promoForm.min_order_amount}
                    onChange={(e) => setPromoForm({ ...promoForm, min_order_amount: e.target.value })}
                    placeholder="e.g. 500.00"
                    style={styles.input}
                    required
                  />
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Discount Type</label>
                <select
                  value={promoForm.discount_type}
                  onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                  style={styles.select}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Discount Reward Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={promoForm.discount_value}
                  onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                  placeholder="e.g. 10"
                  style={styles.input}
                  required
                />
              </div>

              {promoForm.id && (
                <div style={styles.formGroupRow}>
                  <input
                    type="checkbox"
                    id="promo_is_active"
                    checked={promoForm.is_active}
                    onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <label htmlFor="promo_is_active" style={styles.checkboxLabel}>Active / Evaluate in Engine</label>
                </div>
              )}

              <div style={styles.formActions}>
                <button type="submit" style={styles.submitButton}>
                  {promoForm.id ? 'Update Campaign' : 'Create Campaign'}
                </button>
                {promoForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setPromoForm({
                        id: null,
                        name: '',
                        applies_to: 'product',
                        product_id: '',
                        min_quantity: '',
                        min_order_amount: '',
                        discount_type: 'percentage',
                        discount_value: '',
                        is_active: true,
                      })
                    }
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    color: '#E0E0E0',
    backgroundColor: '#0F0F13',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '35px',
    borderBottom: '1px solid #23232A',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#FFFFFF',
    background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#8A8A9E',
  },
  tabsContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '30px',
    borderBottom: '2px solid #23232A',
    paddingBottom: '8px',
  },
  tabButton: {
    background: 'transparent',
    border: 'none',
    color: '#8A8A9E',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.3s ease',
  },
  activeTabButton: {
    color: '#4facfe',
    borderBottom: '3px solid #4facfe',
    background: 'rgba(79, 172, 254, 0.05)',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)',
    border: '1px solid #EF5350',
    color: '#FF8A80',
    padding: '14px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.95rem',
  },
  loadingBanner: {
    color: '#4facfe',
    marginBottom: '20px',
    fontSize: '0.95rem',
  },
  panelGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '30px',
  },
  tableCard: {
    backgroundColor: '#16161E',
    borderRadius: '12px',
    border: '1px solid #23232A',
    padding: '24px',
    overflowX: 'auto',
  },
  formCard: {
    backgroundColor: '#16161E',
    borderRadius: '12px',
    border: '1px solid #23232A',
    padding: '24px',
    height: 'fit-content',
  },
  cardHeader: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    color: '#8A8A9E',
    fontWeight: '600',
    padding: '12px 16px',
    borderBottom: '2px solid #23232A',
    fontSize: '0.9rem',
  },
  tr: {
    borderBottom: '1px solid #23232A',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '16px',
    fontSize: '0.95rem',
  },
  tdEmpty: {
    padding: '40px',
    textAlign: 'center',
    color: '#8A8A9E',
  },
  statusActive: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    color: '#81C784',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  statusInactive: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    backgroundColor: 'rgba(158, 158, 158, 0.15)',
    color: '#B0BEC5',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
  actionEdit: {
    backgroundColor: 'transparent',
    border: '1px solid #4facfe',
    color: '#4facfe',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  actionDelete: {
    backgroundColor: 'transparent',
    border: '1px solid #EF5350',
    color: '#EF5350',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formGroupRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '0.85rem',
    color: '#8A8A9E',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F0F13',
    border: '1px solid #23232A',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '0.95rem',
    outline: 'none',
  },
  select: {
    backgroundColor: '#0F0F13',
    border: '1px solid #23232A',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#FFFFFF',
    fontSize: '0.95rem',
    outline: 'none',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '0.9rem',
    color: '#E0E0E0',
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  submitButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    border: 'none',
    color: '#000000',
    fontWeight: '700',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
  },
  cancelButton: {
    backgroundColor: '#23232A',
    border: 'none',
    color: '#E0E0E0',
    fontWeight: '600',
    padding: '12px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};
