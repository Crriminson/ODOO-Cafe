import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import { useAuth } from '../shared/hooks/useAuth';
import { ROLES } from '../shared/constants';

const getHomeRoute = (role) => (role === ROLES.ADMIN ? '/admin' : '/pos');

export default function LoginPage() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [form, setForm] = useState({ email: '', password: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError('');

		try {
			const user = await login(form);
			navigate(getHomeRoute(user.role), { replace: true });
		} catch (submitError) {
			setError(submitError.message || 'Unable to sign in');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="screen">
			<div className="shell auth-grid">
				<div className="stack stack-large">
					<div>
						<p className="eyebrow">Odoo Cafe</p>
						<h1 className="title">Login to the cafe operations hub.</h1>
						<p className="lead">
							Use your employee or admin account to reach the POS or admin dashboard. Kitchen display stays open by design.
						</p>
					</div>
					<Card>
						<p className="card-title">Role-based access</p>
						<p className="card-copy">JWT cookies keep the browser signed in across refreshes without storing credentials in localStorage.</p>
					</Card>
				</div>

				<Card>
					<form className="form" onSubmit={handleSubmit}>
						<div>
							<p className="eyebrow">Sign in</p>
							<h2 className="card-title">Welcome back</h2>
						</div>

						<label className="field">
							<span className="label">Email</span>
							<input
								className="input"
								type="email"
								value={form.email}
								onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
								placeholder="name@odoo-cafe.com"
								autoComplete="email"
								required
							/>
						</label>

						<label className="field">
							<span className="label">Password</span>
							<input
								className="input"
								type="password"
								value={form.password}
								onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
								placeholder="••••••••"
								autoComplete="current-password"
								required
							/>
						</label>

						{error ? <p className="error">{error}</p> : null}

						<Button className="button-primary" type="submit" disabled={loading}>
							{loading ? 'Signing in...' : 'Sign in'}
						</Button>

						<p className="muted" style={{ margin: 0 }}>
							Need an account? <Link to="/signup">Create one</Link>
						</p>
					</form>
				</Card>
			</div>
		</div>
	);
}
