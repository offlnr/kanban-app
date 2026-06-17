import { useTranslation } from 'react-i18next'
import type { WorkPackage, TaskPriority } from '../../types'

const PRIORITY_KEYS = ['critical', 'high', 'medium', 'low'] as const

const PRIORITY_STYLES: Record<string, { active: string; inactive: string }> = {
  critical: {
    active:   'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
    inactive: 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-700 hover:text-red-500 dark:hover:text-red-400',
  },
  high: {
    active:   'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700',
    inactive: 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 hover:text-orange-500 dark:hover:text-orange-400',
  },
  medium: {
    active:   'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    inactive: 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-yellow-200 dark:hover:border-yellow-700 hover:text-yellow-600 dark:hover:text-yellow-400',
  },
  low: {
    active:   'bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
    inactive: 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 hover:text-green-600 dark:hover:text-green-400',
  },
}

interface Props {
  workPackages: WorkPackage[]
  priorities: TaskPriority[]
  workPackageId: number | null
  totalTasks: number
  visibleTasks: number
  onPriorityToggle: (p: TaskPriority) => void
  onWorkPackageChange: (id: number | null) => void
  onClear: () => void
}

export default function KanbanFilters({
  workPackages, priorities, workPackageId,
  totalTasks, visibleTasks,
  onPriorityToggle, onWorkPackageChange, onClear,
}: Props) {
  const { t } = useTranslation()
  const isFiltered = priorities.length > 0 || workPackageId !== null

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-5 px-1">
      {/* Priority chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">{t('filters.priority_label')}</span>
        {PRIORITY_KEYS.map((p) => {
          const { active, inactive } = PRIORITY_STYLES[p]
          return (
            <button
              key={p}
              onClick={() => onPriorityToggle(p)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${priorities.includes(p) ? active : inactive}`}
            >
              {t(`priority.${p}`)}
            </button>
          )
        })}
      </div>

      {/* Work package dropdown */}
      {workPackages.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">{t('filters.wp_label')}</span>
          <select
            value={workPackageId ?? ''}
            onChange={(e) => onWorkPackageChange(e.target.value !== '' ? Number(e.target.value) : null)}
            className={`text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors ${
              workPackageId !== null
                ? 'border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-400'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            <option value="">{t('filters.all_wps')}</option>
            {workPackages.map((wp) => (
              <option key={wp.id} value={wp.id}>{wp.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Active filter summary */}
      {isFiltered && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {t('filters.x_of_y', {
              visible: visibleTasks,
              total: totalTasks,
              noun: totalTasks === 1 ? t('filters.task_singular') : t('filters.task_plural'),
            })}
          </span>
          <button
            onClick={onClear}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-700 rounded-lg px-2.5 py-1 transition-colors"
          >
            {t('filters.clear')}
          </button>
        </div>
      )}
    </div>
  )
}
