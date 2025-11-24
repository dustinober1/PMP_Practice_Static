/**
 * Button component with WCAG AA accessible styling
 * Supports primary, secondary, and ghost variants
 * Includes keyboard navigation and focus indicators
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  ariaLabel,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus-ring disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-700 hover:shadow-lg hover:-translate-y-0.5 dark:bg-sky-500 dark:hover:bg-sky-600 dark:shadow-dark-sm dark:hover:shadow-dark-lg',
    secondary:
      'bg-white text-slate-900 ring-1 ring-slate-200 hover:ring-slate-300 hover:bg-slate-50 hover:shadow-md dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:hover:ring-zinc-600 dark:hover:bg-zinc-700 dark:hover:shadow-dark-md',
    ghost:
      'text-sky-600 hover:bg-sky-50 hover:shadow-sm dark:text-sky-400 dark:hover:bg-zinc-800/50 dark:hover:shadow-dark-sm'
  }

  const widthClass = fullWidth ? 'w-full' : ''

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    widthClass,
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={classes}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
