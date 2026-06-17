import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { projectsService } from '../services/projects.service'
import LangToggle from '../components/LangToggle'
import ThemeToggle from '../components/ThemeToggle'
import type { Project } from '../types'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    projectsService.list().then(setProjects).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation()
    const ok = await confirm({
      title: t('dashboard.delete_title'),
      message: t('dashboard.delete_msg', { name: project.name }),
      danger: true,
    })
    if (!ok) return
    try {
      await projectsService.remove(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
      toast.success(t('dashboard.delete_title'))
    } catch {
      toast.error('Error')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const project = await projectsService.create(newName.trim(), newDesc.trim() || undefined)
      setProjects((prev) => [project, ...prev])
      setNewName('')
      setNewDesc('')
      setShowForm(false)
    } catch {
      toast.error('Error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 dark:text-gray-100">KanbanApp</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <ThemeToggle />
          <Link to="/profile" className="flex items-center gap-2 group" title={t('dashboard.my_profile')}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600 group-hover:border-indigo-300 dark:group-hover:border-indigo-500 transition-colors"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40 flex items-center justify-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-gray-200 dark:border-gray-600 group-hover:border-indigo-300 dark:group-hover:border-indigo-500 transition-colors select-none">
                {(user?.full_name ?? user?.email ?? '?')
                  .split(' ')
                  .slice(0, 2)
                  .map((w: string) => w[0]?.toUpperCase() ?? '')
                  .join('')}
              </div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-32 sm:max-w-none hidden sm:block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {user?.full_name ?? user?.email}
            </span>
          </Link>
          <button onClick={logout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">{t('dashboard.sign_out')}</button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.my_projects')}</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {t('dashboard.new_project')}
          </button>
        </div>

        {/* New project form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-4 shadow-sm">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('dashboard.project_name_placeholder')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t('dashboard.description_placeholder')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                {creating ? t('common.creating') : t('dashboard.create_btn')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-4 py-2">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}

        {/* Project grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded-md w-1/2 mb-1" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700/60 rounded-md w-2/3 mt-3" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 dark:text-gray-500">{t('dashboard.no_projects')}</p>
            <button onClick={() => setShowForm(true)} className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
              {t('dashboard.create_first')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-sm transition-all group cursor-pointer"
              >
                <button
                  onClick={(e) => handleDelete(e, project)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all text-sm p-1 rounded"
                  title={t('dashboard.delete_title')}
                >
                  ✕
                </button>
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40 rounded-lg mb-3 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{project.description}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
