import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { ROLES } from '@/shared/constants';

const getHomeRoute = (role) => (role === ROLES.ADMIN ? '/admin' : '/pos');

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nameInvalid = error && !name;
  const emailInvalid = error && !email;
  const passwordInvalid = error && !password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signup(name, email, password, role);
      const { user } = await import('@/shared/stores/useAuthStore').then(
        (m) => ({ user: m.useAuthStore.getState().user })
      );
      navigate(getHomeRoute(user?.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px]">
        {/* Card */}
        <div
          className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-8"
          style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F5C142] border-2 border-[#1A1A1A] shrink-0"
              style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
            >
              <Coffee size={18} strokeWidth={2.5} className="text-[#1A1A1A]" />
            </div>
            <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-none">
              Sign Up
            </h1>
          </div>
          <p className="text-sm text-[#6B7280] mb-7">Create your staff account</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-name"
                className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]"
              >
                Name <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={nameInvalid || undefined}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Asha Patel"
                className={`w-full px-3.5 py-2.5 rounded-lg border-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors
                  ${nameInvalid
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E5E7EB] focus:border-[#1A1A1A]'
                  }`}
              />
              {nameInvalid && (
                <p className="text-xs text-[#EF4444]">Name is required</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-email"
                className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]"
              >
                Email <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={emailInvalid || undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@odoo-cafe.com"
                className={`w-full px-3.5 py-2.5 rounded-lg border-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors
                  ${emailInvalid
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E5E7EB] focus:border-[#1A1A1A]'
                  }`}
              />
              {emailInvalid && (
                <p className="text-xs text-[#EF4444]">Email is required</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-password"
                className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]"
              >
                Password <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                aria-required="true"
                aria-invalid={passwordInvalid || undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3.5 py-2.5 rounded-lg border-2 text-sm text-[#1A1A1A] placeholder:text-[#9CA3AF] outline-none transition-colors
                  ${passwordInvalid
                    ? 'border-[#EF4444] focus:border-[#EF4444]'
                    : 'border-[#E5E7EB] focus:border-[#1A1A1A]'
                  }`}
              />
              {passwordInvalid && (
                <p className="text-xs text-[#EF4444]">Password is required</p>
              )}
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signup-role"
                className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]"
              >
                Role <span className="text-[#EF4444]">*</span>
              </label>
              <select
                id="signup-role"
                required
                aria-required="true"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border-2 border-[#E5E7EB] focus:border-[#1A1A1A] text-sm text-[#1A1A1A] outline-none transition-colors bg-white"
              >
                <option value={ROLES.EMPLOYEE}>Employee</option>
                <option value={ROLES.ADMIN}>Admin</option>
              </select>
            </div>

            {/* API Error Banner */}
            {error && (
              <div className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-lg p-3 text-sm text-[#EF4444]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F5C142] text-[#1A1A1A] font-black text-sm rounded-lg px-4 py-3 border-2 border-[#1A1A1A] hover:bg-[#E0AE30] transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-sm text-center text-[#6B7280]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#1A1A1A] font-bold underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
