import { Routes, Route, Navigate } from 'react-router-dom';
import SessionScreen from './pages/SessionScreen/index.jsx';
import OrderTypeSelect from './pages/OrderTypeSelect/index.jsx';
import TableView from './pages/TableView/index.jsx';
import OrderView from './pages/OrderView/index.jsx';
import FloorPopup from './pages/FloorPopup/index.jsx';

export default function PosRoutes() {
  return (
    <Routes>
      {/* Default: /pos → /pos/session */}
      <Route index element={<Navigate to="session" replace />} />
      {/* Session management */}
      <Route path="session"    element={<SessionScreen />} />
      {/* === P3 routes === */}
      <Route path="order-type" element={<OrderTypeSelect />} />
      <Route path="tables"     element={<TableView />} />
      <Route path="floor-popup" element={<FloorPopup />} />
      <Route path="order-view" element={<OrderView />} />
      <Route path="order-view/:orderId" element={<OrderView />} />
    </Routes>
  );
}

