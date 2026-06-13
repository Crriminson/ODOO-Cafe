const baseClasses =
  'min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 transition-all duration-150 flex items-center justify-center gap-2';

const variantClasses = {
  primary: 'bg-[#714867] text-[#1A1A1A] font-black hover:brightness-95',
  secondary: 'bg-white text-[#1A1A1A] font-bold border border-[#E5E7EB] hover:bg-gray-50',
  danger: 'bg-[#EF4444] text-white font-bold hover:bg-red-600',
  ghost: 'bg-transparent text-[#6B7280] font-medium hover:bg-gray-100'
};

const Spinner = () => (
  <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const isDisabled = disabled || loading;
  const classes = [
    baseClasses,
    variantClasses[variant] ?? variantClasses.primary,
    isDisabled ? 'opacity-40 pointer-events-none' : '',
    loading ? 'pointer-events-none' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} onClick={onClick} disabled={isDisabled} {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  );
}

export default Button;

