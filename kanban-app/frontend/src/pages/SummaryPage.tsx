import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { projectsService } from '../services/projects.service'
import { kanbanColumnsService } from '../services/kanbanColumns.service'
import { tasksService } from '../services/tasks.service'
import { phasesService } from '../services/phases.service'
import { workPackagesService } from '../services/workPackages.service'
import LangToggle from '../components/LangToggle'
import ThemeToggle from '../components/ThemeToggle'
import type { Project, KanbanColumn, Task, WorkPackage, Phase } from '../types'

function Ring({ pct }: { pct: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = (pct / 100) * circ
  return (
    <svg className="-rotate-90 w-36 h-36 shrink-0" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-100 dark:text-gray-700" />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        className="transition-all duration-700"
      />
    </svg>
  )
}

function StatCard({ label, value, sub, color = 'text-gray-900' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function HBar({ label, value, total, color }: { label: string; value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-40">{label}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">{value} — {pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color ?? '#6366f1' }}
        />
      </div>
    </div>
  )
}

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
}

interface PhaseRow { phase: Phase; total: number; done: number }

export default function SummaryPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()

  const [project, setProject]       = useState<Project | null>(null)
  const [columns, setColumns]       = useState<KanbanColumn[]>([])
  const [tasks, setTasks]           = useState<Task[]>([])
  const [phases, setPhases]         = useState<Phase[]>([])
  const [workPackages, setWPs]      = useState<WorkPackage[]>([])
  const [membersCount, setMembers]  = useState(0)
  const [loading, setLoading]       = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    const load = async () => {
      const [proj, cols, tks, phs] = await Promise.all([
        projectsService.get(projectId),
        kanbanColumnsService.list(projectId),
        tasksService.listByProject(projectId),
        phasesService.list(projectId),
      ])
      setProject(proj); document.title = `${proj.name} | KanbanApp`; setColumns(cols); setTasks(tks); setPhases(phs)

      const [wpLists, membersData] = await Promise.all([
        Promise.all(phs.map((p) => workPackagesService.list(p.id))),
        projectsService.getMembers(projectId),
      ])
      setWPs(wpLists.flat())
      setMembers(1 + membersData.members.length)
      setLoading(false)
    }
    load().catch(() => navigate('/dashboard'))
    return () => { document.title = 'KanbanApp' }
  }, [projectId])

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400 dark:text-gray-500 dark:bg-gray-900">{t('summary.loading')}</div>
  }

  const sortedCols  = [...columns].sort((a, b) => a.order - b.order)
  const lastCol     = sortedCols[sortedCols.length - 1]
  const doneCount   = lastCol ? tasks.filter((t) => t.column_id === lastCol.id).length : 0
  const pct         = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100)
  const inProgress  = tasks.length - doneCount

  const totalHours  = tasks.reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
  const doneHours   = tasks
    .filter((t) => t.column_id === lastCol?.id)
    .reduce((s, t) => s + (t.estimated_hours ?? 0), 0)
  const pendHours   = totalHours - doneHours

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const inDays  = (d: string) => Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000)
  const overdueCount    = tasks.filter((t) => t.due_date && inDays(t.due_date) < 0).length
  const dueTodayCount   = tasks.filter((t) => t.due_date && inDays(t.due_date) === 0).length
  const dueWeekCount    = tasks.filter((t) => t.due_date && inDays(t.due_date) > 0 && inDays(t.due_date) <= 7).length
  const noDueDateCount  = tasks.filter((t) => !t.due_date).length

  const phaseRows: PhaseRow[] = phases
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((phase) => {
      const phaseWpIds = new Set(workPackages.filter((wp) => wp.phase_id === phase.id).map((wp) => wp.id))
      const phaseTasks = tasks.filter((t) => phaseWpIds.has(t.work_package_id))
      const done = phaseTasks.filter((t) => t.column_id === lastCol?.id).length
      return { phase, total: phaseTasks.length, done }
    })
    .filter((r) => r.total > 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{project?.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <nav className="hidden sm:flex gap-1">
              <Link to={`/projects/${projectId}`}         className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('nav.kanban')}</Link>
              <Link to={`/projects/${projectId}/edt`}     className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('nav.wbs')}</Link>
              <Link to={`/projects/${projectId}/members`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('nav.members')}</Link>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-3 py-1.5 rounded-lg">{t('nav.summary')}</span>
            </nav>
          </div>
        </div>
        <nav className="flex sm:hidden gap-1 px-4 pb-2">
          <Link to={`/projects/${projectId}`}         className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('nav.kanban')}</Link>
          <Link to={`/projects/${projectId}/edt`}     className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('nav.wbs')}</Link>
          <Link to={`/projects/${projectId}/members`} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('nav.members')}</Link>
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1.5 rounded-lg">{t('nav.summary')}</span>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-300 dark:text-gray-600 text-5xl mb-4">📊</p>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('summary.no_tasks_title')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('summary.no_tasks_sub')}</p>
          </div>
        ) : (
          <>
            {/* stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label={t('summary.stat_total')}     value={tasks.length} sub={t('summary.stat_columns_sub', { count: columns.length })} />
              <StatCard label={t('summary.stat_completed')} value={doneCount}    sub={`${pct}%`} color="text-emerald-600 dark:text-emerald-400" />
              <StatCard label={t('summary.stat_in_progress')} value={inProgress} color="text-indigo-600 dark:text-indigo-400" />
              <StatCard
                label={t('summary.stat_overdue')}
                value={overdueCount}
                sub={overdueCount === 0 ? t('summary.stat_up_to_date') : t('summary.stat_today', { count: dueTodayCount })}
                color={overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}
              />
            </div>

            {/* progress hero */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0">
                <Ring pct={pct} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pct}%</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{t('summary.ring_label')}</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
                    {lastCol
                      ? t('summary.tasks_in_col', { done: doneCount, total: tasks.length, col: lastCol.name })
                      : t('summary.tasks_done_generic', { done: doneCount, total: tasks.length })}
                  </p>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {totalHours > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                      {doneHours > 0 ? t('summary.hours_done_of_total', { done: doneHours, total: totalHours }) : t('summary.hours_total_only', { total: totalHours })}
                    </p>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                        style={{ width: `${totalHours === 0 ? 0 : Math.round((doneHours / totalHours) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span><strong className="text-gray-700 dark:text-gray-200">{membersCount}</strong> {t('summary.members_label')}</span>
                  <span><strong className="text-gray-700 dark:text-gray-200">{workPackages.length}</strong> {t('summary.wps_label')}</span>
                  {phases.length > 0 && <span><strong className="text-gray-700 dark:text-gray-200">{phases.length}</strong> {t('summary.phases_label')}</span>}
                </div>
              </div>
            </div>

            {/* por columna + por prioridad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t('summary.section_by_col')}</p>
                <div className="space-y-3">
                  {sortedCols.map((col) => {
                    const count = tasks.filter((t) => t.column_id === col.id).length
                    return (
                      <HBar
                        key={col.id}
                        label={col.name}
                        value={count}
                        total={tasks.length}
                        color={col.color ?? '#6366f1'}
                      />
                    )
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t('summary.section_by_priority')}</p>
                <div className="space-y-3">
                  {(Object.keys(PRIORITY_COLORS) as (keyof typeof PRIORITY_COLORS)[]).map((p) => {
                    const count = tasks.filter((task) => task.priority === p).length
                    return (
                      <HBar
                        key={p}
                        label={t(`priority.${p}`)}
                        value={count}
                        total={tasks.length}
                        color={PRIORITY_COLORS[p]}
                      />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* vencimientos + horas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t('summary.section_due_dates')}</p>
                <div className="space-y-2">
                  {[
                    { labelKey: 'summary.due_overdue', value: overdueCount,   color: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400',      dot: 'bg-red-400' },
                    { labelKey: 'summary.due_today',   value: dueTodayCount,  color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400', dot: 'bg-orange-400' },
                    { labelKey: 'summary.due_week',    value: dueWeekCount,   color: 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-400' },
                    { labelKey: 'summary.due_none',    value: noDueDateCount, color: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',    dot: 'bg-gray-300 dark:bg-gray-600' },
                  ].map(({ labelKey, value, color, dot }) => (
                    <div key={labelKey} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dot}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{t(labelKey)}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${value > 0 ? color : 'text-gray-300 dark:text-gray-600'}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t('summary.section_hours')}</p>
                {totalHours === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t('summary.no_hours')}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalHours}h</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('summary.hours_title')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{doneHours}h</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{t('summary.hours_done_label')}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { labelKey: 'summary.hours_completed', value: doneHours, color: '#10b981' },
                        { labelKey: 'summary.hours_pending',   value: pendHours, color: '#6366f1' },
                      ].map(({ labelKey, value, color }) => (
                        <HBar key={labelKey} label={t(labelKey)} value={value} total={totalHours} color={color} />
                      ))}
                    </div>
                    {doneHours > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        {t('summary.effort_pct', { pct: Math.round((doneHours / totalHours) * 100) })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* por fase */}
            {phaseRows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t('summary.section_phases')}</p>
                <div className="space-y-4">
                  {phaseRows.map(({ phase, total, done }) => {
                    const p = total === 0 ? 0 : Math.round((done / total) * 100)
                    return (
                      <div key={phase.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-60">{phase.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 ml-3">{t('summary.phase_tasks', { done, total, pct: p })}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${p}%`, background: p === 100 ? '#10b981' : '#6366f1' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
