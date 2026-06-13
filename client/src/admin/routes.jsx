import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout.jsx';

/* === P2-owned imports — do not edit outside P2 block === */
import Products      from './pages/Products/index.jsx';
import Categories    from './pages/Categories/index.jsx';
import PaymentMethods from './pages/PaymentMethods/index.jsx';
import FloorsAndTables from './pages/FloorsAndTables/index.jsx';
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
      {/* <Route path="cooks" element={<Cooks />} /> */}
      {/* <Route path="coupons-promotions" element={<CouponsPromotions />} /> */}

      {/* === Employees, Reports, Settings — owner: TBD (round 2) === */}

    </Route>
  </Routes>
);

export default AdminRoutes;