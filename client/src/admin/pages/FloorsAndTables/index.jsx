import { useState, useEffect, useCallback } from 'react';
import { getFloors, createFloor, createTable } from '../../../shared/api/floors.api.js';
import { updateTable, deleteTable }            from '../../../shared/api/tables.api.js';

// ─── Inject keyframes once ────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('fat-styles')) {
  const s = document.createElement('style');
  s.id = 'fat-styles';
  s.textContent = `
    @keyframes fat-spin { to { transform: rotate(360deg); } }
    .fat-input:hover, .fat-input:focus { background:#f9fafb!important; border-color:#6366f1!important; outline:none; }
    .fat-btn:disabled { opacity:.5; cursor:not-allowed; }
    .fat-row:hover { background:#fafafa; }
  `;
  document.head.appendChild(s);
}

// ─── Utility ──────────────────────────────────────────────────────────────────

const px = (obj) => obj; // identity — used for readability

// ─── Add-table form (per floor) ───────────────────────────────────────────────

function AddTableForm({ floorId, onAdded }) {
  const [tableNum, setTableNum] = useState('');
  const [seats, setSeats]       = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const tn = parseInt(tableNum, 10);
    const s  = parseInt(seats,    10);
    if (!tn || tn < 1) { setError('Table number must be a positive integer.'); return; }
    if (!s  || s  < 1) { setError('Seats must be a positive integer.'); return; }

    setSaving(true);
    try {
      const res = await createTable(floorId, { table_number: tn, seats: s });
      onAdded(res.table);
      setTableNum('');
      setSeats('');
    } catch (err) {
      if (err.code === 'TABLE_NUMBER_EXISTS') {
        setError(`Table ${tn} already exists on this floor.`);
      } else {
        setError(err.message || 'Failed to add table.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={S.addTableForm} noValidate>
      <input
        className="fat-input"
        type="number"
        placeholder="Table #"
        value={tableNum}
        min={1}
        onChange={(e) => { setTableNum(e.target.value); setError(''); }}
        style={{ ...S.input, width: 90 }}
      />
      <input
        className="fat-input"
        type="number"
        placeholder="Seats"
        value={seats}
        min={1}
        onChange={(e) => { setSeats(e.target.value); setError(''); }}
        style={{ ...S.input, width: 80 }}
      />
      <button type="submit" disabled={saving} className="fat-btn" style={{ ...S.btn, ...S.btnPrimary, fontSize: 12 }}>
        {saving ? 'Adding…' : '+ Add Table'}
      </button>
      {error && <span style={S.inlineErr}>{error}</span>}
    </form>
  );
}

// ─── Single table row ─────────────────────────────────────────────────────────

function TableRow({ table, onUpdated, onDeleted }) {
  const [toggling, setToggling]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [deleteErr, setDeleteErr]         = useState('');

  async function handleToggleActive() {
    setToggling(true);
    try {
      const res = await updateTable(table.id, { is_active: !table.is_active });
      onUpdated(res.table);
    } catch (err) {
      // no-op — keep current value
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteErr('');
    try {
      await deleteTable(table.id);
      onDeleted(table.id);
    } catch (err) {
      setDeleteErr(err.message || 'Delete failed.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <tr className="fat-row" style={S.tr}>
      <td style={S.td}>
        <span style={{
          ...S.tableNumBadge,
          background: table.is_active ? '#ede9fe' : '#f3f4f6',
          color:      table.is_active ? '#4f46e5' : '#9ca3af',
        }}>
          T{table.table_number}
        </span>
      </td>
      <td style={S.td}>{table.seats} seats</td>
      <td style={S.td}>
        {/* has_active_order indicator */}
        <span style={{
          ...S.statusDot,
          background: table.has_active_order ? '#22c55e' : '#e5e7eb',
        }} title={table.has_active_order ? 'Active order on this table' : 'No active order'} />
        <span style={{ fontSize: 12, color: table.has_active_order ? '#16a34a' : '#9ca3af' }}>
          {table.has_active_order ? 'Active order' : 'Free'}
        </span>
      </td>
      <td style={{ ...S.td, textAlign: 'right' }}>
        {deleteErr && <span style={{ ...S.inlineErr, marginRight: 8 }}>{deleteErr}</span>}

        {/* Active toggle */}
        <button
          onClick={handleToggleActive}
          disabled={toggling}
          className="fat-btn"
          style={{
            ...S.btn,
            ...(table.is_active ? S.btnGhost : S.btnSuccess),
            fontSize: 12,
            marginRight: 6,
          }}
        >
          {toggling ? '…' : table.is_active ? 'Deactivate' : 'Activate'}
        </button>

        {/* Delete with confirm */}
        {confirmDelete ? (
          <>
            <span style={{ fontSize: 12, color: '#374151', marginRight: 6 }}>Sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="fat-btn"
              style={{ ...S.btn, ...S.btnDanger, fontSize: 12, marginRight: 4 }}
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => { setConfirmDelete(false); setDeleteErr(''); }}
              className="fat-btn"
              style={{ ...S.btn, ...S.btnGhost, fontSize: 12 }}
            >
              No
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="fat-btn"
            style={{ ...S.btn, ...S.btnDangerOutline, fontSize: 12 }}
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

// ─── Single floor card ────────────────────────────────────────────────────────

function FloorCard({ floor, onFloorUpdated }) {
  // Local copy of tables so we can mutate without refetching all floors
  const [tables, setTables] = useState(floor.tables);

  // Keep in sync if parent re-renders (e.g. initial load)
  useEffect(() => { setTables(floor.tables); }, [floor.tables]);

  function handleTableAdded(newTable) {
    // Inject has_active_order=false (brand new table can't have one)
    setTables((prev) => [...prev, { ...newTable, has_active_order: false }]
      .sort((a, b) => a.table_number - b.table_number));
  }

  function handleTableUpdated(updated) {
    setTables((prev) => prev.map((t) => t.id === updated.id
      // preserve has_active_order — not returned by PUT /tables/:id
      ? { ...t, ...updated }
      : t
    ));
    onFloorUpdated();
  }

  function handleTableDeleted(id) {
    setTables((prev) => prev.filter((t) => t.id !== id));
  }

  const activeCount   = tables.filter((t) => t.is_active).length;
  const inactiveCount = tables.filter((t) => !t.is_active).length;

  return (
    <div style={S.floorCard}>
      {/* Floor header */}
      <div style={S.floorHeader}>
        <div>
          <h3 style={S.floorName}>{floor.name}</h3>
          <span style={S.floorMeta}>
            {activeCount} active · {inactiveCount} inactive · {tables.length} total
          </span>
        </div>
      </div>

      {/* Tables table */}
      {tables.length === 0 ? (
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '12px 0' }}>
          No tables yet — add one below.
        </p>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Table</th>
              <th style={S.th}>Seats</th>
              <th style={S.th}>Status</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <TableRow
                key={t.id}
                table={t}
                onUpdated={handleTableUpdated}
                onDeleted={handleTableDeleted}
              />
            ))}
          </tbody>
        </table>
      )}

      {/* Add table form */}
      <div style={{ marginTop: 12 }}>
        <AddTableForm floorId={floor.id} onAdded={handleTableAdded} />
      </div>
    </div>
  );
}

// ─── Create Floor form ────────────────────────────────────────────────────────

function CreateFloorForm({ onCreated }) {
  const [name, setName]       = useState('');
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) { setError('Floor name is required.'); return; }

    setSaving(true);
    try {
      const res = await createFloor({ name: trimmed });
      onCreated({ ...res.floor, tables: [] });
      setName('');
    } catch (err) {
      if (err.code === 'NAME_EXISTS') {
        setError('A floor with this name already exists.');
      } else {
        setError(err.message || 'Failed to create floor.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={S.createFloorForm} noValidate>
      <h3 style={S.formTitle}>Add Floor</h3>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          className="fat-input"
          type="text"
          placeholder="e.g. Ground Floor, Rooftop"
          value={name}
          maxLength={100}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          style={{ ...S.input, flex: 1 }}
        />
        <button type="submit" disabled={saving} className="fat-btn" style={{ ...S.btn, ...S.btnPrimary }}>
          {saving ? 'Creating…' : '+ Create Floor'}
        </button>
      </div>
      {error && <p style={S.formErr}>{error}</p>}
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FloorsAndTablesPage() {
  const [floors, setFloors]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadErr, setLoadErr]   = useState('');

  const loadFloors = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try {
      const res = await getFloors();
      setFloors(res.floors);
    } catch (err) {
      setLoadErr(err.message || 'Failed to load floors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFloors(); }, [loadFloors]);

  function handleFloorCreated(newFloor) {
    setFloors((prev) => [...prev, newFloor]);
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Floors &amp; Tables</h1>
          <p style={S.pageSubtitle}>
            Manage cafe seating layout. Tables with active orders are marked in green.
          </p>
        </div>
      </div>

      {/* Create floor */}
      <div style={S.card}>
        <CreateFloorForm onCreated={handleFloorCreated} />
      </div>

      {/* Floors list */}
      {loading ? (
        <div style={S.stateBox}>
          <div style={S.spinner} />
          <span style={S.stateText}>Loading floors…</span>
        </div>
      ) : loadErr ? (
        <div style={{ ...S.stateBox, flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <p style={{ ...S.stateText, color: '#ef4444' }}>{loadErr}</p>
          <button onClick={loadFloors} style={{ ...S.btn, ...S.btnGhost }}>Retry</button>
        </div>
      ) : floors.length === 0 ? (
        <div style={S.stateBox}>
          <span style={S.stateText}>No floors yet. Create one above.</span>
        </div>
      ) : (
        floors.map((floor) => (
          <FloorCard
            key={floor.id}
            floor={floor}
            onFloorUpdated={loadFloors}
          />
        ))
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: '32px 40px',
    maxWidth: 920,
    margin: '0 auto',
    fontFamily: '"Inter","Segoe UI",system-ui,sans-serif',
    color: '#111827',
  },
  header: { marginBottom: 24 },
  pageTitle: { fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px', color: '#0f172a' },
  pageSubtitle: { margin: '4px 0 0', fontSize: 14, color: '#6b7280' },

  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },

  // Floor card
  floorCard: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  floorHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  floorName:   { margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' },
  floorMeta:   { fontSize: 12, color: '#9ca3af', marginTop: 2, display: 'block' },

  // Table
  table:         { width: '100%', borderCollapse: 'collapse', marginTop: 4 },
  th:            { padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', borderBottom: '1px solid #f3f4f6' },
  tr:            { borderBottom: '1px solid #f9fafb', transition: 'background 0.1s' },
  td:            { padding: '10px 10px', verticalAlign: 'middle', fontSize: 13 },

  tableNumBadge: { display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: 13 },
  statusDot:     { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 6, verticalAlign: 'middle' },

  // Add-table form
  addTableForm: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed #e5e7eb', marginTop: 8 },

  // Create floor form
  createFloorForm: { display: 'flex', flexDirection: 'column', gap: 10 },
  formTitle: { margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#374151' },
  formErr:   { margin: '4px 0 0', fontSize: 13, color: '#ef4444' },
  inlineErr: { fontSize: 12, color: '#ef4444' },

  // Inputs
  input: {
    padding: '8px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    background: '#fff',
    color: '#111827',
    transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
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
  btnPrimary:      { background: '#6366f1', color: '#fff' },
  btnGhost:        { background: '#f3f4f6', color: '#374151' },
  btnDanger:       { background: '#ef4444', color: '#fff' },
  btnDangerOutline:{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5' },
  btnSuccess:      { background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' },

  // State boxes
  stateBox:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 120 },
  stateText: { fontSize: 14, color: '#6b7280' },
  spinner: {
    width: 20, height: 20,
    border: '2px solid #e5e7eb',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'fat-spin 0.7s linear infinite',
  },
};
