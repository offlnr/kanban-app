import { useTranslation } from 'react-i18next'
import type { Project, KanbanColumn, Task, WorkPackage } from '../types'

interface Props {
  project: Project
  columns: KanbanColumn[]
  tasks: Task[]
  workPackages: WorkPackage[]
  membersCount: number
  onClose: () => void
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function MiniBar({ value, total, color }: { value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color ?? 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-5 text-right">{value}</span>
    </div>
  )
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-green-400',
}

export default function ProjectStatsPanel({ project, columns, tasks, workPackages, membersCount, onClose }: Props) {
  const { t } = useTranslation()
  const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order)
  const lastColumn = sortedColumns[sortedColumns.length - 1]
  const completedCount = lastColumn ? tasks.filter((t) => t.column_id === lastColumn.id).length : 0
  const completionPct = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)

  const priorityCounts = (['critical', 'high', 'medium', 'low'] as const).map((p) => ({
    priority: p,
    count: tasks.filter((task) => task.priority === p).length,
  }))

  return (
    <aside className="fixed inset-y-0 right-0 z-20 w-80 shadow-2xl border-l border-gray-200 bg-white overflow-y-auto flex flex-col lg:static lg:w-72 lg:shadow-none">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 className="font-semibold text-gray-900 text-sm">{t('stats_panel.title')}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none" title={t('stats_panel.close')}>✕</button>
      </div>

      <div className="px-5 py-4 space-y-6 flex-1">
        <section>
          <p className="font-medium text-gray-900 text-sm mb-1">{project.name}</p>
          {project.description && <p className="text-xs text-gray-400 line-clamp-3">{project.description}</p>}
        </section>

        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('stats_panel.section_general')}</p>
          <div className="divide-y divide-gray-50">
            <StatRow label={t('stats_panel.total_tasks')}    value={tasks.length} />
            <StatRow label={t('stats_panel.estimated_hours')} value={totalHours > 0 ? `${totalHours}h` : '—'} />
            <StatRow label={t('stats_panel.columns')}         value={columns.length} />
            <StatRow label={t('stats_panel.work_packages')}   value={workPackages.length} />
            <StatRow label={t('stats_panel.members')}         value={membersCount} />
          </div>
        </section>

        {tasks.length > 0 && lastColumn && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('stats_panel.section_progress')}</p>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-900 w-10 text-right">{completionPct}%</span>
            </div>
            <p className="text-xs text-gray-400"
              dangerouslySetInnerHTML={{ __html: t('stats_panel.tasks_in_col', { done: completedCount, total: tasks.length, col: lastColumn.name }) }}
            />
          </section>
        )}

        {columns.length > 0 && tasks.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('stats_panel.section_by_col')}</p>
            <div className="space-y-2">
              {sortedColumns.map((col) => {
                const count = tasks.filter((task) => task.column_id === col.id).length
                return (
                  <div key={col.id}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {col.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />}
                      <span className="text-xs text-gray-600 truncate max-w-36">{col.name}</span>
                    </div>
                    <MiniBar value={count} total={tasks.length} color={col.color ? undefined : 'bg-indigo-400'} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {tasks.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('stats_panel.section_by_priority')}</p>
            <div className="space-y-2">
              {priorityCounts.map(({ priority, count }) => (
                <div key={priority}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[priority]}`} />
                    <span className="text-xs text-gray-600">{t(`priority.${priority}`)}</span>
                  </div>
                  <MiniBar value={count} total={tasks.length} color={PRIORITY_COLORS[priority]} />
                </div>
              ))}
            </div>
          </section>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-300 text-3xl mb-2">📋</p>
            <p className="text-sm text-gray-400">{t('stats_panel.no_tasks')}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
