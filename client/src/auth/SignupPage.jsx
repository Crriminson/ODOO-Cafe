import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';
import { AUTH_ROLES } from '../shared/constants';

const inputStyle = {
  borderColor: '#E5E7EB',
  color: '#1A1A1A',
};

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: AUTH_ROLES[1] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signup(form);
      navigate('/login', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to create the account');
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = 'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white transition-colors duration-150 focus:outline-none';
  const labelCls = 'text-xs font-bold uppercase tracking-widest';

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'var(--color-canvas)' }}>
      <div className="w-full max-w-[420px] space-y-6">

        {/* Brand mark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 flex-shrink-0"
               style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-md)' }}>
            <span className="text-sm font-black" style={{ color: '#1A1A1A' }}>☕</span>
          </div>
          <span className="text-[1.5rem] font-black leading-tight" style={{ color: '#1A1A1A' }}>
            Odoo Cafe POS
          </span>
        </div>

        {/* Auth card */}
        <div className="bg-white rounded-2xl p-8 border-2"
             style={{ borderColor: '#1A1A1A', boxShadow: 'var(--shadow-xl)' }}>

          {/* Heading */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center border-2 flex-shrink-0"
                 style={{ background: '#F5C142', borderColor: '#1A1A1A', boxShadow: 'var(--shadow-sm)' }}>
              <UserPlus size={18} strokeWidth={2.5} style={{ color: '#1A1A1A' }} />
            </div>
            <h1 className="text-[1.5rem] font-black leading-tight" style={{ color: '#1A1A1A' }}>
              New account
            </h1>
          </div>
          <p className="text-sm mb-6 ml-12" style={{ color: '#6B7280' }}>
            Create staff access for admin or employee.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Name + Role row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="signup-name" className={labelCls} style={{ color: '#1A1A1A' }}>
                  Name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Asha Patel"
                  autoComplete="name"
                  required
                  aria-required="true"
                  className={fieldCls}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="signup-role" className={labelCls} style={{ color: '#1A1A1A' }}>
                  Role <span aria-hidden="true">*</span>
                </label>
                <select
                  id="signup-role"
                  value={form.role}
                  onChange={(e) => setForm((c) => ({ ...c, role: e.target.value }))}
                  required
                  aria-required="true"
                  className={fieldCls}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                >
                  {AUTH_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="signup-email" className={labelCls} style={{ color: '#1A1A1A' }}>
                Email <span aria-hidden="true">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="name@odoo-cafe.com"
                autoComplete="email"
                required
                aria-required="true"
                className={fieldCls}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#1A1A1A')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="signup-password" className={labelCls} style={{ color: '#1A1A1A' }}>
                Password <span aria-hidden="true">*</span>
              </label>
              <input
                id="signup-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength="6"
                required
                aria-required="true"
                className={fieldCls}
                style={inputStyle}
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

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black border-2 transition-colors duration-150"
              style={{
                background: '#F5C142',
                borderColor: '#1A1A1A',
                color: '#1A1A1A',
                boxShadow: 'var(--shadow-md)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Creating…</>
              ) : (
                'Create account'
              )}
            </button>

            <p className="text-sm text-center" style={{ color: '#6B7280' }}>
              Already have access?{' '}
              <Link
                to="/login"
                className="font-bold underline underline-offset-2 transition-colors duration-150"
                style={{ color: '#1A1A1A' }}
                onMouseEnter={(e) => (e.target.style.color = '#F5C142')}
                onMouseLeave={(e) => (e.target.style.color = '#1A1A1A')}
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-xs" style={{ color: '#9CA3AF' }}>
          Odoo Cafe POS · Staff accounts only
        </p>
      </div>
    </div>
  );
}
