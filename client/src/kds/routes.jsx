import { Route, Routes } from 'react-router-dom';

export default function KdsRoutes() {
  return (
    <Routes>
      {/* Active placeholder — keeps /kds from rendering blank */}
      <Route path="/" element={<div className="text-sm text-[#6B7280]">KDS coming soon</div>} />

      {/* === Kitchen Display — owner: P4 === */}
      {/* <Route path="/" element={<KitchenDisplay />} /> */}
    </Routes>
  );
}