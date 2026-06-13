import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Camera, AlertCircle, Mail } from 'lucide-react';

import AuthLayout from '../components/layout/AuthLayout';
import InputField from '../components/ui/InputField';
import PasswordField from '../components/ui/PasswordField';
import { registerUser, loginUser } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';

// Maps known server error messages → friendly UI copy
const parseRegisterError = (serverMessage = '') => {
  const msg = serverMessage.toLowerCase();
  if (msg.includes('already registered') || msg.includes('email')) {
    return {
      icon: Mail,
      title: 'Email already in use',
      body: 'An account with this email already exists. Try signing in instead.',
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
    title: 'Registration failed',
    body: serverMessage || 'Something went wrong. Please try again.',
  };
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState(null); // { icon, title, body }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      firstName: '', lastName: '',
      email: '',    phone: '',
      city: '',     country: '',
      password: '',
    },
  });

  const firstNameVal = watch('firstName');
  const lastNameVal  = watch('lastName');

  // Live initials preview
  const initials = [firstNameVal?.[0], lastNameVal?.[0]]
    .filter(Boolean).join('').toUpperCase() || null;

  const onSubmit = async (data) => {
    setApiError(null);
    try {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

      // Register
      await registerUser(fullName, data.email, data.password, {
        firstName: data.firstName || undefined,
        lastName:  data.lastName  || undefined,
        phone:     data.phone     || undefined,
        city:      data.city      || undefined,
        country:   data.country   || undefined,
      });

      // Auto-login
      const envelope = await loginUser(data.email, data.password);
      // Server shape: { success: true, data: { accessToken, user }, message }
      setAuth(envelope.data.user, envelope.data.accessToken);
      navigate('/');
    } catch (err) {
      const serverMsg = err.response?.data?.message || '';
      setApiError(parseRegisterError(serverMsg));
    }
  };

  const ErrorIcon = apiError?.icon;

  return (
    <AuthLayout maxWidth="max-w-[640px]">

      {/* Avatar circle with live initials */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full border-2 border-[#1A1A1A] bg-[#F5F0E8]
                     flex items-center justify-center relative"
          style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
        >
          {initials
            ? <span className="text-2xl font-black text-[#1A1A1A]">{initials}</span>
            : <Camera size={24} className="text-[#9CA3AF]" />
          }
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full
                          bg-[#F5C142] border-2 border-[#1A1A1A]
                          flex items-center justify-center">
            <span className="text-xs font-black text-[#1A1A1A] leading-none">+</span>
          </div>
        </div>
      </div>

      {/* Heading */}
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center
                     bg-[#F5C142] border-2 border-[#1A1A1A] flex-shrink-0"
          style={{ boxShadow: '2px 2px 0px #1A1A1A' }}
        >
          <UserPlus size={18} strokeWidth={2.5} className="text-[#1A1A1A]" />
        </div>
        <h1 className="text-[1.5rem] font-black text-[#1A1A1A] leading-tight">Create account</h1>
      </div>
      <p className="text-sm text-[#6B7280] mb-7 ml-12">Start planning your next adventure.</p>

      {/* API error banner */}
      {apiError && (
        <div className="mb-5 rounded-lg border-2 border-[#EF4444] bg-red-50 px-4 py-3 flex gap-3">
          <ErrorIcon size={16} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#EF4444]">{apiError.title}</p>
            <p className="text-xs text-[#EF4444] mt-0.5 leading-relaxed">{apiError.body}</p>
            {/* Quick link to login if email already exists */}
            {apiError.title === 'Email already in use' && (
              <Link
                to="/login"
                className="text-xs font-bold text-[#EF4444] underline underline-offset-2
                           hover:text-red-700 mt-1 inline-block"
              >
                Sign in instead →
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="border-2 border-[#E5E7EB] rounded-xl p-5 flex flex-col gap-4">

          {/* Row 1: First Name | Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="firstName"
              label="First Name"
              type="text"
              placeholder="Jane"
              error={errors.firstName?.message}
              {...register('firstName', {
                required: 'First name is required',
                minLength: { value: 2, message: 'At least 2 characters required' },
                maxLength: { value: 60, message: 'First name is too long' },
              })}
            />
            <InputField
              id="lastName"
              label="Last Name"
              type="text"
              placeholder="Doe"
              error={errors.lastName?.message}
              {...register('lastName', {
                required: 'Last name is required',
                minLength: { value: 1, message: 'Last name is required' },
                maxLength: { value: 60, message: 'Last name is too long' },
              })}
            />
          </div>

          {/* Row 2: Email | Phone Number */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="email"
              label="Email Address"
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
            <InputField
              id="phone"
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              error={errors.phone?.message}
              {...register('phone', {
                pattern: {
                  value: /^[+\d\s\-()]{7,20}$/,
                  message: 'Enter a valid phone number',
                },
              })}
            />
          </div>

          {/* Row 3: City | Country */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="city"
              label="City"
              type="text"
              placeholder="Mumbai"
              error={errors.city?.message}
              {...register('city', {
                maxLength: { value: 100, message: 'City name is too long' },
              })}
            />
            <InputField
              id="country"
              label="Country"
              type="text"
              placeholder="India"
              error={errors.country?.message}
              {...register('country', {
                maxLength: { value: 100, message: 'Country name is too long' },
              })}
            />
          </div>

          {/* Row 4: Password — full width */}
          <PasswordField
            id="password"
            label="Password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
              validate: {
                hasUpper: (v) =>
                  /[A-Z]/.test(v) || 'Must include at least 1 uppercase letter',
                hasNumber: (v) =>
                  /[0-9]/.test(v) || 'Must include at least 1 number',
              },
            })}
          />
        </div>

        {/* Register button — centered below panel */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 bg-[#F5C142]
                       text-[#1A1A1A] font-black text-sm rounded-lg px-10 py-3
                       border-2 border-[#1A1A1A] hover:bg-[#E0AE30]
                       transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            {isSubmitting ? (
              <><Loader2 size={15} className="animate-spin" /> Registering…</>
            ) : (
              'Register Users →'
            )}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-[#6B7280]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-[#1A1A1A] font-bold underline underline-offset-2
                     hover:text-[#F5C142] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default SignupPage;
