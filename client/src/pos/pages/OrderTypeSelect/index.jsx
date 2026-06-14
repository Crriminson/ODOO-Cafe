import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCartStore from '../../../shared/stores/useCartStore.js';
import FloorPopup from '../FloorPopup/index.jsx';

const CARD_BASE = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '40px 28px',
  background: '#fff',
  border: '2px solid #1A1A1A',
  boxShadow: '5px 5px 0 #1A1A1A',
  cursor: 'pointer',
  transition: 'transform 0.12s, box-shadow 0.12s',
  width: '100%',
  maxWidth: 240,
  textAlign: 'center',
};

export default function OrderTypeSelect() {
  const navigate = useNavigate();
  const { setOrderType, setTableId } = useCartStore();
  const [isFloorPopupOpen, setIsFloorPopupOpen] = useState(false);

  const handleTakeaway = () => {
    setOrderType('takeaway');
    setTableId(null);
    navigate('/pos/order-view');
  };

  return (
    <div style={{
      minHeight: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--color-canvas)',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Header */}
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', marginBottom: 6 }}>
          Select Order Type
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 40, fontWeight: 500 }}>
          Choose how the customer wants to receive their order
        </p>

        {/* Cards row */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>

          {/* Dine-In */}
          <button
            onClick={() => setIsFloorPopupOpen(true)}
            style={CARD_BASE}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '5px 8px 0 #1A1A1A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '5px 5px 0 #1A1A1A';
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#F5C142',
              border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28, boxShadow: '3px 3px 0 #1A1A1A',
            }}>
              🍽️
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>Dine-In</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 500 }}>
                Serve at a table in the café
              </p>
            </div>
          </button>

          {/* Takeaway */}
          <button
            onClick={handleTakeaway}
            style={CARD_BASE}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '5px 8px 0 #1A1A1A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '5px 5px 0 #1A1A1A';
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 16, background: '#F5C142',
              border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28, boxShadow: '3px 3px 0 #1A1A1A',
            }}>
              🛍️
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>Takeaway</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 500 }}>
                Pack for self-pickup or carryout
              </p>
            </div>
          </button>
        </div>
      </div>

      <FloorPopup
        isOpen={isFloorPopupOpen}
        onClose={() => setIsFloorPopupOpen(false)}
      />
    </div>
  );
}
