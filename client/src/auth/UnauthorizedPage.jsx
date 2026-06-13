import { Link } from 'react-router-dom';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';

export default function UnauthorizedPage() {
  return (
    <div className="screen">
      <div className="shell">
        <Card>
          <div className="stack">
            <p className="eyebrow">Access denied</p>
            <h1 className="title" style={{ fontSize: '2.2rem' }}>
              You do not have permission to view this area.
            </h1>
            <p className="lead">Use a different account or return to a role you are allowed to access.</p>
            <Link to="/login">
              <Button className="button-primary">Back to login</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}