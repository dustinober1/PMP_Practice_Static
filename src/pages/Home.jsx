import { useMemo } from 'react'
import { useStaticData } from '../hooks/useStaticData'
import siteConfig from '../site-config'
import Card from '../components/Card'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'

function Home() {
  const { data, loading, error } = useStaticData()

  const {
    domains = [],
    tasks = [],
    enablers = [],
    processes = [],
    knowledgeAreas = []
  } = data || {}

  const tasksByDomain = useMemo(
    () =>
      domains.map((domain) => ({
        ...domain,
        tasks: tasks
          .filter((task) => task.domainId === domain.id)
          .map((task) => ({
            ...task,
            enablers: enablers.filter((enabler) => enabler.taskId === task.id)
          }))
      })),
    [domains, tasks, enablers]
  )

  const mappedProcesses = useMemo(
    () =>
      processes.map((proc) => ({
        ...proc,
        knowledgeArea: knowledgeAreas.find((ka) => ka.id === proc.knowledgeAreaId)
      })),
    [processes, knowledgeAreas]
  )

  if (loading) {
    return <LoadingSpinner fullHeight={true} label="Loading application data" />
  }

  if (error) {
    return (
      <Card>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">Error loading data</p>
          <p className="text-sm text-rose-600 dark:text-rose-300">{error.message}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-10">
      <Card as="section">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">Static & Local-first</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-zinc-50 sm:text-4xl">
              {siteConfig.siteName}
            </h2>
          </div>
          <p className="text-base text-slate-600 dark:text-zinc-400 sm:text-lg">{siteConfig.description}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
              href="/quiz"
            >
              Practice Quiz
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              href="/flashcards"
            >
              Study Flashcards
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:ring-slate-300 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-zinc-700 dark:hover:ring-zinc-600"
              href={siteConfig.repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              View repository
            </a>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
            Domain data
          </p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">PMP domains & tasks</h3>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Loaded from static JSON to validate the data folder structure.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tasksByDomain.map((domain) => (
            <Card key={domain.id} as="article" hoverable>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">{domain.name}</h4>
                  <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{domain.summary}</p>
                </div>
                <Badge variant="primary" size="sm">
                  {domain.tasks.length} tasks
                </Badge>
              </div>

              <div className="mt-4 space-y-2">
                {domain.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-zinc-700 dark:bg-zinc-800/50"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-zinc-50">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{task.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
                      Enablers:{' '}
                      {task.enablers.map((enabler) => enabler.text).join(' · ') || 'TBD'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Process library
            </p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-zinc-50">Processes & knowledge areas</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              A small snapshot to keep the folder pattern consistent with the high-level plan.
            </p>
          </div>
          <Badge variant="default" size="sm" className="w-fit">
            {knowledgeAreas.length} areas · {processes.length} processes
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {mappedProcesses.map((proc) => (
            <Card key={proc.id} as="article" hoverable>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
                {proc.processGroup}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-slate-900 dark:text-zinc-50">{proc.name}</h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{proc.summary}</p>
              <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Knowledge area:{' '}
                <span className="font-normal text-slate-600 dark:text-zinc-400">
                  {proc.knowledgeArea?.name ?? 'Not mapped'}
                </span>
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">Next steps in the plan</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-zinc-300">
          <li>Week 2: Add data loading utilities and surface questions on the homepage.</li>
          <li>Week 3: Wire zustand stores for user preferences and progress (localStorage).</li>
          <li>Week 4+: Build quiz and flashcard UIs with lazy-loaded JSON question banks.</li>
          <li>Week 13: Add donation routes/buttons and connect to Buy Me a Coffee or Ko-fi.</li>
        </ul>
      </section>
    </div>
  )
}

export default Home
