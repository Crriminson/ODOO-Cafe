import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Coffee, ShieldCheck, Zap, Users } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';
import { ROLES } from '../shared/constants';

const getHomeRoute = (role) => (role === ROLES.ADMIN ? '/admin' : '/pos');

const FEATURES = [
  { icon: Zap,         text: 'Real-time kitchen display' },
  { icon: ShieldCheck, text: 'Role-based access control' },
  { icon: Users,       text: 'Multi-floor table management' },
];

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
    <div className="min-h-screen flex" style={{ background: 'var(--color-canvas)' }}>

      {/* ── LEFT PANEL — dark brand ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between p-12 flex-shrink-0"
           style={{ background: '#1A1A1A' }}>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: '#F5C142', boxShadow: 'var(--shadow-md)' }}>
            <Coffee size={20} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
          </div>
          <span className="text-xl font-black text-white tracking-tight">Odoo Cafe</span>
        </div>

        {/* Hero text */}
        <div className="space-y-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
               style={{ color: '#F5C142' }}>Point of Sale</p>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              Run your café<br />at full speed.
            </h1>
            <p className="mt-4 text-base leading-relaxed" style={{ color: '#9CA3AF' }}>
              Orders, kitchen tickets, table management, and reports — all in one place.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(245,193,66,0.12)', border: '1px solid rgba(245,193,66,0.25)' }}>
                  <Icon size={15} strokeWidth={2} style={{ color: '#F5C142' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#D1D5DB' }}>{text}</span>
              </li>
            ))}
          </ul>

          {/* Decorative accent bar */}
          <div className="flex gap-2">
            <div className="h-1 w-12 rounded-full" style={{ background: '#F5C142' }} />
            <div className="h-1 w-6 rounded-full" style={{ background: 'rgba(245,193,66,0.3)' }} />
            <div className="h-1 w-3 rounded-full" style={{ background: 'rgba(245,193,66,0.15)' }} />
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: '#6B7280' }}>
          © {new Date().getFullYear()} Odoo Cafe POS · All rights reserved
        </p>
      </div>

      {/* ── RIGHT PANEL — form ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: '#F5C142', boxShadow: 'var(--shadow-md)' }}>
            <Coffee size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
          </div>
          <span className="text-lg font-black" style={{ color: '#1A1A1A' }}>Odoo Cafe</span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-[400px]">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black leading-tight" style={{ color: '#1A1A1A' }}>
              Welcome back
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
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
                  aria-required="true"
                  className="border-2 rounded-xl px-4 py-3 text-sm w-full bg-white focus:outline-none transition-colors duration-150"
                  style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                  onFocus={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password"
                         className="text-xs font-bold uppercase tracking-widest"
                         style={{ color: '#1A1A1A' }}>
                    Password
                  </label>
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  aria-required="true"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black border-2 transition-colors duration-150"
                style={{
                  background:   loading ? '#E0AE30' : '#F5C142',
                  borderColor:  '#1A1A1A',
                  color:        '#1A1A1A',
                  boxShadow:    'var(--shadow-md)',
                  cursor:       loading ? 'not-allowed' : 'pointer',
                  opacity:      loading ? 0.8 : 1,
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#E0AE30'; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#F5C142'; }}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
                  : <><span>Sign in</span> <ArrowRight size={15} strokeWidth={2.5} /></>
                }
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            Need an account?{' '}
            <Link
              to="/signup"
              className="font-bold transition-colors duration-150"
              style={{ color: '#1A1A1A', textDecorationLine: 'underline', textUnderlineOffset: '3px' }}
              onMouseEnter={(e) => { e.target.style.color = '#F5C142'; }}
              onMouseLeave={(e) => { e.target.style.color = '#1A1A1A'; }}
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
