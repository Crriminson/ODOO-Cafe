import { useNavigate } from 'react-router-dom';
import Button from '../shared/components/Button';
import Card from '../shared/components/Card';
import { useAuth } from '../shared/hooks/useAuth';

const cards = [
  {
    title: 'Daily operations',
    body: 'Manage products, staff, coupons, reports, and settings from a single authenticated dashboard.'
  },
  {
    title: 'Role guard',
    body: 'This surface is only reachable by authenticated admin users with a valid JWT cookie.'
  }
];

export default function AdminRoutes() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <header className="nav">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="card-title" style={{ fontSize: '1.6rem', margin: 0 }}>
            Welcome, {user?.name}
          </h1>
        </div>
        <div className="nav-links">
          <span className="nav-chip">Role: {user?.role}</span>
          <Button className="button-secondary" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <Card key={card.title}>
            <h2 className="card-title">{card.title}</h2>
            <p className="card-copy">{card.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}