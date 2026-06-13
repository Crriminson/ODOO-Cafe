import React from 'react';

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function CartSection({
  items = [],
  orderType = 'dine_in',
  tableName = '',
  customerName = '',
  subtotal = '0.00',
  taxTotal = '0.00',
  discountTotal = '0.00',
  total = '0.00',
  isSending = false,
  isCancelling = false,
  onUpdateQuantity,
  onRemoveItem,
  onSendToKitchen,
  onCancelOrder,
  onChangeOrderType
}) {
  const totalItemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const handleDecrement = (item) => {
    if (item.quantity === 1) {
      if (onRemoveItem) {
        onRemoveItem(item.product_id);
      }
    } else if (item.quantity > 1) {
      if (onUpdateQuantity) {
        onUpdateQuantity(item.product_id, item.quantity - 1);
      }
    }
  };

  const handleIncrement = (item) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.product_id, item.quantity + 1);
    }
  };

  return (
    <div className="cart-section">
      {/* Cart Header */}
      <div className="cart-header">
        <div className="cart-title-row">
          <h3 className="cart-title">
            <span>🛒</span> Current Order
          </h3>
          <span className="cart-badge">{totalItemCount} items</span>
        </div>

        {/* Meta info like Table and Customer */}
        <div className="cart-meta-info">
          <div className="cart-meta-item">
            <span className="cart-meta-label">Table</span>
            <span className="cart-meta-value">{tableName || 'None'}</span>
          </div>
          <div className="cart-meta-item">
            <span className="cart-meta-label">Customer</span>
            <span className="cart-meta-value">{customerName || 'Walk-in'}</span>
          </div>
        </div>

        {/* Order Type Toggle */}
        <div className="order-type-toggle-container">
          {['dine_in', 'takeaway', 'delivery'].map((type) => (
            <button
              key={type}
              type="button"
              className={`order-type-btn ${orderType === type ? 'active' : ''}`}
              onClick={() => onChangeOrderType && onChangeOrderType(type)}
            >
              {type === 'dine_in' ? 'Dine In' : type === 'takeaway' ? 'Takeaway' : 'Delivery'}
            </button>
          ))}
        </div>
      </div>

      {/* Cart Items List */}
      {items.length === 0 ? (
        <div className="cart-empty-state">
          <span className="cart-empty-icon">☕</span>
          <p style={{ fontWeight: 600, fontSize: '15px' }}>Your cart is empty</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select items from the menu to add them to the order</p>
        </div>
      ) : (
        <div className="cart-items-list">
          {items.map((item) => {
            const lineTotal = parseFloat(item.unit_price || 0) * (item.quantity || 0);

            return (
              <div key={item.product_id} className="cart-item-row">
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-subtext">
                    {formatCurrency(item.unit_price)} each
                  </div>
                </div>

                <div className="cart-item-actions">
                  <div className="quantity-controller">
                    <button
                      type="button"
                      className="quantity-btn"
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity <= 0}
                    >
                      -
                    </button>
                    <span className="quantity-val">{item.quantity}</span>
                    <button
                      type="button"
                      className="quantity-btn"
                      onClick={() => handleIncrement(item)}
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-total-price">
                    {formatCurrency(lineTotal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Summary */}
      <div className="cart-summary-box">
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Tax</span>
          <span>{formatCurrency(taxTotal)}</span>
        </div>
        {parseFloat(discountTotal) > 0 && (
          <div className="cart-summary-row" style={{ color: 'var(--success-primary)' }}>
            <span>Discounts</span>
            <span>-{formatCurrency(discountTotal)}</span>
          </div>
        )}
        <div className="cart-summary-row total">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Cart Actions */}
      <div className="cart-actions-footer">
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={onSendToKitchen}
          disabled={items.length === 0 || isSending}
        >
          {isSending ? 'Sending to Kitchen...' : 'Send to Kitchen'}
        </button>

        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%', borderColor: 'var(--danger-primary)', color: 'var(--danger-primary)' }}
          onClick={onCancelOrder}
          disabled={items.length === 0 || isCancelling}
        >
          Cancel Order
        </button>
      </div>
    </div>
  );
}
