import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task, TaskPriority } from '../types'
import { tasksService } from '../services/tasks.service'
import { useToast } from '../contexts/ToastContext'

interface Props {
  task: Task
  onSave: (updated: Task) => void
  onClose: () => void
}

export default function TaskEditModal({ task, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const toast = useToast()
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [hours, setHours] = useState(task.estimated_hours?.toString() ?? '')
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [saving, setSaving] = useState(false)

  const PRIORITIES: { value: TaskPriority; label: string }[] = [
    { value: 'low',      label: t('priority.low') },
    { value: 'medium',   label: t('priority.medium') },
    { value: 'high',     label: t('priority.high') },
    { value: 'critical', label: t('priority.critical') },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const updated = await tasksService.update(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimated_hours: hours ? parseFloat(hours) : undefined,
        due_date: dueDate || null,
      })
      onSave(updated)
      onClose()
      toast.success(t('task_edit.success'))
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('task_edit.title')}</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('task_edit.field_title')}</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('task_edit.field_description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder={t('task_edit.desc_placeholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('task_edit.field_priority')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputCls}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('task_edit.field_hours')}</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className={inputCls}
                placeholder={t('task_edit.hours_placeholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('task_edit.field_due_date')}</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 text-sm transition-colors"
            >
              {saving ? t('common.saving') : t('task_edit.save_btn')}
            </button>
            <button type="button" onClick={onClose} className="px-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
