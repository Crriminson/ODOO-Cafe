import React, { useState, useEffect } from 'react';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../../../shared/api/customers.api.js';
import useDebounce from '../../../shared/hooks/useDebounce.js';
import { useCustomerStore, customerStore } from '../../../shared/stores/useCustomerStore.js';
import Modal from '../../../shared/components/Modal.jsx';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  Award,
} from 'lucide-react';

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedCustomer = useCustomerStore((s) => s.selectedCustomer);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formError, setFormError] = useState('');
  const [formFields, setFormFields] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Fetch customers when debounced search query changes
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getCustomers({ search: debouncedSearch });
        setCustomers(response.customers || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch customers');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [debouncedSearch]);

  const handleSelectCustomer = (customer) => {
    customerStore.setSelectedCustomer(customer);
  };

  const handleClearSelected = () => {
    customerStore.clearSelectedCustomer();
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormFields({ id: null, name: '', email: '', phone: '', address: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setModalMode('edit');
    setFormFields({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Prepare payload, ensuring empty strings are converted to null
    const payload = {
      name: formFields.name.trim(),
      email: formFields.email.trim() || null,
      phone: formFields.phone.trim() || null,
      address: formFields.address.trim() || null,
    };

    try {
      if (modalMode === 'create') {
        const response = await createCustomer(payload);
        const newCust = response.customer;
        setCustomers((prev) => [newCust, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const response = await updateCustomer(formFields.id, payload);
        const updatedCust = response.customer;
        setCustomers((prev) =>
          prev.map((c) => (c.id === formFields.id ? updatedCust : c)).sort((a, b) => a.name.localeCompare(b.name))
        );
        // Update selected customer if edited
        if (selectedCustomer && selectedCustomer.id === formFields.id) {
          customerStore.setSelectedCustomer(updatedCust);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        setFormError('A customer with this email already exists.');
      } else if (err.fields) {
        setFormError(err.fields.map((f) => `${f.field}: ${f.message}`).join(', '));
      } else {
        setFormError(err.message || 'Operation failed. Please try again.');
      }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"? This action is permanent.`)) {
      return;
    }
    setError('');
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomer && selectedCustomer.id === id) {
        handleClearSelected();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete customer');
    }
  };

  const styles = {
    container: {
      backgroundColor: '#F5F0E8',
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: "'Outfit', 'Inter', sans-serif",
      color: '#1A1A1A',
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      borderBottom: '3px solid #1A1A1A',
      paddingBottom: '20px',
      gap: '20px',
      flexWrap: 'wrap',
    },
    titleSection: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '36px',
      fontWeight: '900',
      textTransform: 'uppercase',
      margin: 0,
      letterSpacing: '-1px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#666',
      margin: '4px 0 0 0',
    },
    addButton: {
      backgroundColor: '#714867',
      color: '#1A1A1A',
      border: '3px solid #1A1A1A',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '800',
      textTransform: 'uppercase',
      cursor: 'pointer',
      boxShadow: '4px 4px 0px #1A1A1A',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'transform 0.1s, box-shadow 0.1s',
    },
    activeSelection: {
      backgroundColor: '#714867',
      border: '3px solid #1A1A1A',
      boxShadow: '6px 6px 0px #1A1A1A',
      padding: '20px',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap',
    },
    activeInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    activeText: {
      fontSize: '18px',
      fontWeight: '800',
      margin: 0,
    },
    activePoints: {
      fontSize: '14px',
      fontWeight: 'bold',
      backgroundColor: '#1A1A1A',
      color: '#FFF',
      padding: '4px 8px',
      borderRadius: '0px',
    },
    clearActiveBtn: {
      backgroundColor: '#F5F0E8',
      color: '#1A1A1A',
      border: '2px solid #1A1A1A',
      padding: '8px 16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px #1A1A1A',
    },
    searchContainer: {
      position: 'relative',
      marginBottom: '30px',
    },
    searchInput: {
      width: '100%',
      padding: '16px 20px 16px 50px',
      fontSize: '18px',
      border: '3px solid #1A1A1A',
      borderRadius: '0px',
      boxShadow: '4px 4px 0px #1A1A1A',
      backgroundColor: '#FFF',
      color: '#1A1A1A',
      fontFamily: "'Inter', sans-serif",
      boxSizing: 'border-box',
    },
    searchIcon: {
      position: 'absolute',
      left: '18px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#1A1A1A',
    },
    errorBanner: {
      backgroundColor: '#FF6B6B',
      color: '#FFF',
      border: '3px solid #1A1A1A',
      padding: '12px 20px',
      marginBottom: '20px',
      fontWeight: 'bold',
      boxShadow: '4px 4px 0px #1A1A1A',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '24px',
    },
    card: {
      backgroundColor: '#FFF',
      border: '3px solid #1A1A1A',
      boxShadow: '6px 6px 0px #1A1A1A',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '200px',
      position: 'relative',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '16px',
    },
    custName: {
      fontSize: '22px',
      fontWeight: '900',
      margin: 0,
      textTransform: 'uppercase',
      lineHeight: '1.2',
    },
    pointsBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#1A1A1A',
      color: '#714867',
      padding: '6px 10px',
      fontSize: '13px',
      fontWeight: '800',
      whiteSpace: 'nowrap',
    },
    details: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '24px',
      fontSize: '14px',
      color: '#444',
    },
    detailItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    actions: {
      display: 'flex',
      gap: '10px',
      marginTop: 'auto',
    },
    selectBtn: {
      flex: 1,
      backgroundColor: '#714867',
      color: '#1A1A1A',
      border: '2px solid #1A1A1A',
      padding: '8px 12px',
      fontWeight: '800',
      fontSize: '13px',
      textTransform: 'uppercase',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      boxShadow: '2px 2px 0px #1A1A1A',
    },
    selectedIndicator: {
      flex: 1,
      backgroundColor: '#1A1A1A',
      color: '#FFF',
      border: '2px solid #1A1A1A',
      padding: '8px 12px',
      fontWeight: '800',
      fontSize: '13px',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    editBtn: {
      backgroundColor: '#FFF',
      color: '#1A1A1A',
      border: '2px solid #1A1A1A',
      padding: '8px',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px #1A1A1A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtn: {
      backgroundColor: '#FFF',
      color: '#FF6B6B',
      border: '2px solid #1A1A1A',
      padding: '8px',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px #1A1A1A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
    formLabel: {
      fontWeight: '800',
      fontSize: '14px',
      textTransform: 'uppercase',
    },
    formInput: {
      padding: '10px 12px',
      border: '2px solid #1A1A1A',
      fontSize: '15px',
      fontFamily: "'Inter', sans-serif",
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '10px',
    },
    formSubmitBtn: {
      flex: 1,
      backgroundColor: '#714867',
      color: '#1A1A1A',
      border: '2px solid #1A1A1A',
      padding: '12px',
      fontSize: '15px',
      fontWeight: '800',
      textTransform: 'uppercase',
      cursor: 'pointer',
      boxShadow: '2px 2px 0px #1A1A1A',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.titleSection}>
            <h1 style={styles.title}>Customer Database</h1>
            <p style={styles.subtitle}>Search, select, and manage POS customer accounts and loyalty points.</p>
          </div>
          <button style={styles.addButton} onClick={openCreateModal}>
            <UserPlus size={18} /> Add Customer
          </button>
        </header>

        {/* Selected Customer Banner */}
        {selectedCustomer && (
          <div style={styles.activeSelection}>
            <div style={styles.activeInfo}>
              <UserCheck size={24} />
              <div>
                <h3 style={styles.activeText}>
                  Linked: {selectedCustomer.name}
                </h3>
                <span style={styles.activePoints}>
                  {selectedCustomer.loyalty_points} Loyalty Points
                </span>
              </div>
            </div>
            <button style={styles.clearActiveBtn} onClick={handleClearSelected}>
              Deselect Customer
            </button>
          </div>
        )}

        {/* Search */}
        <div style={styles.searchContainer}>
          <Search style={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Loading / Results Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>
            Fetching customer database...
          </div>
        ) : (
          <div style={styles.grid}>
            {customers.map((customer) => {
              const isLinked = selectedCustomer && selectedCustomer.id === customer.id;
              return (
                <div key={customer.id} style={styles.card}>
                  <div>
                    <div style={styles.cardHeader}>
                      <h2 style={styles.custName}>{customer.name}</h2>
                      <div style={styles.pointsBadge}>
                        <Award size={14} /> {customer.loyalty_points} PTS
                      </div>
                    </div>

                    <div style={styles.details}>
                      {customer.email && (
                        <div style={styles.detailItem}>
                          <Mail size={14} />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div style={styles.detailItem}>
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div style={styles.detailItem}>
                          <MapPin size={14} />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={styles.actions}>
                    {isLinked ? (
                      <div style={styles.selectedIndicator}>
                        <CheckCircle size={14} /> Linked
                      </div>
                    ) : (
                      <button
                        style={styles.selectBtn}
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        Link to Order
                      </button>
                    )}
                    <button
                      style={styles.editBtn}
                      onClick={() => openEditModal(customer)}
                      title="Edit Profile"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(customer.id, customer.name)}
                      title="Delete Customer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {!loading && customers.length === 0 && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '60px',
                  backgroundColor: '#FFF',
                  border: '3px solid #1A1A1A',
                  boxShadow: '4px 4px 0px #1A1A1A',
                  fontWeight: 'bold',
                }}
              >
                No customers found matching "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal - uses P1's shared Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Customer Account' : 'Edit Customer Account'}
      >
        <form onSubmit={handleFormSubmit} style={styles.form}>
          {formError && (
            <div style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: '14px' }}>
              {formError}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formFields.name}
              onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email Address</label>
            <input
              type="email"
              placeholder="e.g. john@example.com"
              value={formFields.email}
              onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. +1234567890"
              value={formFields.phone}
              onChange={(e) => setFormFields({ ...formFields, phone: e.target.value })}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Billing/Delivery Address</label>
            <textarea
              placeholder="e.g. 123 Cafe Street, Coffee Town"
              value={formFields.address}
              onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
              style={{ ...styles.formInput, height: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.formSubmitBtn}>
              {modalMode === 'create' ? 'Create Profile' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

