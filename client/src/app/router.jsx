import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { ROLES } from '@/shared/constants';
import LoginPage from '@/auth/LoginPage';
import SignupPage from '@/auth/SignupPage';
import AdminLayout from '@/admin/layout/AdminLayout';
import AdminRoutes from '@/admin/routes';
import PosLayout from '@/pos/layout/PosLayout';
import PosRoutes from '@/pos/routes';
import KdsRoutes from '@/kds/routes';

// Shared full-screen loader
function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#1A1A1A]" />
    </div>
  );
}

// Returns the correct surface URL for a logged-in user
function getSurface(role) {
  return role === ROLES.ADMIN ? '/admin' : '/pos';
}

// Guard: requires auth + matching role.
// Shows loader while hydrating, redirects to /login if not authed,
// redirects to correct surface if authed with wrong role.
function RequireAuth({ role }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={getSurface(user.role)} replace />;

  return <Outlet />;
}

// Guard: redirects already-authenticated users to their surface.
// Shows loader while hydrating so we don't flash /login for a valid session.
function RedirectIfAuthed() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to={getSurface(user.role)} replace />;

  return <Outlet />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public auth routes — redirect away if already logged in */}
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Admin surface — requires admin role */}
      <Route element={<RequireAuth role={ROLES.ADMIN} />}>
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="*" element={<AdminRoutes />} />
        </Route>
      </Route>

      {/* POS surface — requires employee role */}
      <Route element={<RequireAuth role={ROLES.EMPLOYEE} />}>
        <Route path="/pos/*" element={<PosLayout />}>
          <Route path="*" element={<PosRoutes />} />
        </Route>
      </Route>

      {/* KDS — public, no guard */}
      <Route path="/kds/*" element={<KdsRoutes />} />

      {/* Root + catch-all → /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRouter;
