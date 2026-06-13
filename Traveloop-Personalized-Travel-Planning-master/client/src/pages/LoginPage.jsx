import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, LogIn, AlertCircle, UserX, KeyRound } from 'lucide-react';

import AuthLayout from '../components/layout/AuthLayout';
import InputField from '../components/ui/InputField';
import PasswordField from '../components/ui/PasswordField';
import { loginUser } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

// Maps known server error messages → friendly UI copy
const parseLoginError = (serverMessage = '') => {
  const msg = serverMessage.toLowerCase();
  if (msg.includes('invalid email or password')) {
    return {
      icon: KeyRound,
      title: 'Incorrect credentials',
      body: "The email or password you entered doesn't match our records. Please try again.",
    };
  }
  if (msg.includes('too many')) {
    return {
      icon: AlertCircle,
      title: 'Too many attempts',
      body: 'Please wait 15 minutes before trying again.',
    };
  }
  return {
    icon: AlertCircle,
    title: 'Login failed',
    body: serverMessage || 'Something went wrong. Please try again.',
  };
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState(null); // { icon, title, body }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      const envelope = await loginUser(data.email, data.password);
      // Server shape: { success: true, data: { accessToken, user }, message }
      setAuth(envelope.data.user, envelope.data.accessToken);
      navigate('/');
    } catch (err) {
      const serverMsg = err.response?.data?.message || '';
      setApiError(parseLoginError(serverMsg));
    }
  };

  const ErrorIcon = apiError?.icon;

  return (
    <AuthLayout>
      {/* Avatar / photo circle */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full border-2 border-[#1A1A1A] bg-[#F5F0E8]
                     flex items-center justify-center"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
        >
          <span className="text-2xl font-black text-[#F5C142] leading-none select-none">T</span>
        </div>
      </div>

      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center
                     bg-[#F5C142] border-2 border-[#1A1A1A] flex-shrink-0"
          style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
        >
          <LogIn size={18} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Welcome back</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-7 ml-12">
        Sign in to continue planning your trips.
      </p>

      {/* API error banner — shows specific, friendly message */}
      {apiError && (
        <div className="mb-5 rounded-lg border-2 border-[#EF4444] bg-red-50 px-4 py-3 flex gap-3">
          <ErrorIcon size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#EF4444]">{apiError.title}</p>
            <p className="text-xs text-[#EF4444] mt-0.5 leading-relaxed">{apiError.body}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <InputField
          id="email"
          label="Username / Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email address is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
        />

        <PasswordField
          id="password"
          label="Password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
          })}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex items-center justify-center gap-2 w-full bg-[#F5C142]
                     text-[#1A1A1A] font-black text-sm rounded-lg px-4 py-3
                     border-2 border-[#1A1A1A] hover:bg-[#E0AE30]
                     transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
        >
          {isSubmitting ? (
            <><Loader2 size={15} className="animate-spin" /> Signing in…</>
          ) : (
            'Login →'
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[#E5E7EB]" />
        <span className="text-xs text-[#9CA3AF] font-medium">OR</span>
        <div className="flex-1 h-px bg-[#E5E7EB]" />
      </div>

      <p className="text-center text-sm text-[#6B7280]">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="text-[#1A1A1A] font-bold underline underline-offset-2
                     hover:text-[#F5C142] transition-colors"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
