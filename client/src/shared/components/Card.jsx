const variantClasses = {
  page: 'bg-white rounded-2xl p-8 shadow-xl',
  content: 'bg-white rounded-xl p-4 shadow-lg',
  inner: 'bg-white rounded-xl p-5 border border-[#E5E7EB]'
};

export function Card({ variant = 'content', className = '', children, onClick, ...rest }) {
  const isClickable = typeof onClick === 'function';
  const classes = [
    variantClasses[variant] ?? variantClasses.content,
    variant === 'content' && isClickable ? 'transition-transform duration-150 hover:translate-y-[-2px] cursor-pointer' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...rest}>
      {children}
    </div>
  );
}

export default Card;
const variantClasses = {
  page: 'bg-white rounded-2xl p-8 shadow-xl',
  content: 'bg-white rounded-xl p-4 shadow-lg',
  inner: 'bg-white rounded-xl p-5 border border-[#E5E7EB]'
};

export function Card({ variant = 'content', className = '', children, onClick, ...rest }) {
  const isClickable = typeof onClick === 'function';
  const classes = [
    variantClasses[variant] ?? variantClasses.content,
    variant === 'content' && isClickable ? 'transition-transform duration-150 hover:translate-y-[-2px] cursor-pointer' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...rest}>
      {children}
    </div>
  );
}

export default Card;
export default function Card({ className = '', children, ...props }) {
  return (
    <section className={`panel panel-pad ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}