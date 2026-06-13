import { Routes, Route } from 'react-router-dom';
import OrderTypeSelect from './pages/OrderTypeSelect/index.jsx';
import TableView from './pages/TableView/index.jsx';
import OrderView from './pages/OrderView/index.jsx';
import FloorPopup from './pages/FloorPopup/index.jsx';

export default function PosRoutes() {
  return (
    <Routes>
      {/* === P3 routes === */}
      <Route path="order-type" element={<OrderTypeSelect />} />
      <Route path="tables"     element={<TableView />} />
      <Route path="floor-popup" element={<FloorPopup />} />
      <Route path="order-view" element={<OrderView />} />
      <Route path="order-view/:orderId" element={<OrderView />} />
    </Routes>
  );
}
