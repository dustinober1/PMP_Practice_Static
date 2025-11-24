/**
 * Input component with WCAG AA accessible design
 * Includes label association, error states, and ARIA descriptions
 */
const Input = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  helperText,
  ariaLabel,
  className = '',
  ...rest
}) => {
  const describedBy = error || helperText ? `${id}-description` : undefined

  const baseClasses =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none dark:bg-zinc-800 dark:text-zinc-50'

  const stateClasses = error
    ? 'border-rose-500 dark:border-rose-400'
    : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:focus:border-sky-400 dark:focus:ring-sky-400/20'

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''

  const inputClasses = [baseClasses, stateClasses, disabledClasses, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-900 dark:text-zinc-50">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel || label}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={inputClasses}
        {...rest}
      />
      {(error || helperText) && (
        <p
          id={`${id}-description`}
          className={`text-xs ${
            error
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-600 dark:text-zinc-400'
          }`}
          role={error ? 'alert' : undefined}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}

export default Input
