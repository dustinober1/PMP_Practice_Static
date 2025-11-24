import { useState, useEffect } from 'react'

/**
 * Toast component with ARIA live regions
 * Announces messages to screen readers in real-time
 * Auto-dismisses after timeout
 */
const Toast = ({
  message,
  type = 'info',
  autoClose = true,
  autoCloseDuration = 3000,
  onClose,
  className = '',
  ...rest
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!autoClose || !isVisible) return

    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, autoCloseDuration)

    return () => clearTimeout(timer)
  }, [autoClose, autoCloseDuration, isVisible, onClose])

  if (!isVisible) return null

  const typeClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    warning:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    error:
      'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
  }

  const baseClasses =
    'fixed bottom-6 right-6 max-w-sm rounded-lg border p-4 shadow-lg animate-slide-up sm:max-w-md'

  const classes = [baseClasses, typeClasses[type], className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      {...rest}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onClose?.()
          }}
          aria-label="Dismiss notification"
          className="text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <span className="text-lg">×</span>
        </button>
      </div>
    </div>
  )
}

export default Toast
