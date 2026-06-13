import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PosLayout from '../../layout/PosLayout.jsx';
import useCartStore from '../../../shared/stores/useCartStore.js';
import FloorPopup from '../FloorPopup/index.jsx';

export default function OrderTypeSelect() {
  const navigate = useNavigate();
  const { setOrderType, setTableId } = useCartStore();
  const [isFloorPopupOpen, setIsFloorPopupOpen] = useState(false);

  const handleTakeaway = () => {
    setOrderType('takeaway');
    setTableId(null);
    navigate('/pos/order-view');
  };

  const handleDineInClick = () => {
    setIsFloorPopupOpen(true);
  };

  return (
    <PosLayout>
      <div className="order-type-container">
        <div className="order-type-card">
          <h2 className="order-type-title">Select Order Type</h2>
          <p className="order-type-subtitle">Choose how the customer wants to receive their order</p>
          
          <div className="order-type-options">
            <button className="order-type-button dine-in" onClick={handleDineInClick}>
              <span className="order-type-icon">🍽️</span>
              <span className="order-type-label">Dine-In</span>
              <span className="order-type-desc">Serve at a table in the cafe</span>
            </button>
            
            <button className="order-type-button takeaway" onClick={handleTakeaway}>
              <span className="order-type-icon">🛍️</span>
              <span className="order-type-label">Takeaway</span>
              <span className="order-type-desc">Pack for self-pickup or carryout</span>
            </button>
          </div>
        </div>
      </div>

      <FloorPopup 
        isOpen={isFloorPopupOpen} 
        onClose={() => setIsFloorPopupOpen(false)} 
      />
    </PosLayout>
  );
}
