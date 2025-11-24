import { useMemo } from 'react'
import Select from './Select'
import Button from './Button'
import Card from './Card'

function FlashcardFilters({ domains, tasks, filters, onFilterChange }) {
  const taskOptions = useMemo(() => {
    if (filters.domain === 'all') {
      return tasks
    }
    return tasks.filter((t) => t.domainId === filters.domain)
  }, [filters.domain, tasks])

  const typeOptions = [
    { value: 'all', label: 'All types' },
    { value: 'definition', label: 'Definitions' },
    { value: 'process', label: 'Processes' },
    { value: 'formula', label: 'Formulas' },
    { value: 'concept', label: 'Concepts' }
  ]

  const modeOptions = [
    { value: 'all', label: 'All cards' },
    { value: 'due', label: 'Due today' },
    { value: 'box1', label: 'Box 1 (Daily)' },
    { value: 'box2', label: 'Box 2 (Every 3 days)' },
    { value: 'box3', label: 'Box 3 (Weekly)' },
    { value: 'box4', label: 'Box 4 (Bi-weekly)' },
    { value: 'box5', label: 'Box 5 (Mastered)' }
  ]

  return (
    <Card as="section" className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">Study Filters</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          id="domain-filter"
          label="Domain"
          value={filters.domain}
          onChange={(e) => {
            onFilterChange({ domain: e.target.value, task: 'all' })
          }}
          options={[
            { value: 'all', label: 'All domains' },
            ...domains.map((d) => ({ value: d.id, label: d.name }))
          ]}
        />

        <Select
          id="task-filter"
          label="Task"
          value={filters.task}
          onChange={(e) => {
            onFilterChange({ task: e.target.value })
          }}
          options={[
            { value: 'all', label: 'All tasks' },
            ...taskOptions.map((t) => ({ value: t.id, label: t.title }))
          ]}
          disabled={filters.domain === 'all' && taskOptions.length === 0}
        />

        <Select
          id="type-filter"
          label="Type"
          value={filters.type}
          onChange={(e) => {
            onFilterChange({ type: e.target.value })
          }}
          options={typeOptions}
        />

        <Select
          id="mode-filter"
          label="Study Mode"
          value={filters.mode}
          onChange={(e) => {
            onFilterChange({ mode: e.target.value })
          }}
          options={modeOptions}
        />
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          onFilterChange({ domain: 'all', task: 'all', type: 'all', mode: 'all' })
        }}
        className="w-full sm:w-auto"
      >
        Reset Filters
      </Button>
    </Card>
  )
}

export default FlashcardFilters
