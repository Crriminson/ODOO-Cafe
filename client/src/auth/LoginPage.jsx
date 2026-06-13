import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Coffee } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';
import { ROLES } from '../shared/constants';

const getHomeRoute = (role) => (role === ROLES.ADMIN ? '/admin' : '/pos');

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form);
      navigate(getHomeRoute(user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--color-canvas)' }}>

      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: '#714867', boxShadow: 'var(--shadow-md)' }}>
            <Coffee size={20} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>
            Odoo Cafe
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black leading-tight" style={{ color: '#1A1A1A' }}>
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
            Sign in to your account to continue.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 border-2"
             style={{ borderColor: '#1A1A1A', boxShadow: 'var(--shadow-xl)' }}>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="name@odoo-cafe.com"
                autoComplete="email"
                required
                className="border-2 rounded-xl px-4 py-3 text-sm w-full bg-white focus:outline-none transition-colors duration-150"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="border-2 rounded-xl px-4 py-3 text-sm w-full bg-white focus:outline-none transition-colors duration-150"
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; }}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3 border-2 text-sm"
                   style={{ background: '#FEF2F2', borderColor: '#EF4444', color: '#EF4444' }}
                   role="alert">
                <span className="mt-px">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black border-2 transition-colors duration-150"
              style={{
                background:  loading ? '#5d3a55' : '#714867',
                borderColor: '#1A1A1A',
                color:       '#1A1A1A',
                boxShadow:   'var(--shadow-md)',
                cursor:      loading ? 'not-allowed' : 'pointer',
                opacity:     loading ? 0.8 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#5d3a55'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#714867'; }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                : <><span>Sign in</span><ArrowRight size={15} strokeWidth={2.5} /></>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
          Need an account?{' '}
          <Link
            to="/signup"
            className="font-bold"
            style={{ color: '#1A1A1A', textDecorationLine: 'underline', textUnderlineOffset: '3px' }}
          >
            Create account
          </Link>
        </p>

      </div>
    </div>
  );
}
