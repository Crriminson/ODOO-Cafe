import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import AppLayout from './components/layout/AppLayout';
import TripWorkspaceLayout from './components/layout/TripWorkspaceLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TripListPage from './pages/TripListPage';
import CreateTripPage from './pages/CreateTripPage';
import TripDetailPage from './pages/TripDetailPage';
import PlanPage from './pages/PlanPage';
import DiscoverPage from './pages/DiscoverPage';
import TripMapPage from './pages/TripMapPage';
import ItineraryBuilderPage from './pages/ItineraryBuilderPage';
import ItineraryViewPage from './pages/ItineraryViewPage';
import BudgetPage from './pages/BudgetPage';
import PackingPage from './pages/PackingPage';
import NotesPage from './pages/NotesPage';
import ProfilePage from './pages/ProfilePage';
import PublicItineraryPage from './pages/PublicItineraryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import SearchPage from './pages/SearchPage';
import CommunityPage from './pages/CommunityPage';

// Protected Route Component
const ProtectedRoute = () => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Admin Route Component
const AdminRoute = () => {
  const { user } = useAuthStore();
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/shared/:token" element={<PublicItineraryPage />} />

        {/* Protected Routes (Wrapped in Layout) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/trips" element={<TripListPage />} />
            <Route path="/trips/new" element={<CreateTripPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/community" element={<CommunityPage />} />

            {/* Trip Workspace — sidebar layout */}
            <Route path="/trips/:id" element={<TripWorkspaceLayout />}>
              <Route index element={<TripDetailPage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="map" element={<TripMapPage />} />
              <Route path="build" element={<ItineraryBuilderPage />} />
              <Route path="view" element={<ItineraryViewPage />} />
              <Route path="budget" element={<BudgetPage />} />
              <Route path="packing" element={<PackingPage />} />
              <Route path="notes" element={<NotesPage />} />
            </Route>

            {/* Admin Only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
