import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">404</p>
      <h2 className="text-2xl font-bold text-slate-900">Page not found</h2>
      <p className="text-sm text-slate-600">
        The page you are looking for does not exist yet. Head back to the main study area.
      </p>
      <Link
        to="/"
        className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-100 transition hover:bg-sky-700"
      >
        Return home
      </Link>
    </div>
  )
}

export default NotFound
