import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Coffee } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';
import { ROLES, AUTH_ROLES } from '../shared/constants';

const ROLES_META = {
  admin:    { label: 'Admin',    desc: 'Full dashboard access' },
  employee: { label: 'Employee', desc: 'POS terminal access' },
};

export default function SignupPage() {
  const navigate   = useNavigate();
  const { signup } = useAuth();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: AUTH_ROLES[1] });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(form);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputCls = 'border-2 rounded-xl px-4 py-3 text-sm w-full bg-white focus:outline-none transition-colors duration-150';

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--color-canvas)' }}>

      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
               style={{ background: '#F5C142', boxShadow: 'var(--shadow-md)' }}>
            <Coffee size={20} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
          </div>
          <span className="text-xl font-black tracking-tight" style={{ color: '#1A1A1A' }}>
            Odoo Cafe
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black leading-tight" style={{ color: '#1A1A1A' }}>
            Create account
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: '#6B7280' }}>
            Set up your staff access in seconds.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 border-2"
             style={{ borderColor: '#1A1A1A', boxShadow: 'var(--shadow-xl)' }}>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-name"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Asha Patel"
                autoComplete="name"
                required
                className={inputCls}
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; }}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="name@odoo-cafe.com"
                autoComplete="email"
                required
                className={inputCls}
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password"
                     className="text-xs font-bold uppercase tracking-widest"
                     style={{ color: '#1A1A1A' }}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength="6"
                required
                className={inputCls}
                style={{ borderColor: '#E5E7EB', color: '#1A1A1A' }}
                onFocus={(e) => { e.target.style.borderColor = '#1A1A1A'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#E5E7EB'; }}
              />
            </div>

            {/* Role toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#1A1A1A' }}>
                Role
              </span>
              <div className="grid grid-cols-2 gap-2">
                {AUTH_ROLES.map((role) => {
                  const meta   = ROLES_META[role] || { label: role, desc: '' };
                  const active = form.role === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role }))}
                      className="flex flex-col items-start px-4 py-3 rounded-xl border-2 text-left transition-colors duration-150"
                      style={{
                        background:  active ? '#F5C142' : '#fff',
                        borderColor: '#1A1A1A',
                        boxShadow:   active ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: '#1A1A1A' }}>{meta.label}</span>
                      <span className="text-[11px] mt-0.5" style={{ color: active ? '#1A1A1A' : '#9CA3AF' }}>
                        {meta.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
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
              id="signup-submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-black border-2 transition-colors duration-150"
              style={{
                background:  loading ? '#E0AE30' : '#F5C142',
                borderColor: '#1A1A1A',
                color:       '#1A1A1A',
                boxShadow:   'var(--shadow-md)',
                cursor:      loading ? 'not-allowed' : 'pointer',
                opacity:     loading ? 0.8 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#E0AE30'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#F5C142'; }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : <><span>Create account</span><ArrowRight size={15} strokeWidth={2.5} /></>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm mt-5" style={{ color: '#6B7280' }}>
          Already have access?{' '}
          <Link
            to="/login"
            className="font-bold"
            style={{ color: '#1A1A1A', textDecorationLine: 'underline', textUnderlineOffset: '3px' }}
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}
