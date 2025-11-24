import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

/**
 * Navigation component with hamburger menu for mobile
 * Keyboard accessible with Escape to close
 * WCAG AA compliant with proper ARIA attributes
 */
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  // Close menu when Escape is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Close menu when a link is clicked
  const handleNavClick = () => {
    setIsOpen(false)
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const navLinkClass = ({ isActive }) =>
    [
      'block rounded-lg px-4 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-sky-600 text-white dark:bg-sky-500'
        : 'text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
    ].join(' ')

  return (
    <>
      {/* Hamburger Button - Mobile only */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 transition-colors hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            // Close icon
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            // Hamburger icon
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Navigation Links - Desktop and Mobile */}
      <nav
        id="mobile-nav"
        ref={menuRef}
        aria-label="Main navigation"
        className={`absolute left-0 right-0 top-full z-50 flex-col gap-1 border-b border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:static md:flex md:gap-2 md:border-0 md:bg-transparent md:p-0 dark:md:bg-transparent ${
          isOpen ? 'flex animate-slide-down' : 'hidden'
        }`}
      >
        <NavLink
          to="/"
          end
          className={navLinkClass}
          onClick={handleNavClick}
        >
          Home
        </NavLink>
        <NavLink
          to="/quiz"
          className={navLinkClass}
          onClick={handleNavClick}
        >
          Quiz
        </NavLink>
        <NavLink
          to="/flashcards"
          className={navLinkClass}
          onClick={handleNavClick}
        >
          Flashcards
        </NavLink>
        <NavLink
          to="/settings"
          className={navLinkClass}
          onClick={handleNavClick}
        >
          Settings
        </NavLink>
      </nav>

      {/* Mobile backdrop when menu is open */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
          className="fixed inset-0 z-40 md:hidden"
        />
      )}
    </>
  )
}

export default Navigation
