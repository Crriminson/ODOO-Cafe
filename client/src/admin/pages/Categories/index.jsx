import { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../../shared/api/categories.api.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function isValidHex(v) {
  return HEX_RE.test(v);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * A single category row in the table.
 * Owns its own editing, saving, and delete-confirm state
 * so sibling rows are completely unaffected.
 */
function CategoryRow({ category, onUpdated, onDeleted }) {
  const [nameValue, setNameValue]       = useState(category.name);
  const [prevName, setPrevName]         = useState(category.name);
  const [nameError, setNameError]       = useState('');
  const [savingName, setSavingName]     = useState(false);

  const [colorValue, setColorValue]     = useState(category.color);
  const [savingColor, setSavingColor]   = useState(false);

  const [deleteError, setDeleteError]   = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingRow, setDeletingRow]   = useState(false);

  // Keep local state in sync if parent re-fetches (e.g. after create)
  useEffect(() => {
    setNameValue(category.name);
    setPrevName(category.name);
    setColorValue(category.color);
  }, [category.name, category.color]);

  // ── Name ──────────────────────────────────────────────────────────────────

  async function handleNameBlur() {
    const trimmed = nameValue.trim();
    if (!trimmed) {
      setNameValue(prevName);
      return;
    }
    if (trimmed === prevName) return; // no change

    setSavingName(true);
    setNameError('');
    try {
      const res = await updateCategory(category.id, { name: trimmed });
      setPrevName(res.category.name);
      setNameValue(res.category.name);
      onUpdated(res.category);
    } catch (e) {
      setNameError(
        e.code === 'NAME_EXISTS'
          ? 'A category with this name already exists.'
          : e.message || 'Failed to save name.'
      );
      setNameValue(prevName); // revert
    } finally {
      setSavingName(false);
    }
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') {
      setNameValue(prevName);
      setNameError('');
      e.target.blur();
    }
  }

  // ── Color ─────────────────────────────────────────────────────────────────

  async function handleColorChange(e) {
    const hex = e.target.value;
    setColorValue(hex);
    if (!isValidHex(hex)) return;

    setSavingColor(true);
    try {
      const res = await updateCategory(category.id, { color: hex });
      onUpdated(res.category);
    } catch (e) {
      // revert to last known good color on failure
      setColorValue(category.color);
    } finally {
      setSavingColor(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleConfirmDelete() {
    setDeletingRow(true);
    setDeleteError('');
    try {
      await deleteCategory(category.id);
      onDeleted(category.id);
    } catch (e) {
      if (e.code === 'HAS_PRODUCTS') {
        setDeleteError(
          e.message || "Can't delete — products are assigned to this category."
        );
      } else {
        setDeleteError(e.message || 'Delete failed.');
      }
      setConfirmingDelete(false);
    } finally {
      setDeletingRow(false);
    }
  }

  return (
    <tr style={styles.tr}>
      {/* ── Color swatch + picker ── */}
      <td style={styles.td}>
        <div style={styles.swatchCell}>
          <label style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Visible swatch */}
            <span
              style={{
                ...styles.swatch,
                backgroundColor: colorValue,
                boxShadow: savingColor ? '0 0 0 2px #6366f1' : '0 0 0 1px rgba(0,0,0,0.15)',
              }}
              title="Click to change color"
            />
            {/* Native color input — visually hidden behind swatch */}
            <input
              type="color"
              value={colorValue}
              onChange={handleColorChange}
              style={styles.hiddenColorInput}
              title="Pick color"
            />
            {savingColor && <span style={styles.badge}>saving…</span>}
          </label>
        </div>
      </td>

      {/* ── Name ── */}
      <td style={styles.td}>
        <input
          type="text"
          value={nameValue}
          onChange={(e) => { setNameValue(e.target.value); setNameError(''); }}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          disabled={savingName}
          style={{
            ...styles.inlineInput,
            borderColor: nameError ? '#ef4444' : 'transparent',
          }}
        />
        {savingName && <span style={styles.badge}>saving…</span>}
        {nameError && <p style={styles.inlineError}>{nameError}</p>}
      </td>

      {/* ── Actions ── */}
      <td style={{ ...styles.td, textAlign: 'right' }}>
        {deleteError && (
          <p style={{ ...styles.inlineError, marginBottom: 4 }}>{deleteError}</p>
        )}
        {confirmingDelete ? (
          <span style={styles.confirmRow}>
            <span style={styles.confirmText}>Delete?</span>
            <button
              onClick={handleConfirmDelete}
              disabled={deletingRow}
              style={{ ...styles.btn, ...styles.btnDanger }}
            >
              {deletingRow ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => { setConfirmingDelete(false); setDeleteError(''); }}
              style={{ ...styles.btn, ...styles.btnGhost }}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => { setConfirmingDelete(true); setDeleteError(''); }}
            style={{ ...styles.btn, ...styles.btnDangerOutline }}
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

/**
 * Create-category form. Inline errors; clears on success;
 * preserves values on NAME_EXISTS / VALIDATION_ERROR.
 */
function CreateCategoryForm({ onCreated }) {
  const [name, setName]         = useState('');
  const [color, setColor]       = useState('#888888');
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors([]);

    const trimmedName = name.trim();
    if (!trimmedName) { setError('Name is required.'); return; }
    if (!isValidHex(color)) { setError('Color must be a valid hex code (e.g. #FF5733).'); return; }

    setSubmitting(true);
    try {
      const res = await createCategory({ name: trimmedName, color });
      onCreated(res.category);
      setName('');
      setColor('#888888');
    } catch (e) {
      if (e.fields && e.fields.length > 0) {
        setFieldErrors(e.fields);
      } else {
        setError(e.message || 'Failed to create category.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.createForm} noValidate>
      <h3 style={styles.formTitle}>Add Category</h3>

      <div style={styles.formRow}>
        {/* Color preview + picker */}
        <label style={styles.colorLabel}>
          <span
            style={{
              ...styles.swatch,
              backgroundColor: isValidHex(color) ? color : '#888888',
              width: 36,
              height: 36,
              borderRadius: 8,
            }}
          />
          <input
            type="color"
            value={isValidHex(color) ? color : '#888888'}
            onChange={(e) => setColor(e.target.value)}
            style={styles.hiddenColorInput}
          />
        </label>

        <input
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); setFieldErrors([]); }}
          style={{ ...styles.inlineInput, flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px' }}
          maxLength={100}
        />

        <button
          type="submit"
          disabled={submitting}
          style={{ ...styles.btn, ...styles.btnPrimary }}
        >
          {submitting ? 'Adding…' : '+ Add'}
        </button>
      </div>

      {error && <p style={styles.formError}>{error}</p>}
      {fieldErrors.map((f) => (
        <p key={f.field} style={styles.formError}>{f.field}: {f.message}</p>
      ))}
    </form>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const res = await getCategories();
        if (!cancelled) setCategories(res.categories);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Failed to load categories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function handleCreated(newCat) {
    setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleUpdated(updated) {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  }

  function handleDeleted(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Categories</h1>
          <p style={styles.pageSubtitle}>
            Manage menu categories. Colors propagate live to the POS and KDS.
          </p>
        </div>
      </div>

      {/* ── Create form ── */}
      <div style={styles.card}>
        <CreateCategoryForm onCreated={handleCreated} />
      </div>

      {/* ── List ── */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.stateBox}>
            <div style={styles.spinner} />
            <span style={styles.stateText}>Loading categories…</span>
          </div>
        ) : loadError ? (
          <div style={{ ...styles.stateBox, flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 32 }}>⚠️</span>
            <p style={{ ...styles.stateText, color: '#ef4444' }}>{loadError}</p>
            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div style={styles.stateBox}>
            <span style={styles.stateText}>No categories yet. Add one above.</span>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 64 }}>Color</th>
                <th style={styles.th}>Name</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Styles (plain JS objects — no Tailwind in this project) ─────────────────

const styles = {
  page: {
    padding: '32px 40px',
    maxWidth: 860,
    margin: '0 auto',
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
    color: '#111827',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.5px',
    color: '#0f172a',
  },
  pageSubtitle: {
    margin: '4px 0 0',
    fontSize: 14,
    color: '#6b7280',
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#6b7280',
    borderBottom: '1px solid #f3f4f6',
  },
  tr: {
    borderBottom: '1px solid #f9fafb',
  },
  td: {
    padding: '12px',
    verticalAlign: 'top',
  },

  // Swatch
  swatchCell: {
    display: 'flex',
    alignItems: 'center',
  },
  swatch: {
    display: 'inline-block',
    width: 28,
    height: 28,
    borderRadius: 6,
    flexShrink: 0,
    transition: 'background-color 0.15s ease',
  },
  hiddenColorInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    padding: 0,
    border: 'none',
    cursor: 'pointer',
  },

  // Inline inputs
  inlineInput: {
    display: 'block',
    width: '100%',
    padding: '6px 8px',
    fontSize: 14,
    border: '1px solid transparent',
    borderRadius: 6,
    background: 'transparent',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
    color: '#111827',
  },

  // Badges
  badge: {
    marginLeft: 6,
    fontSize: 11,
    color: '#6366f1',
    fontStyle: 'italic',
  },
  inlineError: {
    margin: '4px 0 0',
    fontSize: 12,
    color: '#ef4444',
  },

  // Confirm / actions
  confirmRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  confirmText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: 500,
  },

  // Buttons
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 14px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s, background 0.15s',
    whiteSpace: 'nowrap',
  },
  btnPrimary: {
    background: '#6366f1',
    color: '#fff',
  },
  btnDanger: {
    background: '#ef4444',
    color: '#fff',
  },
  btnDangerOutline: {
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid #fca5a5',
  },
  btnGhost: {
    background: '#f3f4f6',
    color: '#374151',
  },

  // Create form
  createForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  formTitle: {
    margin: '0 0 8px',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  colorLabel: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  formError: {
    margin: '2px 0 0',
    fontSize: 13,
    color: '#ef4444',
  },

  // Loading / empty states
  stateBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    minHeight: 100,
  },
  stateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  spinner: {
    width: 20,
    height: 20,
    border: '2px solid #e5e7eb',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
};

// Inject the spinner keyframe once
if (typeof document !== 'undefined') {
  const id = 'cat-spinner-style';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }
      input[type=text]:hover, input[type=text]:focus { background:#f9fafb!important; border-color:#d1d5db!important; }`;
    document.head.appendChild(style);
  }
}
