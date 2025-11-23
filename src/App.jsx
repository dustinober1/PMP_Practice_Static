import { NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Quiz from './pages/Quiz'
import Settings from './pages/Settings'
import siteConfig from './site-config'

const navLinkClass = ({ isActive }) =>
  [
    'rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sky-600 text-white shadow-sm shadow-sky-100'
      : 'text-slate-700 hover:bg-slate-100'
  ].join(' ')

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Static PMP Prep
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{siteConfig.siteName}</h1>
            <p className="text-sm text-slate-600">{siteConfig.tagline}</p>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/quiz" className={navLinkClass}>
              Quiz
            </NavLink>
            <NavLink to="/settings" className={navLinkClass}>
              Settings
            </NavLink>
          </nav>
        </header>

        <main className="py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
