import { Route, Routes } from 'react-router-dom';

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Active placeholder — keeps /admin from rendering blank */}
      <Route path="/" element={<div className="text-sm text-[#6B7280]">Dashboard coming soon</div>} />

      {/* === Dashboard / Reports — owner: round 2 === */}
      {/* <Route path="/" element={<Dashboard />} /> */}
      {/* <Route path="/reports" element={<Reports />} /> */}

      {/* === Products & Categories — owner: P2 === */}
      {/* <Route path="/products" element={<Products />} /> */}
      {/* <Route path="/categories" element={<Categories />} /> */}

      {/* === Payment Methods & Floors/Tables — owner: P2 === */}
      {/* <Route path="/payment-methods" element={<PaymentMethods />} /> */}
      {/* <Route path="/floors-tables" element={<FloorsAndTables />} /> */}

      {/* === Cooks & Coupons/Promotions — owner: P4 === */}
      {/* <Route path="/cooks" element={<Cooks />} /> */}
      {/* <Route path="/coupons-promotions" element={<CouponsPromotions />} /> */}

      {/* === Employees & Settings — owner: round 2 === */}
      {/* <Route path="/employees" element={<Employees />} /> */}
      {/* <Route path="/settings" element={<Settings />} /> */}
    </Routes>
  );
}