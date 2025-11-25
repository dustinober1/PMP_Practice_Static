import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { useUserStore } from './stores/useUserStore'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Quiz from './pages/Quiz'
import Exam from './pages/Exam'
import Flashcards from './pages/Flashcards'
import Settings from './pages/Settings'
import siteConfig from './site-config'

function App() {
  const theme = useUserStore((state) => state.theme)

  // Sync theme to HTML element and handle system preference
  useEffect(() => {
    const getEffectiveTheme = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return theme
    }

    const effectiveTheme = getEffectiveTheme()
    const htmlElement = document.documentElement

    if (effectiveTheme === 'dark') {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }, [theme])

  // Listen for system theme changes when set to 'system'
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e) => {
      const htmlElement = document.documentElement
      if (e.matches) {
        htmlElement.classList.add('dark')
      } else {
        htmlElement.classList.remove('dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-zinc-950 dark:text-zinc-50">
      {/* Skip Navigation Link - Hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:block focus:rounded-lg focus:bg-sky-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg dark:focus:bg-sky-500"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header with navigation */}
        <header className="relative flex items-center justify-between gap-4 border-b border-slate-200 pb-6 transition-colors dark:border-zinc-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
              Static PMP Prep
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{siteConfig.siteName}</h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400">{siteConfig.tagline}</p>
          </div>
          {/* Mobile hamburger and desktop nav handled by Navigation component */}
          <Navigation />
        </header>

        {/* Main content landmark */}
        <main id="main-content" className="py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      {/* Footer landmark */}
      <footer className="mt-12 border-t border-slate-200 py-8 transition-colors dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                © 2024 {siteConfig.siteName}. All rights reserved.
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <a
                href="#"
                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
              >
                Accessibility
              </a>
              <a
                href="#"
                className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
