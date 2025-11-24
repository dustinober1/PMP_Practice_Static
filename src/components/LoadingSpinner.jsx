/**
 * LoadingSpinner component with accessible ARIA attributes
 * Announces loading state to screen readers via aria-live
 */
const LoadingSpinner = ({
  size = 'md',
  label = 'Loading',
  fullHeight = false,
  className = '',
  ...rest
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const containerClasses = fullHeight
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center'

  return (
    <div className={containerClasses} {...rest}>
      <div
        className={`${sizeClasses[size]} border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin dark:border-zinc-700 dark:border-t-sky-400`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
      </div>
    </div>
  )
}

export default LoadingSpinner
