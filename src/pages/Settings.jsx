function Settings() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          This page will house local-first preferences (name, theme, donation receipts) and
          progress exports powered by zustand + localStorage.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Theme preference</p>
            <p className="text-sm text-slate-600">Light, Dark, and “follow system” toggles.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Progress</p>
            <p className="text-sm text-slate-600">
              Question completions, flashcard ratings, and read materials will live here.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-slate-900">Export data</p>
          <p className="text-sm text-slate-600">
            Download a JSON backup of your progress to move devices or keep a personal copy.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
            disabled
          >
            Coming soon
          </button>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-slate-900">Import data</p>
          <p className="text-sm text-slate-600">
            Restore a saved file and merge it with anything already stored in the browser.
          </p>
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm"
            disabled
          >
            Coming soon
          </button>
        </div>
      </section>
    </div>
  )
}

export default Settings
