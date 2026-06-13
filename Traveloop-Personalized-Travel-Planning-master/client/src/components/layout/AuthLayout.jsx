import React from 'react';

/**
 * Shared AuthLayout — TripWise-inspired editorial aesthetic.
 * @param {string} maxWidth - Tailwind max-w class (default: 'max-w-[420px]')
 */
const AuthLayout = ({ children, maxWidth = 'max-w-[420px]' }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#F5F0E8' }}
    >
      <div className={`w-full ${maxWidth}`}>

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="text-[2rem] font-black tracking-tight leading-none text-[#1A1A1A]">
            Travel
          </span>
          <span className="text-[2rem] font-black tracking-tight leading-none text-[#F5C142]">
            oop
          </span>
        </div>

        {/* Card — editorial: dark border + offset shadow */}
        <div
          className="bg-white border-2 border-[#1A1A1A] rounded-2xl p-8"
          style={{ boxShadow: '6px 6px 0px #1A1A1A' }}
        >
          {children}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-[#6B7280] mt-6">
          Personalized travel planning, made simple.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
