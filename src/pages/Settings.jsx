import { useRef, useState } from 'react'
import { useProgressStore } from '../stores/useProgressStore'
import { useUserStore } from '../stores/useUserStore'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Badge from '../components/Badge'
import Toast from '../components/Toast'

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

  const themeOptions = [
    { value: 'system', label: 'System default' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' }
  ]

  return (
    <div className="space-y-8">
      <Card as="section">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50">Settings</h2>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Local-first preferences and progress. Data persists in your browser; export a backup to
            move between devices.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">Profile</p>
            <div className="mt-3 space-y-4">
              <Input
                id="name"
                label="Name (optional)"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Add your name"
              />
              <Select
                id="theme"
                label="Theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                options={themeOptions}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">Donation codes</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Track coffee/Ko-fi codes you have redeemed to keep your own record.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                id="donation-input"
                type="text"
                value={donationInput}
                onChange={(e) => setDonationInput(e.target.value)}
                placeholder="Enter code"
                className="flex-1"
              />
              <Button
                size="md"
                onClick={handleAddDonationCode}
                ariaLabel="Add donation code"
              >
                Add
              </Button>
            </div>
            {donationCodes.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {donationCodes.map((code) => (
                  <li
                    key={code}
                    className="flex items-center justify-between rounded-md bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-zinc-700 dark:ring-zinc-600"
                  >
                    <code className="text-xs font-mono text-slate-700 dark:text-zinc-300">{code}</code>
                    <Badge variant="success" size="xs">
                      Redeemed
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">No codes saved yet.</p>
            )}
          </div>
        </div>
      </Card>

      <Card as="section">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">Progress snapshot</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              Stored in localStorage via zustand persistence.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="primary" onClick={handleExport}>
              Export data
            </Button>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Import data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import data file"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Questions
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-zinc-50">{completionCount}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Completed question IDs</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">Cards</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-zinc-50">{ratingsCount}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Flashcard ratings saved</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Materials
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-zinc-50">{materialsCount}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Items marked as read</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              resetUser()
              resetProgress()
              setImportStatus({ type: 'success', message: 'Reset local data.' })
            }}
          >
            Reset local data
          </Button>
        </div>

        {importStatus.message && (
          <Toast
            message={importStatus.message}
            type={importStatus.type}
            autoClose={true}
            autoCloseDuration={3000}
            onClose={() => setImportStatus({ type: '', message: '' })}
          />
        )}
      </Card>
    </div>
  )
}

export default Settings
