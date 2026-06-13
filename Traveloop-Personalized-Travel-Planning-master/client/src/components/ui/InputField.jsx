import React from 'react';
import { clsx } from 'clsx';

/**
 * InputField — editorial-style input matching TripWise aesthetic.
 * Strong border, clean focus ring in amber.
 */
const InputField = React.forwardRef(function InputField(
  { label, id, error, className, ...props },
  ref
) {
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
      <input
        id={id}
        ref={ref}
        className={clsx(
          'border-2 rounded-lg px-3 py-2.5 text-sm w-full bg-white text-[#1A1A1A] placeholder-[#9CA3AF]',
          'focus:outline-none focus:ring-0 transition-colors duration-150',
          error
            ? 'border-[#EF4444]'
            : 'border-[#E5E7EB] focus:border-[#1A1A1A]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-[#EF4444] font-medium">{error}</p>
      )}
    </div>
  );
});

export default InputField;
