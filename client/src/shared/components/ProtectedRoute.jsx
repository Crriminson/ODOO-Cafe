import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Card from './Card';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="screen">
        <Card>
          <p className="muted">Checking session...</p>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}