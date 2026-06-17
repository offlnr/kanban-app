import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { usersService } from '../services/users.service'
import LangToggle from '../components/LangToggle'
import ThemeToggle from '../components/ThemeToggle'

const MAX_AVATAR_BYTES = 1.5 * 1024 * 1024 // 1.5 MB

function AvatarDisplay({ avatarUrl, fullName, size = 'lg' }: { avatarUrl: string | null | undefined; fullName: string; size?: 'sm' | 'lg' }) {
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const cls = size === 'lg'
    ? 'w-24 h-24 text-2xl'
    : 'w-8 h-8 text-sm'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        className={`${cls} rounded-full object-cover border-2 border-gray-200 dark:border-gray-600`}
      />
    )
  }

  return (
    <div className={`${cls} rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-semibold text-indigo-700 dark:text-indigo-300 border-2 border-gray-200 dark:border-gray-600 select-none`}>
      {initials || '?'}
    </div>
  )
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url ?? null)
  const [avatarChanged, setAvatarChanged] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!user) return null

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t('profile.avatar_too_large'))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setAvatarPreview(result)
      setAvatarChanged(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null)
    setAvatarChanged(true)
  }

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingInfo(true)
    try {
      const payload: Record<string, unknown> = {}
      if (fullName.trim() !== user.full_name) payload.full_name = fullName.trim()
      if (bio.trim() !== (user.bio ?? '')) payload.bio = bio.trim() || null
      if (avatarChanged) payload.avatar_url = avatarPreview

      if (Object.keys(payload).length === 0) {
        toast.success(t('profile.no_changes'))
        return
      }

      const updated = await usersService.updateProfile(payload)
      updateUser(updated)
      setAvatarChanged(false)
      toast.success(t('profile.saved'))
    } catch {
      toast.error(t('profile.save_error'))
    } finally {
      setSavingInfo(false)
    }
  }

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.password_mismatch'))
      return
    }
    setSavingPassword(true)
    try {
      const updated = await usersService.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      })
      updateUser(updated)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('profile.password_changed'))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast.error(msg ?? t('profile.password_error'))
    } finally {
      setSavingPassword(false)
    }
  }

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title={t('profile.back')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">KanbanApp</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LangToggle />
          <ThemeToggle />
          <button onClick={logout} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            {t('dashboard.sign_out')}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('profile.title')}</h1>

        {/* Avatar + info section */}
        <form onSubmit={handleSaveInfo} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('profile.section_info')}</h2>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <AvatarDisplay avatarUrl={avatarPreview} fullName={user.full_name} size="lg" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title={t('profile.change_avatar')}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
              >
                {t('profile.change_avatar')}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                >
                  {t('profile.remove_avatar')}
                </button>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('profile.avatar_hint')}</p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.full_name')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={255}
              className={inputCls}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.email')}</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('profile.bio')}
              <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t('profile.bio_placeholder')}
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{bio.length}/500</p>
          </div>

          {/* Member since */}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('profile.member_since')} {new Date(user.created_at).toLocaleDateString()}
          </p>

          <button
            type="submit"
            disabled={savingInfo}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            {savingInfo ? t('common.saving') : t('common.save')}
          </button>
        </form>

        {/* Change password section */}
        <form onSubmit={handleSavePassword} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('profile.section_password')}</h2>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              {showPassword ? t('profile.password_hide') : t('profile.password_show')}
            </button>
          </div>

          {showPassword && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.current_password')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.new_password')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder={t('auth.password_placeholder')}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.confirm_password')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-red-400 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{t('profile.password_mismatch')}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={savingPassword || (!!confirmPassword && newPassword !== confirmPassword)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {savingPassword ? t('common.saving') : t('profile.change_password_btn')}
              </button>
            </>
          )}

          {!showPassword && (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('profile.password_description')}</p>
          )}
        </form>

        {/* Danger zone */}
        <div className="bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/50 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3">{t('profile.section_account')}</h2>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            {t('dashboard.sign_out')}
          </button>
        </div>
      </main>
    </div>
  )
}
