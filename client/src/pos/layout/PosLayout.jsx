import React from 'react';

/**
 * Main Layout Shell for the POS application interface.
 */
export default function PosLayout({ children }) {
  return (
    <div className="pos-layout">
      <header className="pos-header">
        <div className="pos-logo-container">
          <span className="pos-logo-icon">☕</span>
          <h1 className="pos-logo-text">Odoo Cafe POS</h1>
        </div>
      </header>
      <main className="pos-main">
        <div className="pos-container">
          {children}
        </div>
      </main>
    </div>
  );
}
