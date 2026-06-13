import { useNavigate } from 'react-router-dom';
import Button from '../shared/components/Button';
import Card from '../shared/components/Card';
import { useAuth } from '../shared/hooks/useAuth';

const cards = [
  {
    title: 'Take orders',
    body: 'Cashier and floor workflows can live behind the employee role guard.'
  },
  {
    title: 'Open sessions',
    body: 'Authenticated access is ready for session-based POS operations and later data fetching.'
  }
];

export default function PosRoutes() {
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
          <p className="eyebrow">POS</p>
          <h1 className="card-title" style={{ fontSize: '1.6rem', margin: 0 }}>
            Hello, {user?.name}
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