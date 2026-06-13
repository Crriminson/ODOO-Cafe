import React, { useState, useEffect } from 'react';
import {
  getCooks,
  createCook,
  updateCook,
  deleteCook,
} from '../../../shared/api/cooks.api.js';
import { getCategories } from '../../../shared/api/categories.api.js';
import Modal from '../../../shared/components/Modal.jsx';
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  Coffee,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function Cooks() {
  const [cooks, setCooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Active Status
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formError, setFormError] = useState('');
  const [formFields, setFormFields] = useState({
    id: null,
    name: '',
    category_preferences: [], // array of category IDs
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const cooksData = await getCooks();
      setCooks(cooksData.cooks || []);

      const catsData = await getCategories();
      setCategories(catsData.categories || []);
    } catch (err) {
      setError(err.message || 'Failed to load cooks or categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormFields({ id: null, name: '', category_preferences: [], is_active: true });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cook) => {
    setModalMode('edit');
    setFormFields({
      id: cook.id,
      name: cook.name,
      category_preferences: cook.category_preferences.map((c) => c.id),
      is_active: cook.is_active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const toggleCategorySelection = (categoryId) => {
    setFormFields((prev) => {
      const current = prev.category_preferences;
      if (current.includes(categoryId)) {
        return { ...prev, category_preferences: current.filter((id) => id !== categoryId) };
      } else {
        return { ...prev, category_preferences: [...current, categoryId] };
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: formFields.name.trim(),
      category_preferences: formFields.category_preferences,
    };

    try {
      if (modalMode === 'create') {
        await createCook(payload);
      } else {
        payload.is_active = formFields.is_active;
        await updateCook(formFields.id, payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      if (err.fields) {
        setFormError(err.fields.map((f) => `${f.field}: ${f.message}`).join(', '));
      } else {
        setFormError(err.message || 'Action failed. Please check inputs.');
      }
    }
  };

  const handleToggleActive = async (cook) => {
    setError('');
    try {
      await updateCook(cook.id, {
        name: cook.name,
        is_active: !cook.is_active,
      });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to toggle active status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete kitchen profile for "${name}"? This will archive them.`)) {
      return;
    }
    setError('');
    try {
      await deleteCook(id);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete cook');
    }
  };

  // Filter cooks client-side by search and active status
  const filteredCooks = cooks.filter((cook) => {
    const matchesSearch = cook.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && cook.is_active) ||
      (statusFilter === 'inactive' && !cook.is_active);
    return matchesSearch && matchesStatus;
  });

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
      backgroundColor: '#F5C142',
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
    toolbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '20px',
      marginBottom: '30px',
      flexWrap: 'wrap',
    },
    searchWrapper: {
      position: 'relative',
      flex: 1,
      minWidth: '280px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 16px 12px 42px',
      fontSize: '16px',
      border: '2px solid #1A1A1A',
      borderRadius: '0px',
      backgroundColor: '#FFF',
      boxShadow: '3px 3px 0px #1A1A1A',
      boxSizing: 'border-box',
    },
    searchIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
    },
    filterTabs: {
      display: 'flex',
      border: '2px solid #1A1A1A',
      boxShadow: '3px 3px 0px #1A1A1A',
    },
    filterTab: {
      backgroundColor: '#FFF',
      border: 'none',
      borderRight: '2px solid #1A1A1A',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      textTransform: 'uppercase',
    },
    activeFilterTab: {
      backgroundColor: '#F5C142',
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
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
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
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '16px',
      gap: '10px',
    },
    cookName: {
      fontSize: '22px',
      fontWeight: '900',
      textTransform: 'uppercase',
      margin: 0,
    },
    statusBadge: {
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      border: '2px solid #1A1A1A',
    },
    prefsTitle: {
      fontSize: '13px',
      fontWeight: '800',
      textTransform: 'uppercase',
      color: '#666',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    chipsContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '24px',
    },
    chip: {
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: 'bold',
      border: '2px solid #1A1A1A',
      color: '#1A1A1A',
    },
    cardActions: {
      display: 'flex',
      gap: '10px',
      marginTop: 'auto',
      borderTop: '2px solid #1A1A1A',
      paddingTop: '16px',
    },
    actionBtn: {
      flex: 1,
      backgroundColor: '#FFF',
      color: '#1A1A1A',
      border: '2px solid #1A1A1A',
      padding: '8px 12px',
      fontWeight: 'bold',
      fontSize: '13px',
      textTransform: 'uppercase',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      boxShadow: '2px 2px 0px #1A1A1A',
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
    prefSelectorGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '6px',
    },
    prefToggle: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: 'bold',
      border: '2px solid #1A1A1A',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '2px 2px 0px #1A1A1A',
    },
    formActions: {
      display: 'flex',
      gap: '12px',
      marginTop: '10px',
    },
    formSubmitBtn: {
      flex: 1,
      backgroundColor: '#F5C142',
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
            <h1 style={styles.title}>Cooks & Workloads</h1>
            <p style={styles.subtitle}>Configure kitchen staff, active status, and product preparation preferences.</p>
          </div>
          <button style={styles.addButton} onClick={openCreateModal}>
            <UserPlus size={18} /> Add Kitchen Staff
          </button>
        </header>

        {/* Toolbar */}
        <div style={styles.toolbar}>
          <div style={styles.searchWrapper}>
            <Search style={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Search cooks by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterTabs}>
            <button
              style={{
                ...styles.filterTab,
                ...(statusFilter === 'all' ? styles.activeFilterTab : {}),
              }}
              onClick={() => setStatusFilter('all')}
            >
              All staff
            </button>
            <button
              style={{
                ...styles.filterTab,
                ...(statusFilter === 'active' ? styles.activeFilterTab : {}),
              }}
              onClick={() => setStatusFilter('active')}
            >
              Active Only
            </button>
            <button
              style={{
                ...styles.filterTab,
                ...{ borderRight: 'none' },
                ...(statusFilter === 'inactive' ? styles.activeFilterTab : {}),
              }}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </button>
          </div>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Grid/List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontWeight: 'bold' }}>
            Fetching kitchen staff profiles...
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredCooks.map((cook) => (
              <div key={cook.id} style={styles.card}>
                <div>
                  <div style={styles.cardHeader}>
                    <h2 style={styles.cookName}>{cook.name}</h2>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: cook.is_active ? '#81C784' : '#E0E0E0',
                      }}
                    >
                      {cook.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <h4 style={styles.prefsTitle}>
                      <Coffee size={12} /> Preferred Categories
                    </h4>
                    <div style={styles.chipsContainer}>
                      {cook.category_preferences?.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                          No preferences (receives all items)
                        </span>
                      ) : (
                        cook.category_preferences?.map((pref) => (
                          <span
                            key={pref.id}
                            style={{
                              ...styles.chip,
                              backgroundColor: pref.color,
                            }}
                          >
                            {pref.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button style={styles.actionBtn} onClick={() => handleToggleActive(cook)}>
                    {cook.is_active ? (
                      <>
                        <ToggleRight size={16} /> Archive
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={16} /> Activate
                      </>
                    )}
                  </button>
                  <button style={styles.actionBtn} onClick={() => openEditModal(cook)}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    style={{ ...styles.actionBtn, color: '#FF6B6B' }}
                    onClick={() => handleDelete(cook.id, cook.name)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {!loading && filteredCooks.length === 0 && (
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
                No kitchen staff found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Kitchen Staff' : 'Edit Kitchen Staff'}
      >
        <form onSubmit={handleFormSubmit} style={styles.form}>
          {formError && (
            <div style={{ color: '#FF6B6B', fontWeight: 'bold', fontSize: '14px' }}>
              {formError}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Cook Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Chef Raj"
              value={formFields.name}
              onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Category Preferences</label>
            <span style={{ fontSize: '12px', color: '#666', marginTop: '-2px' }}>
              Click to select category preferences. Work allocation algorithm favors matches.
            </span>
            <div style={styles.prefSelectorGrid}>
              {categories.map((cat) => {
                const isSelected = formFields.category_preferences.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategorySelection(cat.id)}
                    style={{
                      ...styles.prefToggle,
                      backgroundColor: isSelected ? cat.color : '#FFF',
                      opacity: isSelected ? 1 : 0.65,
                      textDecoration: isSelected ? 'none' : 'none',
                    }}
                  >
                    {isSelected && <Check size={14} />}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {modalMode === 'edit' && (
            <div style={{ ...styles.formGroup, flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="cook_is_active"
                checked={formFields.is_active}
                onChange={(e) => setFormFields({ ...formFields, is_active: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="cook_is_active" style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                Active (available for order auto-allocation)
              </label>
            </div>
          )}

          <div style={styles.formActions}>
            <button type="submit" style={styles.formSubmitBtn}>
              {modalMode === 'create' ? 'Save Profile' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
