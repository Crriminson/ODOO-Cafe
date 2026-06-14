import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout.jsx';

/* === P2-owned imports — do not edit outside P2 block === */
import Products        from './pages/Products/index.jsx';
import Categories      from './pages/Categories/index.jsx';
import PaymentMethods  from './pages/PaymentMethods/index.jsx';
import FloorsAndTables from './pages/FloorsAndTables/index.jsx';
import CouponsPromotions from './pages/CouponsPromotions/index.jsx';
import Employees       from './pages/Employees/index.jsx';
import Reports         from './pages/Reports/index.jsx';
import Cooks           from './pages/Cooks/index.jsx';
import Dashboard       from './pages/Dashboard/index.jsx';
/* === end P2 block === */

const AdminRoutes = () => (
  <Routes>
    <Route element={<AdminLayout />}>

      {/* === Dashboard === */}
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />

      {/* === Products & Categories — owner: P2 === */}
      <Route path="products"    element={<Products />} />
      <Route path="categories"  element={<Categories />} />

      {/* === Payment Methods & Floors/Tables — owner: P2 === */}
      <Route path="payment-methods" element={<PaymentMethods />} />
      <Route path="floors-tables"   element={<FloorsAndTables />} />

      {/* === Cooks — kitchen staff === */}
      <Route path="cooks" element={<Cooks />} />

      {/* === Coupons / Promotions === */}
      <Route path="coupons" element={<CouponsPromotions />} />

      {/* === Employees === */}
      <Route path="employees" element={<Employees />} />

      {/* === Reports === */}
      <Route path="reports" element={<Reports />} />

    </Route>
  </Routes>
);

export default AdminRoutes;