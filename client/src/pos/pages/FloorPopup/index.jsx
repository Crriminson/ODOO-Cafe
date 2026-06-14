import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import Modal from '../../../shared/components/Modal.jsx';
import { getFloors } from '../../../shared/api/floors.api.js';
import useCartStore from '../../../shared/stores/useCartStore.js';

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '24px 0' }}>
      <div style={{
        width: 28, height: 28, border: '3px solid #E5E7EB',
        borderTopColor: '#1A1A1A', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Loading floor plan…</span>
    </div>
  );
}

export default function FloorPopup({ isOpen: propIsOpen, onClose: propOnClose }) {
  const navigate = useNavigate();
  const { setOrderType, setTable } = useCartStore();
  const [floors, setFloors]             = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [loading, setLoading]           = useState(false);

  // When used as a route (no props), treat as always open
  const isRoute = propIsOpen === undefined;
  const isOpen  = isRoute ? true : propIsOpen;
  const onClose = isRoute ? () => navigate('/pos/order-type') : propOnClose;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getFloors()
      .then((res) => {
        const floors = res.floors || [];
        setFloors(floors);
        if (floors.length > 0) setActiveFloorId(floors[0].id);
      })
      .catch((err) => console.error('Error fetching floors:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleTableClick = (table) => {
    setOrderType('dine_in');
    setTable(table.id);
    onClose();
    navigate('/pos/order-view');
  };

  const activeFloor    = floors.find((f) => f.id === activeFloorId);
  const visibleTables  = activeFloor
    ? activeFloor.tables.filter((t) => t.is_active !== false)
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Table">
      {loading ? (
        <Spinner />
      ) : (
        <div>
          {/* Floor tabs — only shown when there are multiple floors */}
          {floors.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloorId(floor.id)}
                  style={{
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    border: '2px solid #1A1A1A',
                    background: activeFloorId === floor.id ? '#F5C142' : '#fff',
                    color: '#1A1A1A',
                    cursor: 'pointer',
                    boxShadow: activeFloorId === floor.id ? '2px 2px 0 #1A1A1A' : 'none',
                    transition: 'all 0.12s',
                  }}
                >
                  {floor.name}
                </button>
              ))}
            </div>
          )}

          {/* Tables grid */}
          {visibleTables.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
              {visibleTables.map((table) => {
                const isOccupied = table.has_active_order;
                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 6, padding: '14px 8px',
                      background: isOccupied ? '#FEF3C7' : '#fff',
                      border: `2px solid ${isOccupied ? '#F59E0B' : '#1A1A1A'}`,
                      boxShadow: isOccupied ? '2px 2px 0 #F59E0B' : '2px 2px 0 #1A1A1A',
                      cursor: 'pointer',
                      transition: 'transform 0.1s, box-shadow 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', fontFamily: 'monospace' }}>
                      T{table.table_number}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
                      <Users size={10} strokeWidth={2} />
                      {table.seats}
                    </span>
                    {isOccupied && (
                      <span style={{
                        position: 'absolute', top: 5, right: 5,
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#F59E0B',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🪑</div>
              <p style={{ fontWeight: 700, fontSize: 14 }}>No active tables</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Configure tables in the admin panel</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
