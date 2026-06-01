import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import HelpModal from '../components/HelpModal'
import LangToggle from '../components/LangToggle'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { ProjectRoleProvider } from '../contexts/ProjectRoleContext'
import { projectsService } from '../services/projects.service'
import { phasesService } from '../services/phases.service'
import { workPackagesService } from '../services/workPackages.service'
import { tasksService } from '../services/tasks.service'
import type { Project, Phase, WorkPackage, Task } from '../types'

interface WPWithTasks extends WorkPackage {
  tasks: Task[]
}
interface PhaseWithWPs extends Phase {
  workPackages: WPWithTasks[]
}

function InlineForm({
  placeholder,
  onSave,
  onCancel,
}: {
  placeholder: string
  onSave: (value: string) => Promise<void>
  onCancel: () => void
}) {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setSaving(true)
    try {
      await onSave(value.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        required
      />
      <button
        type="submit"
        disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
      >
        {saving ? '...' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs text-gray-400 hover:text-gray-600 px-2"
      >
        ✕
      </button>
    </form>
  )
}

export default function EdtPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<PhaseWithWPs[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set())
  const [addingPhase, setAddingPhase] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer'>('viewer')
  const { t } = useTranslation()
  const toast = useToast()
  const confirm = useConfirm()
  const canEdit = userRole === 'owner' || userRole === 'editor'
  const [addingWpForPhase, setAddingWpForPhase] = useState<number | null>(null)
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null)
  const [editingWpId, setEditingWpId] = useState<number | null>(null)
  const [editNameValue, setEditNameValue] = useState('')

  useEffect(() => {
    const load = async () => {
      const [proj, phs, allTasks] = await Promise.all([
        projectsService.get(projectId),
        phasesService.list(projectId),
        tasksService.listByProject(projectId),
      ])
      setProject(proj)

      const phasesWithData = await Promise.all(
        phs.map(async (phase) => {
          const wps = await workPackagesService.list(phase.id)
          return {
            ...phase,
            workPackages: wps.map((wp) => ({
              ...wp,
              tasks: allTasks.filter((t) => t.work_package_id === wp.id),
            })),
          }
        })
      )
      setPhases(phasesWithData)
      setExpandedPhases(new Set(phasesWithData.map((p) => p.id)))
      setLoading(false)
    }
    projectsService.getMyRole(projectId).then(setUserRole).catch(() => {})
    load().catch(() => navigate('/dashboard'))
  }, [projectId])

  const togglePhase = (id: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAddPhase = async (name: string) => {
    try {
      const phase = await phasesService.create(projectId, name)
      setPhases((prev) => [...prev, { ...phase, workPackages: [] }])
      setExpandedPhases((prev) => new Set([...prev, phase.id]))
      setAddingPhase(false)
      toast.success(`Fase "${name}" creada`)
    } catch {
      toast.error('No se pudo crear la fase')
    }
  }

  const handleAddWorkPackage = async (phaseId: number, name: string) => {
    try {
      const wp = await workPackagesService.create(phaseId, { name })
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId
            ? { ...p, workPackages: [...p.workPackages, { ...wp, tasks: [] }] }
            : p
        )
      )
      setAddingWpForPhase(null)
      toast.success(`Paquete "${name}" creado`)
    } catch {
      toast.error('No se pudo crear el paquete de trabajo')
    }
  }

  const startEditPhase = (phase: PhaseWithWPs) => {
    setEditingPhaseId(phase.id)
    setEditNameValue(phase.name)
  }

  const saveEditPhase = async (phaseId: number) => {
    const trimmed = editNameValue.trim()
    setEditingPhaseId(null)
    if (!trimmed) return
    await phasesService.update(phaseId, { name: trimmed })
    setPhases((prev) => prev.map((p) => p.id === phaseId ? { ...p, name: trimmed } : p))
  }

  const startEditWp = (wp: WPWithTasks) => {
    setEditingWpId(wp.id)
    setEditNameValue(wp.name)
  }

  const saveEditWp = async (phaseId: number, wpId: number) => {
    const trimmed = editNameValue.trim()
    setEditingWpId(null)
    if (!trimmed) return
    await workPackagesService.update(wpId, { name: trimmed })
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, workPackages: p.workPackages.map((wp) => wp.id === wpId ? { ...wp, name: trimmed } : wp) }
          : p
      )
    )
  }

  const handleDeletePhase = async (phaseId: number, phaseName: string) => {
    const ok = await confirm({
      title: t('edt.delete_phase_title'),
      message: t('edt.delete_phase_msg', { name: phaseName }),
      danger: true,
    })
    if (!ok) return
    try {
      await phasesService.remove(phaseId)
      setPhases((prev) => prev.filter((p) => p.id !== phaseId))
      toast.success(`Fase "${phaseName}" eliminada`)
    } catch {
      toast.error('No se pudo eliminar la fase')
    }
  }

  const handleDeleteWorkPackage = async (phaseId: number, wpId: number, wpName: string) => {
    const ok = await confirm({
      title: t('edt.delete_wp_title'),
      message: t('edt.delete_wp_msg', { name: wpName }),
      danger: true,
    })
    if (!ok) return
    try {
      await workPackagesService.remove(wpId)
      setPhases((prev) =>
        prev.map((p) =>
          p.id === phaseId
            ? { ...p, workPackages: p.workPackages.filter((wp) => wp.id !== wpId) }
            : p
        )
      )
      toast.success(`Paquete "${wpName}" eliminado`)
    } catch {
      toast.error('No se pudo eliminar el paquete')
    }
  }

  const totalHours = (tasks: Task[]) =>
    tasks.reduce((acc, t) => acc + (t.estimated_hours ?? 0), 0)

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-gray-400">{t('edt.loading')}</div>
  }

  return (
    <ProjectRoleProvider value={userRole}>
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 truncate">{project?.name}</h1>
            {!canEdit && (
              <span className="hidden sm:inline text-xs bg-amber-100 text-amber-700 font-medium px-2.5 py-1 rounded-full shrink-0">
                Solo lectura
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowHelp(true)}
              className="hidden sm:block text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors font-medium"
            >
              ¿Cómo usar?
            </button>
            <LangToggle />
            <nav className="hidden sm:flex gap-1">
              <Link to={`/projects/${projectId}`}         className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.kanban')}</Link>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{t('nav.wbs')}</span>
              <Link to={`/projects/${projectId}/members`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.members')}</Link>
              <Link to={`/projects/${projectId}/summary`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.summary')}</Link>
            </nav>
          </div>
        </div>
        <nav className="flex sm:hidden items-center gap-1 px-4 pb-2">
          <Link to={`/projects/${projectId}`}         className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.kanban')}</Link>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">{t('nav.wbs')}</span>
          <Link to={`/projects/${projectId}/members`} className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.members')}</Link>
          <Link to={`/projects/${projectId}/summary`} className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.summary')}</Link>
          {!canEdit && (
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-medium px-2 py-1 rounded-full">{t('nav.read_only')}</span>
          )}
          <button onClick={() => setShowHelp(true)} className="ml-auto text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1">
            {t('nav.how_to_use')}
          </button>
        </nav>
      </header>

      {/* EDT tree */}
      {!canEdit && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-sm text-amber-800">
          <span>👁</span>
          <span dangerouslySetInnerHTML={{ __html: t('edt.viewer_banner') }} />
        </div>
      )}

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('edt.title')}</h2>
            <p className="text-sm text-gray-500">{t('edt.subtitle')}</p>
          </div>
          {canEdit && !addingPhase && (
            <button
              onClick={() => setAddingPhase(true)}
              style={{ background: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500 }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {t('edt.new_phase')}
            </button>
          )}
        </div>

        {/* New phase form */}
        {addingPhase && (
          <div className="bg-white border border-indigo-200 rounded-xl p-4 mb-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-2 font-medium">{t('edt.new_phase_label')}</p>
            <InlineForm
              placeholder={t('edt.phase_placeholder')}
              onSave={handleAddPhase}
              onCancel={() => setAddingPhase(false)}
            />
          </div>
        )}

        {phases.length === 0 && !addingPhase ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-white">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">{t('edt.no_phases_title')}</p>
            <p className="text-gray-400 text-sm mb-5">{t('edt.no_phases_desc')}</p>
            <button
              onClick={() => setAddingPhase(true)}
              style={{ background: '#4f46e5', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              {t('edt.create_first')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {phases.map((phase) => {
              const phaseTasks = phase.workPackages.flatMap((wp) => wp.tasks)
              const phaseHours = totalHours(phaseTasks)
              const expanded = expandedPhases.has(phase.id)

              return (
                <div key={phase.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Phase header */}
                  <div className="group flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button onClick={() => togglePhase(phase.id)} className="text-gray-400 text-xs shrink-0">
                        {expanded ? '▾' : '▸'}
                      </button>
                      {editingPhaseId === phase.id ? (
                        <input
                          autoFocus
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onBlur={() => saveEditPhase(phase.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEditPhase(phase.id); if (e.key === 'Escape') setEditingPhaseId(null) }}
                          className="flex-1 text-sm font-medium border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        <button onClick={() => togglePhase(phase.id)} className="text-left min-w-0">
                          <p className="font-medium text-gray-900 truncate">{phase.name}</p>
                          {phase.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{phase.description}</p>}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0 ml-3">
                      <span className="hidden sm:inline">{t('edt.packages_count', { count: phase.workPackages.length })}</span>
                      <span>{phaseHours > 0 ? `${phaseHours}h` : '—'}</span>
                      {canEdit && <>
                        <button
                          onClick={() => startEditPhase(phase)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-indigo-500 transition-all text-xs p-1 rounded"
                          title={t('edt.rename_phase')}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDeletePhase(phase.id, phase.name)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-xs p-1 rounded"
                          title={t('edt.delete_phase')}
                        >
                          ✕
                        </button>
                      </>}
                    </div>
                  </div>

                  {/* Work packages */}
                  {expanded && (
                    <div className="border-t border-gray-100">
                      {phase.workPackages.map((wp) => {
                        const wpHours = totalHours(wp.tasks)
                        return (
                          <div key={wp.id} className="border-b border-gray-100 last:border-0">
                            <div className="group flex items-center justify-between px-5 py-2.5 pl-8 sm:pl-12 bg-gray-50">
                              <div className="flex-1 min-w-0 mr-3">
                                {editingWpId === wp.id ? (
                                  <input
                                    autoFocus
                                    value={editNameValue}
                                    onChange={(e) => setEditNameValue(e.target.value)}
                                    onBlur={() => saveEditWp(phase.id, wp.id)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditWp(phase.id, wp.id); if (e.key === 'Escape') setEditingWpId(null) }}
                                    className="w-full text-sm font-medium border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                ) : (
                                  <>
                                    <p className="text-sm font-medium text-gray-700 truncate">{wp.name}</p>
                                    {wp.acceptance_criteria && (
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">✓ {wp.acceptance_criteria}</p>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
                                <span>{t('edt.tasks_count', { count: wp.tasks.length })}</span>
                                <span>{wpHours > 0 ? `${wpHours}h` : '—'}</span>
                                {canEdit && <>
                                  <button
                                    onClick={() => startEditWp(wp)}
                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-indigo-500 transition-all p-1 rounded"
                                    title={t('edt.rename_wp')}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWorkPackage(phase.id, wp.id, wp.name)}
                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 rounded"
                                    title={t('edt.delete_wp')}
                                  >
                                    ✕
                                  </button>
                                </>}
                              </div>
                            </div>
                            {wp.tasks.length > 0 && (
                              <div className="pl-14 sm:pl-20 pr-5 py-2 space-y-1">
                                {wp.tasks.map((task) => (
                                  <div key={task.id} className="flex items-center justify-between text-xs text-gray-500 py-0.5">
                                    <span className="truncate">{task.title}</span>
                                    <span className="ml-4 text-gray-400 shrink-0">
                                      {task.estimated_hours != null ? `${task.estimated_hours}h` : '—'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {/* Add work package */}
                      {canEdit && (
                        <div className="px-5 py-3 pl-8 sm:pl-12 bg-gray-50 border-t border-gray-100">
                          {addingWpForPhase === phase.id ? (
                            <InlineForm
                              placeholder="Nombre del paquete de trabajo"
                              onSave={(name) => handleAddWorkPackage(phase.id, name)}
                              onCancel={() => setAddingWpForPhase(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setAddingWpForPhase(phase.id)}
                              className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                            >
                              {t('edt.add_wp')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
    </ProjectRoleProvider>
  )
}
