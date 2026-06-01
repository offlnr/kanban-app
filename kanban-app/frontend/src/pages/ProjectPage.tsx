import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { projectsService } from '../services/projects.service'
import { kanbanColumnsService } from '../services/kanbanColumns.service'
import { tasksService } from '../services/tasks.service'
import { phasesService } from '../services/phases.service'
import { workPackagesService } from '../services/workPackages.service'
import KanbanBoard from '../components/kanban/KanbanBoard'
import KanbanFilters from '../components/kanban/KanbanFilters'
import HelpModal from '../components/HelpModal'
import ProjectStatsPanel from '../components/ProjectStatsPanel'
import LangToggle from '../components/LangToggle'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { ProjectRoleProvider } from '../contexts/ProjectRoleContext'
import type { NewTaskPayload } from '../components/kanban/kanban.utils'
import type { Project, KanbanColumn, Task, WorkPackage, TaskPriority } from '../types'

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [showPanel, setShowPanel] = useState(() => window.innerWidth >= 1024)
  const [filterPriorities, setFilterPriorities] = useState<TaskPriority[]>([])
  const [filterWpId, setFilterWpId] = useState<number | null>(null)
  const [membersCount, setMembersCount] = useState(0)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer')
  const { t } = useTranslation()
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    const load = async () => {
      const [proj, cols, tks, phs] = await Promise.all([
        projectsService.get(projectId),
        kanbanColumnsService.list(projectId),
        tasksService.listByProject(projectId),
        phasesService.list(projectId),
      ])
      setProject(proj)
      setColumns(cols)
      setTasks(tks)
      const [wpLists, role, membersData] = await Promise.all([
        Promise.all(phs.map((p) => workPackagesService.list(p.id))),
        projectsService.getMyRole(projectId),
        projectsService.getMembers(projectId),
      ])
      setWorkPackages(wpLists.flat())
      setUserRole(role)
      setMembersCount(1 + membersData.members.length)
      setLoading(false)
    }
    load().catch(() => navigate('/dashboard'))
  }, [projectId])

  const handleAddColumn = async (name: string) => {
    try {
      const col = await kanbanColumnsService.create(projectId, name, columns.length)
      setColumns((prev) => [...prev, col])
      toast.success(t('project.col_created', { name }))
    } catch {
      toast.error(t('project.col_error'))
    }
  }

  const handleAddTask = async (columnId: number, payload: NewTaskPayload) => {
    try {
      const task = await tasksService.create({
        column_id: columnId,
        work_package_id: payload.workPackageId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        estimated_hours: payload.estimated_hours,
        due_date: payload.due_date,
      })
      setTasks((prev) => [...prev, task])
      toast.success(t('project.task_created'))
    } catch {
      toast.error(t('project.task_error'))
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    const ok = await confirm({ message: t('project.delete_task_confirm'), danger: true })
    if (!ok) return
    try {
      await tasksService.remove(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success(t('project.task_deleted'))
    } catch {
      toast.error(t('project.task_delete_error'))
    }
  }

  const handleDeleteColumn = async (columnId: number) => {
    const col = columns.find((c) => c.id === columnId)
    const taskCount = tasks.filter((t) => t.column_id === columnId).length
    const ok = await confirm({
      title: t('project.delete_col_title'),
      message: taskCount > 0
        ? t('project.delete_col_with_tasks', { name: col?.name, count: taskCount })
        : t('project.delete_col_empty', { name: col?.name }),
      danger: true,
    })
    if (!ok) return
    try {
      await kanbanColumnsService.remove(columnId)
      setColumns((prev) => prev.filter((c) => c.id !== columnId))
      setTasks((prev) => prev.filter((t) => t.column_id !== columnId))
      toast.success(t('project.col_deleted'))
    } catch {
      toast.error(t('project.col_delete_error'))
    }
  }

  const handleColorChange = (columnId: number, color: string | null) => {
    setColumns((prev) => prev.map((c) => c.id === columnId ? { ...c, color } : c))
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">{t('project.loading')}</div>
  }

  return (
    <ProjectRoleProvider value={userRole}>
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 truncate">{project?.name}</h1>
            {userRole === 'viewer' && (
              <span className="hidden sm:inline text-xs bg-amber-100 text-amber-700 font-medium px-2.5 py-1 rounded-full shrink-0">
                {t('nav.read_only')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowPanel((v) => !v)}
              className={`text-xs border rounded-lg px-2.5 py-1.5 transition-colors font-medium ${
                showPanel
                  ? 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                  : 'text-gray-500 hover:text-indigo-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              <span className="hidden sm:inline">{showPanel ? t('project.hide_info') : t('project.project_info')}</span>
              <span className="sm:hidden">ℹ</span>
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="hidden sm:block text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              {t('nav.how_to_use')}
            </button>
            <LangToggle />
            <nav className="hidden sm:flex gap-1">
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{t('nav.kanban')}</span>
              <Link to={`/projects/${projectId}/edt`}     className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.wbs')}</Link>
              <Link to={`/projects/${projectId}/members`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.members')}</Link>
              <Link to={`/projects/${projectId}/summary`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.summary')}</Link>
            </nav>
          </div>
        </div>
        {/* Mobile nav row */}
        <nav className="flex sm:hidden items-center gap-1 px-4 pb-2">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">{t('nav.kanban')}</span>
          <Link to={`/projects/${projectId}/edt`}     className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.wbs')}</Link>
          <Link to={`/projects/${projectId}/members`} className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.members')}</Link>
          <Link to={`/projects/${projectId}/summary`} className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.summary')}</Link>
          {userRole === 'viewer' && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded-full">{t('nav.read_only')}</span>
          )}
          <button onClick={() => setShowHelp(true)} className="ml-auto text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 transition-colors">
            {t('nav.how_to_use')}
          </button>
        </nav>
      </header>

      {/* Viewer banner */}
      {userRole === 'viewer' && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-sm text-amber-800">
          <span>👁</span>
          <span dangerouslySetInnerHTML={{ __html: t('project.viewer_banner') }} />
        </div>
      )}

      {/* Board + Side panel */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {columns.length === 0 && userRole !== 'viewer' && (
            <div className="text-center text-gray-400 text-sm mb-6">
              <span dangerouslySetInnerHTML={{ __html: t('project.no_columns_msg') }} />
              {' '}{t('project.no_columns_guide')} <button onClick={() => setShowHelp(true)} className="text-indigo-500 hover:underline">{t('project.view_guide')}</button>.
            </div>
          )}

          {tasks.length > 0 && (
            <KanbanFilters
              workPackages={workPackages}
              priorities={filterPriorities}
              workPackageId={filterWpId}
              totalTasks={tasks.length}
              visibleTasks={tasks.filter(t =>
                (filterPriorities.length === 0 || filterPriorities.includes(t.priority)) &&
                (filterWpId === null || t.work_package_id === filterWpId)
              ).length}
              onPriorityToggle={(p) =>
                setFilterPriorities((prev) =>
                  prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                )
              }
              onWorkPackageChange={setFilterWpId}
              onClear={() => { setFilterPriorities([]); setFilterWpId(null) }}
            />
          )}

          <KanbanBoard
            columns={columns}
            tasks={tasks}
            workPackages={workPackages}
            onTasksChange={setTasks}
            onColumnsChange={setColumns}
            onAddColumn={handleAddColumn}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onDeleteColumn={handleDeleteColumn}
            onColorChange={handleColorChange}
            taskFilter={
              filterPriorities.length > 0 || filterWpId !== null
                ? (t) =>
                    (filterPriorities.length === 0 || filterPriorities.includes(t.priority)) &&
                    (filterWpId === null || t.work_package_id === filterWpId)
                : undefined
            }
          />
        </div>

        {showPanel && project && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-10 lg:hidden"
              onClick={() => setShowPanel(false)}
            />
            <ProjectStatsPanel
              project={project}
              columns={columns}
              tasks={tasks}
              workPackages={workPackages}
              membersCount={membersCount}
              onClose={() => setShowPanel(false)}
            />
          </>
        )}
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
    </ProjectRoleProvider>
  )
}
