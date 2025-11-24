/**
 * Badge component with WCAG AA color contrast
 * Supports multiple status and color variants
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  ...rest
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-semibold transition-colors'

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm'
  }

  const variantClasses = {
    default:
      'bg-slate-100 text-slate-700 dark:bg-zinc-700 dark:text-zinc-100',
    primary:
      'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    success:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    error:
      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
  }

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}

export default Badge
