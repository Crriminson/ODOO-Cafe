import React from 'react';

/**
 * Premium Button component supporting primary, secondary, danger, and outline variants.
 * Handles loading spinner state automatically.
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${loading ? 'btn-loading' : ''} ${className}`}
      {...props}
    >
      {loading ? <span className="spinner-sm"></span> : children}
    </button>
  );
}
