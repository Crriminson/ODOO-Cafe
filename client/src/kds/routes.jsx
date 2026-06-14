import { Routes, Route } from 'react-router-dom';
import KitchenDisplay from './pages/KitchenDisplay/index.jsx';

const KdsRoutes = () => (
  <Routes>
    {/* /kds — Kitchen Display System */}
    <Route index element={<KitchenDisplay />} />
  </Routes>
);

export default KdsRoutes;