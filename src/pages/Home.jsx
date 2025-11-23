import domains from '../data/domains.json'
import enablers from '../data/enablers.json'
import knowledgeAreas from '../data/knowledge_areas.json'
import processes from '../data/processes.json'
import siteConfig from '../site-config'
import tasks from '../data/tasks.json'

const tasksByDomain = domains.map((domain) => ({
  ...domain,
  tasks: tasks
    .filter((task) => task.domainId === domain.id)
    .map((task) => ({
      ...task,
      enablers: enablers.filter((enabler) => enabler.taskId === task.id)
    }))
}))

const mappedProcesses = processes.map((proc) => ({
  ...proc,
  knowledgeArea: knowledgeAreas.find((ka) => ka.id === proc.knowledgeAreaId)
}))

function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <p className="text-sm font-semibold text-sky-600">Static & Local-first</p>
        <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          {siteConfig.siteName}
        </h2>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">{siteConfig.description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-100 transition hover:bg-sky-700"
            href="/settings"
          >
            Settings & data export
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 transition hover:ring-slate-300"
            href={siteConfig.repoUrl}
            target="_blank"
            rel="noreferrer"
          >
            View repository
          </a>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Domain data
          </p>
          <h3 className="text-xl font-semibold text-slate-900">PMP domains & tasks</h3>
          <p className="text-sm text-slate-600">
            Loaded from static JSON to validate the data folder structure.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tasksByDomain.map((domain) => (
            <article
              key={domain.id}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{domain.name}</h4>
                  <p className="text-sm text-slate-600">{domain.summary}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {domain.tasks.length} tasks
                </span>
              </div>

              <div className="space-y-2">
                {domain.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-600">{task.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      Enablers:{' '}
                      {task.enablers.map((enabler) => enabler.text).join(' · ') || 'TBD'}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Process library
            </p>
            <h3 className="text-xl font-semibold text-slate-900">Processes & knowledge areas</h3>
            <p className="text-sm text-slate-600">
              A small snapshot to keep the folder pattern consistent with the high-level plan.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {knowledgeAreas.length} knowledge areas · {processes.length} processes
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {mappedProcesses.map((proc) => (
            <article
              key={proc.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                {proc.processGroup}
              </p>
              <h4 className="mt-1 text-lg font-semibold text-slate-900">{proc.name}</h4>
              <p className="mt-1 text-sm text-slate-600">{proc.summary}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Knowledge area:{' '}
                <span className="font-normal text-slate-600">
                  {proc.knowledgeArea?.name ?? 'Not mapped'}
                </span>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/80 p-5">
        <h3 className="text-lg font-semibold text-slate-900">Next steps in the plan</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
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
