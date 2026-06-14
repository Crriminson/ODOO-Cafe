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
/* === end P2 block === */

const AdminRoutes = () => (
  <Routes>
    <Route element={<AdminLayout />}>

      {/* === Dashboard — owner: P1 === */}
      <Route index element={<Navigate to="products" replace />} />

      {/* === Products & Categories — owner: P2 === */}
      <Route path="products"    element={<Products />} />
      <Route path="categories"  element={<Categories />} />

      {/* === Payment Methods & Floors/Tables — owner: P2 === */}
      <Route path="payment-methods" element={<PaymentMethods />} />
      <Route path="floors-tables"   element={<FloorsAndTables />} />

      {/* === Cooks & Coupons/Promotions — owner: P4 === */}
      <Route path="coupons" element={<CouponsPromotions />} />

      {/* === Employees === */}
      <Route path="employees" element={<Employees />} />

      {/* === Reports === */}
      <Route path="reports" element={<Reports />} />

    </Route>
  </Routes>
);

export default AdminRoutes;