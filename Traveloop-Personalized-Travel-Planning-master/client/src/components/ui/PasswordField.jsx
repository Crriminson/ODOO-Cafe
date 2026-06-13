import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * PasswordField — editorial-style password input with show/hide toggle.
 */
const PasswordField = React.forwardRef(function PasswordField(
  { label, id, error, className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={clsx(
            'border-2 rounded-lg px-3 py-2.5 pr-10 text-sm w-full bg-white text-[#1A1A1A] placeholder-[#9CA3AF]',
            'focus:outline-none focus:ring-0 transition-colors duration-150',
            error
              ? 'border-[#EF4444]'
              : 'border-[#E5E7EB] focus:border-[#1A1A1A]',
            className
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && (
        <p className="text-xs text-[#EF4444] font-medium">{error}</p>
      )}
    </div>
  );
});

export default PasswordField;
