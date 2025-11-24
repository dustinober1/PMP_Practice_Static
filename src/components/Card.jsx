/**
 * Card component with semantic HTML and dark mode support
 * Uses <article> for standalone content, <section> when grouped
 * Smooth animations and transitions for modern feel
 */
const Card = ({
  children,
  as = 'article',
  className = '',
  hoverable = false,
  animated = true,
  ...rest
}) => {
  const Component = as

  const baseClasses =
    'rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-700 sm:p-8'

  const transitionClasses = animated ? 'transition-all duration-300' : ''

  const hoverClasses = hoverable
    ? 'hover:shadow-lg hover:ring-slate-200 dark:hover:shadow-dark-lg dark:hover:ring-zinc-600 hover:-translate-y-1'
    : ''

  const classes = [baseClasses, transitionClasses, hoverClasses, className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  )
}

export default Card
