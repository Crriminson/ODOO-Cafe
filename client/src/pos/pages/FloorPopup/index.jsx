import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import Modal from '../../../shared/components/Modal.jsx';
import { getFloors } from '../../../shared/api/floors.api.js';
import useCartStore from '../../../shared/stores/useCartStore.js';

export default function FloorPopup({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { setOrderType, setTableId } = useCartStore();
  const [floors, setFloors] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getFloors()
        .then((res) => {
          setFloors(res.floors || []);
          if (res.floors && res.floors.length > 0) {
            setActiveFloorId(res.floors[0].id);
          }
        })
        .catch((err) => {
          console.error('Error fetching floors for popup:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  const handleTableClick = (table) => {
    setOrderType('dine_in');
    setTableId(table.id);
    onClose();
    navigate('/pos/order-view');
  };

  const activeFloor = floors.find((f) => f.id === activeFloorId);
  const visibleTables = activeFloor
    ? activeFloor.tables.filter((t) => t.is_active !== false)
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Table">
      {loading ? (
        <div className="spinner-container" style={{ padding: '24px' }}>
          <div className="spinner-sm"></div>
          <span className="loading-text">Loading floor plan...</span>
        </div>
      ) : (
        <div className="floor-popup-container">
          {floors.length > 1 && (
            <div className="floor-tabs">
              {floors.map((floor) => (
                <button
                  key={floor.id}
                  className={`floor-tab-btn ${activeFloorId === floor.id ? 'active' : ''}`}
                  onClick={() => setActiveFloorId(floor.id)}
                >
                  {floor.name}
                </button>
              ))}
            </div>
          )}

          {visibleTables.length > 0 ? (
            <div className="tables-grid">
              {visibleTables.map((table) => {
                const isOccupied = table.has_active_order;
                return (
                  <button
                    key={table.id}
                    className={`table-card-btn ${isOccupied ? 'occupied' : 'available'}`}
                    onClick={() => handleTableClick(table)}
                  >
                    <p className="table-card-number">T{table.table_number}</p>
                    <p className="table-card-seats">
                      <Users size={14} strokeWidth={2} />
                      <span>{table.seat_count} {table.seat_count === 1 ? 'seat' : 'seats'}</span>
                    </p>
                    {isOccupied && <span className="table-occupied-dot">●</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="floor-empty-state">
              <span className="floor-empty-icon">🪑</span>
              <p>No active tables found on this floor.</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
