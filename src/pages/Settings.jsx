import { useRef, useState } from 'react'
import { useProgressStore } from '../stores/useProgressStore'
import { useUserStore } from '../stores/useUserStore'

const exportToFile = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  link.href = url
  link.download = `pmp-practice-export-${timestamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const buildPayload = () => {
  const userState = useUserStore.getState()
  const progressState = useProgressStore.getState()
  return {
    exportedAt: new Date().toISOString(),
    user: {
      name: userState.name,
      theme: userState.theme,
      donationCodes: userState.donationCodes
    },
    progress: {
      completedQuestions: progressState.completedQuestions,
      flashcardRatings: progressState.flashcardRatings,
      readMaterials: progressState.readMaterials
    }
  }
}

function Settings() {
  const fileInputRef = useRef(null)
  const [donationInput, setDonationInput] = useState('')
  const [importStatus, setImportStatus] = useState({ type: '', message: '' })

  const { name, theme, donationCodes } = useUserStore((state) => ({
    name: state.name,
    theme: state.theme,
    donationCodes: state.donationCodes
  }))
  const { setName, setTheme, addDonationCode, importUser, resetUser } = useUserStore((state) => ({
    setName: state.setName,
    setTheme: state.setTheme,
    addDonationCode: state.addDonationCode,
    importUser: state.importUser,
    resetUser: state.resetUser
  }))

  const { completedQuestions, flashcardRatings, readMaterials } = useProgressStore((state) => ({
    completedQuestions: state.completedQuestions,
    flashcardRatings: state.flashcardRatings,
    readMaterials: state.readMaterials
  }))
  const { importProgress, resetProgress } = useProgressStore((state) => ({
    importProgress: state.importProgress,
    resetProgress: state.resetProgress
  }))

  const handleAddDonationCode = () => {
    addDonationCode(donationInput)
    setDonationInput('')
  }

  const handleExport = () => {
    const payload = buildPayload()
    exportToFile(payload)
    setImportStatus({ type: 'success', message: 'Exported data to a JSON file.' })
  }

  const handleImportFile = async (file) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid file structure')
      }
      if (parsed.user) {
        importUser(parsed.user)
      }
      if (parsed.progress) {
        importProgress(parsed.progress)
      }
      setImportStatus({ type: 'success', message: 'Imported data successfully.' })
    } catch (err) {
      setImportStatus({
        type: 'error',
        message: `Import failed: ${err.message || 'Unknown error'}`
      })
    }
  }

  const handleFileChange = async (event) => {
    const [file] = event.target.files || []
    if (file) {
      await handleImportFile(file)
      event.target.value = ''
    }
  }

  const completionCount = completedQuestions.length
  const ratingsCount = Object.keys(flashcardRatings).length
  const materialsCount = readMaterials.length

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          Local-first preferences and progress. Data persists in your browser; export a backup to
          move between devices.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Profile</p>
            <label className="mt-3 block text-sm font-medium text-slate-700" htmlFor="name">
              Name (optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none"
              placeholder="Add your name"
            />

            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="system">System default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Donation codes</p>
            <p className="text-sm text-slate-600">
              Track coffee/Ko-fi codes you have redeemed to keep your own record.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={donationInput}
                onChange={(e) => setDonationInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none"
                placeholder="Enter code"
              />
              <button
                type="button"
                onClick={handleAddDonationCode}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Add
              </button>
            </div>
            {donationCodes.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-slate-700">
                {donationCodes.map((code) => (
                  <li
                    key={code}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 ring-1 ring-slate-200"
                  >
                    <span className="font-mono text-xs text-slate-700">{code}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No codes saved yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Progress snapshot</h3>
            <p className="text-sm text-slate-600">
              Stored in localStorage via zustand persistence.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-100 transition hover:bg-sky-700"
            >
              Export data
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:ring-slate-300"
            >
              Import data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Questions
            </p>
            <p className="text-2xl font-bold text-slate-900">{completionCount}</p>
            <p className="text-sm text-slate-600">Completed question IDs</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cards</p>
            <p className="text-2xl font-bold text-slate-900">{ratingsCount}</p>
            <p className="text-sm text-slate-600">Flashcard ratings saved</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Materials
            </p>
            <p className="text-2xl font-bold text-slate-900">{materialsCount}</p>
            <p className="text-sm text-slate-600">Items marked as read</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              resetUser()
              resetProgress()
              setImportStatus({ type: 'success', message: 'Reset local data.' })
            }}
            className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-300"
          >
            Reset local data
          </button>
        </div>

        {importStatus.message ? (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              importStatus.type === 'error'
                ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
            }`}
          >
            {importStatus.message}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default Settings
