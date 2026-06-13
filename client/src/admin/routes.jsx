/**
 * admin/routes.jsx
 *
 * Each person appends their own route block inside the relevant comment fence.
 * DO NOT touch another person's block.
 *
 * Route ownership:
 *   P1 — Auth / Dashboard / Employees / Cooks / Reports
 *   P2 — Categories / Products / FloorsAndTables / PaymentMethods   ← this file's current scope
 *   P3 — Orders / Customers / Sessions / Coupons / Promotions / KDS
 */

import { Routes, Route, Navigate } from 'react-router-dom';

// ─── P2: Catalog & Venue pages ────────────────────────────────────────────────
import CategoriesPage      from './pages/Categories/index.jsx';
import ProductsPage        from './pages/Products/index.jsx';
import FloorsAndTablesPage from './pages/FloorsAndTables/index.jsx';
import PaymentMethodsPage  from './pages/PaymentMethods/index.jsx';

/**
 * AdminRoutes — drop this inside <AdminLayout> or the top-level admin router.
 * Each owner adds their <Route> elements inside their own comment block only.
 */
export default function AdminRoutes() {
  return (
    <Routes>
      {/* ── P2: Catalog & Venue ──────────────────────────────────────────── */}
      <Route path="categories"      element={<CategoriesPage />} />
      <Route path="products"        element={<ProductsPage />} />
      <Route path="floors-tables"   element={<FloorsAndTablesPage />} />
      <Route path="payment-methods" element={<PaymentMethodsPage />} />
      {/* ── end P2 ──────────────────────────────────────────────────────── */}

      {/* Fallback — redirect unknown /admin/* to categories until P1 adds dashboard */}
      <Route index element={<Navigate to="categories" replace />} />
    </Routes>
  );
}