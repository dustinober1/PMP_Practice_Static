/**
 * Select component with keyboard navigation and WCAG AA accessibility
 * Native HTML select with enhanced styling
 */
const Select = ({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  ...rest
}) => {
  const describedBy = error || helperText ? `${id}-description` : undefined

  const baseClasses =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none appearance-none dark:bg-zinc-800 dark:text-zinc-50 cursor-pointer'

  const stateClasses = error
    ? 'border-rose-500 dark:border-rose-400'
    : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:focus:border-sky-400 dark:focus:ring-sky-400/20'

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''

  const selectClasses = [baseClasses, stateClasses, disabledClasses, className]
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
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          className={selectClasses}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 dark:text-zinc-400">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
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

export default Select
