import React from 'react';
import { Route } from 'react-router-dom';
import OrderTypeSelect from './pages/OrderTypeSelect/index.jsx';
import TableView from './pages/TableView/index.jsx';
import OrderView from './pages/OrderView/index.jsx';

export default (
  <>
    // --- P3 routes start ---
    <Route path="order-type" element={<OrderTypeSelect />} />
    <Route path="tables" element={<TableView />} />
    <Route path="order-view" element={<OrderView />} />
    <Route path="order-view/:orderId" element={<OrderView />} />
    // --- P3 routes end ---
  </>
);
