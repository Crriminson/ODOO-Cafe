import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SessionScreen from '../pos/pages/SessionScreen/index.jsx';
import '../index.css';

/**
 * Main application entry component containing the router and routes.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Session Screen route */}
        <Route path="/pos" element={<SessionScreen />} />
        
        {/* Placeholder order-type selection route */}
        <Route 
          path="/pos/order-type" 
          element={
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h1 style={{ color: '#fff', marginBottom: '24px' }}>Order Type Selection Page</h1>
              <a href="/pos" style={{ color: '#f59e0b', textDecoration: 'underline' }}>Back to Session Screen</a>
            </div>
          } 
        />
        
        {/* Default route redirect to /pos */}
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
