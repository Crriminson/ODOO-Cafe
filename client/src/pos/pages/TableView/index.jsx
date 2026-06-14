import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { getFloors } from '../../../shared/api/floors.api.js';
import useCartStore from '../../../shared/stores/useCartStore.js';

// ─── Status styles ────────────────────────────────────────────────────────────
const TABLE_STYLES = {
  available: { background: '#fff', borderColor: '#1A1A1A', color: '#1A1A1A' },
  occupied:  { background: '#FEF3C7', borderColor: '#F59E0B', color: '#92400E' },
  inactive:  { background: '#F3F4F6', borderColor: '#D1D5DB', color: '#9CA3AF', cursor: 'not-allowed' },
};

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #E5E7EB',
        borderTopColor: '#1A1A1A', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>Loading tables…</span>
    </div>
  );
}

export default function TableView() {
  const navigate = useNavigate();
  const { setOrderType, setTableId } = useCartStore();
  const [floors, setFloors]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    getFloors()
      .then((res) => setFloors(res.floors || []))
      .catch((err) => console.error('Error fetching floors:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleTableClick = async (table) => {
    if (table.is_active === false) return;
    setOrderType('dine_in');
    setTableId(table.id);
    // If table has an active order, you could look it up; for now go straight to order-view
    navigate('/pos/order-view');
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px 32px 40px', background: 'var(--color-canvas)' }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', marginBottom: 4 }}>
          Floor Plan &amp; Tables
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>
          Select an active table to start or resume an order
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : floors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🪑</div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>No floors configured</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Set up floors &amp; tables in the admin panel</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {floors.map((floor) => (
            <div key={floor.id}>
              {/* Floor header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                paddingBottom: 10, borderBottom: '2px solid #1A1A1A',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {floor.name}
                </h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px',
                  background: '#1A1A1A', color: '#F5C142',
                }}>
                  {floor.tables?.length ?? 0} tables
                </span>
              </div>

              {/* Tables grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 14 }}>
                {(floor.tables || []).map((table) => {
                  const isInactive = table.is_active === false;
                  const isOccupied = table.has_active_order && !isInactive;
                  const status     = isInactive ? 'inactive' : isOccupied ? 'occupied' : 'available';
                  const s          = TABLE_STYLES[status];

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      disabled={isInactive}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'center', gap: 8, padding: '18px 10px',
                        background: s.background,
                        border: `2px solid ${s.borderColor}`,
                        boxShadow: isInactive ? 'none' : `3px 3px 0 ${s.borderColor}`,
                        cursor: s.cursor || 'pointer',
                        transition: 'transform 0.1s, box-shadow 0.1s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isInactive) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `3px 5px 0 ${s.borderColor}`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isInactive) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = `3px 3px 0 ${s.borderColor}`;
                        }
                      }}
                    >
                      {/* Table number */}
                      <span style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>
                        T{table.table_number}
                      </span>

                      {/* Seats */}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.color, fontWeight: 600 }}>
                        <Users size={12} strokeWidth={2} />
                        {table.seats} {table.seats === 1 ? 'seat' : 'seats'}
                      </span>

                      {/* Status badge */}
                      {isOccupied && (
                        <span style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#F59E0B', border: '1.5px solid #92400E',
                        }} />
                      )}
                      {isInactive && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                          color: '#9CA3AF', letterSpacing: '0.06em', marginTop: 2,
                        }}>
                          Inactive
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
