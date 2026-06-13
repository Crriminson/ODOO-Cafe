import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Coffee } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--color-canvas)' }}>
      <div className="w-full max-w-[420px] space-y-6">

        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 flex-shrink-0"
               style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
            <Coffee size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
          </div>
          <span className="text-[1.5rem] font-black leading-tight" style={{ color: '#1A1A1A' }}>
            Odoo Cafe POS
          </span>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-2xl p-8 border-2"
             style={{ borderColor: '#1A1A1A', boxShadow: 'var(--shadow-xl)' }}>

          {/* Card heading */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
                 style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
              <Coffee size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
            </div>
            <h1 className="text-[1.5rem] font-black leading-tight" style={{ color: '#1A1A1A' }}>
              Sign in
            </h1>
          </div>
          <p className="text-sm mb-6 ml-12" style={{ color: '#6B7280' }}>
            Use your employee or admin credentials.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="name@odoo-cafe.com"
                autoComplete="email"
                required
                aria-required="true"
                className="border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white transition-colors duration-150 focus:outline-none"
                style={{
                  borderColor: '#E5E7EB',
                  color: '#1A1A1A',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Password <span aria-hidden="true">*</span>
              </label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                aria-required="true"
                className="border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white transition-colors duration-150 focus:outline-none"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* API error banner */}
            {error && (
              <div className="border-2 rounded-lg px-3 py-2.5 text-sm"
                   style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}
                   role="alert">
                {error}
              </div>
            )}

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black border-2 transition-colors duration-150"
              style={{
                background: loading ? '#E0AE30' : '#F5C142',
                borderColor: '#1A1A1A',
                color: '#1A1A1A',
                boxShadow: 'var(--shadow-md)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Footer link */}
            <p className="text-sm text-center" style={{ color: '#6B7280' }}>
              Need an account?{' '}
              <Link
                to="/signup"
                className="font-bold underline underline-offset-2 transition-colors duration-150"
                style={{ color: '#1A1A1A' }}
                onMouseEnter={(e) => (e.target.style.color = '#F5C142')}
                onMouseLeave={(e) => (e.target.style.color = '#1A1A1A')}
              >
                Create one
              </Link>
            </p>
          </form>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>
          Odoo Cafe POS · Role-based access
        </p>
      </div>
    </div>
  );
}
