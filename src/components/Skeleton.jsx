/**
 * Skeleton component for loading states
 * Animated shimmer effect for WCAG AA compliance
 */
const Skeleton = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  circle = false,
  count = 1,
  ...rest
}) => {
  const baseClasses = `${width} ${height} bg-slate-200 dark:bg-zinc-700 animate-pulse-subtle`
  const circleClasses = circle ? 'rounded-full' : 'rounded-lg'
  const classes = `${baseClasses} ${circleClasses} ${className}`

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={classes} {...rest} />
      ))}
    </>
  )
}

/**
 * Skeleton card component for loading list states
 */
export const SkeletonCard = () => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-700 sm:p-8">
    <div className="space-y-4">
      <Skeleton height="h-8" width="w-1/2" />
      <Skeleton height="h-4" count={3} />
      <div className="pt-2">
        <Skeleton height="h-10" width="w-1/3" />
      </div>
    </div>
  </div>
)

export default Skeleton
