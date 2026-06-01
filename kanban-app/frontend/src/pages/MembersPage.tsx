import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { projectsService } from '../services/projects.service'
import { usersService } from '../services/users.service'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import LangToggle from '../components/LangToggle'
import type { ProjectMembersData, MemberWithUser, MemberRole, User } from '../types'

const ROLE_LABELS_KEYS: Record<string, string> = {
  owner: 'members.role_owner',
  editor: 'members.role_editor',
  viewer: 'members.role_viewer',
}

const ROLE_STYLES: Record<string, string> = {
  owner: 'bg-indigo-100 text-indigo-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold shrink-0">
      {initials}
    </div>
  )
}

export default function MembersPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const toast = useToast()
  const confirm = useConfirm()

  const [data, setData] = useState<ProjectMembersData | null>(null)
  const [loading, setLoading] = useState(true)

  // Search form state
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState<User | null>(null)
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [selectedRole, setSelectedRole] = useState<MemberRole>('editor')
  const [adding, setAdding] = useState(false)

  const isOwner = data?.current_user_role === 'owner'

  useEffect(() => {
    projectsService.getMembers(projectId)
      .then(setData)
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    setSearchResult(null)
    setSearching(true)
    try {
      const user = await usersService.searchByEmail(searchEmail.trim())
      // Check not already a member or owner
      if (user.id === data?.owner.id) {
        setSearchError(t('members.error_is_owner'))
        return
      }
      if (data?.members.some((m) => m.user_id === user.id)) {
        setSearchError(t('members.error_already_member'))
        return
      }
      setSearchResult(user)
    } catch {
      setSearchError(t('members.error_not_found'))
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async () => {
    if (!searchResult) return
    setAdding(true)
    try {
      await projectsService.addMember(projectId, searchResult.id, selectedRole)
      const refreshed = await projectsService.getMembers(projectId)
      setData(refreshed)
      setSearchEmail('')
      setSearchResult(null)
      setSelectedRole('editor')
      toast.success(t('members.success_add', { name: searchResult.full_name, role: t(ROLE_LABELS_KEYS[selectedRole]).toLowerCase() }))
    } catch {
      toast.error(t('members.error_add'))
    } finally {
      setAdding(false)
    }
  }

  const handleRoleChange = async (member: MemberWithUser, role: MemberRole) => {
    try {
      await projectsService.updateMemberRole(projectId, member.user_id, role)
      setData((prev) =>
        prev
          ? { ...prev, members: prev.members.map((m) => m.user_id === member.user_id ? { ...m, role } : m) }
          : prev
      )
      toast.success(t('members.success_role'))
    } catch {
      toast.error(t('members.error_role'))
    }
  }

  const handleRemove = async (member: MemberWithUser) => {
    const ok = await confirm({
      title: t('members.remove_title'),
      message: t('members.remove_msg', { name: member.user.full_name }),
      danger: true,
      confirmLabel: t('members.remove_btn'),
    })
    if (!ok) return
    try {
      await projectsService.removeMember(projectId, member.user_id)
      setData((prev) =>
        prev ? { ...prev, members: prev.members.filter((m) => m.user_id !== member.user_id) } : prev
      )
      toast.success(t('members.success_role'))
    } catch {
      toast.error(t('members.error_remove'))
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">{t('members.loading')}</div>

  type MemberRow = { user: User; role: string; isOwner: boolean; member: MemberWithUser | undefined }
  const ROLE_ORDER: Record<string, number> = { owner: 0, editor: 1, viewer: 2 }
  const allMembers: MemberRow[] = data ? [
    { user: data.owner, role: 'owner', isOwner: true, member: undefined },
    ...data.members
      .slice()
      .sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9))
      .map((m) => ({ user: m.user, role: m.role, isOwner: false, member: m })),
  ] : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="font-semibold text-gray-900 truncate">{t('members.page_title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <nav className="hidden sm:flex gap-1">
              <Link to={`/projects/${projectId}`}         className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.kanban')}</Link>
              <Link to={`/projects/${projectId}/edt`}     className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.wbs')}</Link>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">{t('nav.members')}</span>
              <Link to={`/projects/${projectId}/summary`} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.summary')}</Link>
            </nav>
          </div>
        </div>
        <nav className="flex sm:hidden gap-1 px-4 pb-2">
          <Link to={`/projects/${projectId}`}         className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.kanban')}</Link>
          <Link to={`/projects/${projectId}/edt`}     className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.wbs')}</Link>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg">{t('nav.members')}</span>
          <Link to={`/projects/${projectId}/summary`} className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">{t('nav.summary')}</Link>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Add member — owner only */}
        {isOwner && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">{t('members.add_title')}</h2>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); setSearchError('') }}
                placeholder={t('members.email_placeholder')}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {searching ? '...' : t('members.search_btn')}
              </button>
            </form>

            {searchError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{searchError}</p>
            )}

            {searchResult && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={searchResult.full_name} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{searchResult.full_name}</p>
                    <p className="text-xs text-gray-500">{searchResult.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as MemberRole)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                  <button
                    onClick={handleAdd}
                    disabled={adding}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {adding ? '...' : t('members.add_btn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {t('members.count_label')} <span className="text-gray-400 font-normal text-sm">({allMembers.length})</span>
            </h2>
          </div>

          <ul className="divide-y divide-gray-100">
            {allMembers.map(({ user, role, isOwner: memberIsOwner, member }) => (
              <li key={user.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={user.full_name} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Role — editable for non-owners if current user is owner */}
                  {isOwner && !memberIsOwner && member ? (
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(member, e.target.value as MemberRole)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border border-transparent hover:border-gray-300 cursor-pointer transition-colors ${ROLE_STYLES[role]} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="editor">{t('members.role_editor')}</option>
                      <option value="viewer">{t('members.role_viewer')}</option>
                    </select>
                  ) : (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[role]}`}>
                      {t(ROLE_LABELS_KEYS[role])}
                    </span>
                  )}

                  {/* Remove button — owner only, not for owner row */}
                  {isOwner && !memberIsOwner && member && (
                    <button
                      onClick={() => handleRemove(member)}
                      className="text-gray-300 hover:text-red-500 transition-colors text-sm p-1 rounded"
                      title={t('members.remove_member_tip')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Role legend — owner only */}
        {isOwner && <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('members.roles_legend')}</p>
          <div className="space-y-1.5 text-sm text-gray-600">
            <p><span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${ROLE_STYLES.owner}`}>{t('members.role_owner')}</span>{t('members.owner_desc')}</p>
            <p><span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${ROLE_STYLES.editor}`}>{t('members.role_editor')}</span>{t('members.editor_desc')}</p>
            <p><span className={`text-xs font-medium px-2 py-0.5 rounded-full mr-2 ${ROLE_STYLES.viewer}`}>{t('members.role_viewer')}</span>{t('members.viewer_desc')}</p>
          </div>
        </div>}
      </main>
    </div>
  )
}
