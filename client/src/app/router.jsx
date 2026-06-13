import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminRoutes from '../admin/routes';
import LoginPage from '../auth/LoginPage';
import SignupPage from '../auth/SignupPage';
import UnauthorizedPage from '../auth/UnauthorizedPage';
import KdsRoutes from '../kds/routes';
import PosRoutes from '../pos/routes';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import { ROLES } from '../shared/constants';
import { useAuth } from '../shared/hooks/useAuth';

function StartRoute() {
	const { loading, user } = useAuth();

	if (loading) {
		return (
			<div className="screen">
				<p className="muted">Restoring session...</p>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	return <Navigate to={user.role === ROLES.ADMIN ? '/admin' : '/pos'} replace />;
}

export default function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<StartRoute />} />
				<Route path="/login" element={<LoginPage />} />
				<Route path="/signup" element={<SignupPage />} />
				<Route path="/unauthorized" element={<UnauthorizedPage />} />
				<Route
					path="/admin/*"
					element={
						<ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
							<AdminRoutes />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/pos/*"
					element={
						<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
							<PosRoutes />
						</ProtectedRoute>
					}
				/>
				<Route path="/kds/*" element={<KdsRoutes />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
