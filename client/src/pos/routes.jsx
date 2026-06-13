import { Route, Routes } from 'react-router-dom';

export default function PosRoutes() {
  return (
    <Routes>
      {/* Active placeholder — keeps /pos from rendering blank */}
      <Route path="/" element={<div className="text-sm text-[#6B7280]">POS Order coming soon</div>} />

      {/* === Session / Order Type / Floor Popup / Table View / Order View / Orders — owner: P3 === */}
      {/* <Route path="/" element={<OrderView />} /> */}
      {/* <Route path="/orders" element={<Orders />} /> */}
      {/* <Route path="/tables" element={<TableView />} /> */}

      {/* === Customers — owner: P4 === */}
      {/* <Route path="/customers" element={<Customers />} /> */}
    </Routes>
  );
}