import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import PosLayout from '../../layout/PosLayout.jsx';
import { getFloors } from '../../../shared/api/floors.api.js';
import useCartStore from '../../../shared/stores/useCartStore.js';

export default function TableView() {
  const navigate = useNavigate();
  const { setOrderType, setTableId } = useCartStore();
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stub function as required by instructions
  const getOrdersForTable = async (tableId) => {
    // TODO: swap for real ordersApi when Task C merges
    return { orders: [] };
  };

  useEffect(() => {
    setLoading(true);
    getFloors()
      .then((res) => {
        setFloors(res.floors || []);
      })
      .catch((err) => {
        console.error('Error fetching floors for table view:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleTableClick = async (table) => {
    if (table.is_active === false) return; // Inactive tables cannot be opened

    setOrderType('dine_in');
    setTableId(table.id);

    if (table.has_active_order) {
      try {
        const orderRes = await getOrdersForTable(table.id);
        if (orderRes.orders && orderRes.orders.length > 0) {
          const activeOrder = orderRes.orders[0];
          navigate(`/pos/order-view/${activeOrder.id}`);
          return;
        }
      } catch (err) {
        console.error('Error fetching active order for table:', err);
      }
    }

    // Fallback if not occupied or if order fetch returned empty
    navigate('/pos/order-view');
  };

  return (
    <PosLayout>
      <div className="table-view-container">
        <div className="table-view-header">
          <div>
            <h2 className="table-view-title">Floor Plan & Tables</h2>
            <p className="table-view-subtitle">Select an active table to start/resume an order</p>
          </div>
          <button className="back-btn" onClick={() => navigate('/pos')}>
            ← Back to Session
          </button>
        </div>

        {loading ? (
          <div className="spinner-container" style={{ padding: '48px' }}>
            <div className="spinner"></div>
            <span className="loading-text">Loading tables layout...</span>
          </div>
        ) : (
          <div className="floors-list">
            {floors.map((floor) => (
              <div key={floor.id} className="floor-section">
                <h3 className="floor-section-title">{floor.name}</h3>
                
                <div className="tables-grid">
                  {floor.tables.map((table) => {
                    let statusClass = 'available';
                    const isOccupied = table.has_active_order;

                    if (table.is_active === false) {
                      statusClass = 'inactive';
                    } else if (isOccupied) {
                      statusClass = 'occupied';
                    }

                    return (
                      <button
                        key={table.id}
                        className={`table-card-btn ${statusClass}`}
                        onClick={() => handleTableClick(table)}
                        disabled={table.is_active === false}
                      >
                        <p className="table-card-number">T{table.table_number}</p>
                        <p className="table-card-seats">
                          <Users size={14} strokeWidth={2} />
                          <span>{table.seats} {table.seats === 1 ? 'seat' : 'seats'}</span>
                        </p>
                        {table.is_active === false && <span className="table-inactive-badge">Inactive</span>}
                        {table.is_active !== false && isOccupied && <span className="table-occupied-dot">●</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PosLayout>
  );
}
