import Card from '../shared/components/Card';

export default function KdsRoutes() {
  return (
    <div className="screen">
      <div className="shell">
        <Card>
          <p className="eyebrow">KDS</p>
          <h1 className="title" style={{ fontSize: '2.2rem' }}>
            Kitchen display is open by design.
          </h1>
          <p className="lead">
            This route intentionally stays accessible without authentication for the live kitchen screen.
          </p>
        </Card>
      </div>
    </div>
  );
}