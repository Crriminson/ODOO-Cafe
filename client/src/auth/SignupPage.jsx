import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../shared/components/Card';
import Button from '../shared/components/Button';
import { useAuth } from '../shared/hooks/useAuth';
import { AUTH_ROLES } from '../shared/constants';

export default function SignupPage() {
	const navigate = useNavigate();
	const { signup } = useAuth();
	const [form, setForm] = useState({ name: '', email: '', password: '', role: AUTH_ROLES[1] });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError('');
		setSuccess('');

		try {
			await signup(form);
			setSuccess('Account created. You can sign in now.');
			navigate('/login', { replace: true });
		} catch (submitError) {
			setError(submitError.message || 'Unable to create the account');
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
						<h1 className="title">Create staff access in minutes.</h1>
						<p className="lead">
							Admin and employee accounts are controlled by the server JWT flow and checked on every protected request.
						</p>
					</div>
					<Card>
						<p className="card-title">What this enables</p>
						<p className="card-copy">Admins get access to management surfaces. Employees land in the POS flow. Kitchen display remains public.</p>
					</Card>
				</div>

				<Card>
					<form className="form" onSubmit={handleSubmit}>
						<div>
							<p className="eyebrow">Sign up</p>
							<h2 className="card-title">New account</h2>
						</div>

						<label className="field">
							<span className="label">Name</span>
							<input
								className="input"
								type="text"
								value={form.name}
								onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
								placeholder="Asha Patel"
								autoComplete="name"
								required
							/>
						</label>

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
								placeholder="At least 8 characters"
								autoComplete="new-password"
								minLength="8"
								required
							/>
						</label>

						<label className="field">
							<span className="label">Role</span>
							<select
								className="select"
								value={form.role}
								onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
							>
								{AUTH_ROLES.map((role) => (
									<option key={role} value={role}>
										{role}
									</option>
								))}
							</select>
						</label>

						{error ? <p className="error">{error}</p> : null}
						{success ? <p className="success">{success}</p> : null}

						<Button className="button-primary" type="submit" disabled={loading}>
							{loading ? 'Creating account...' : 'Create account'}
						</Button>

						<p className="muted" style={{ margin: 0 }}>
							Already have access? <Link to="/login">Sign in</Link>
						</p>
					</form>
				</Card>
			</div>
		</div>
	);
}
