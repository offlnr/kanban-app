import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types'
import TaskEditModal from '../TaskEditModal'
import { useCanEdit } from '../../contexts/ProjectRoleContext'

const priorityStyles: Record<string, string> = {
  low:      'bg-green-100 text-green-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

function dueDateBadge(due_date: string, today: (key: string) => string, tomorrow: (key: string) => string, overdue: (key: string) => string): { label: string; cls: string } {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(due_date + 'T00:00:00')
  const days = Math.round((due.getTime() - now.getTime()) / 86400000)

  if (days < 0)  return { label: overdue('due_date.overdue'), cls: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: today('due_date.today'),    cls: 'bg-orange-100 text-orange-700' }
  if (days === 1) return { label: tomorrow('due_date.tomorrow'), cls: 'bg-yellow-100 text-yellow-700' }
  const label = due.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return { label, cls: days <= 7 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-500' }
}

interface Props {
  task: Task
  overlay?: boolean
  onDelete?: (id: number) => void
  onEdit?: (updated: Task) => void
}

export default function TaskCard({ task: initialTask, overlay = false, onDelete, onEdit }: Props) {
  const [task, setTask] = useState(initialTask)
  const [editing, setEditing] = useState(false)
  const canEdit = useCanEdit()
  const { t } = useTranslation()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleSave = (updated: Task) => {
    setTask(updated)
    onEdit?.(updated)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`group relative bg-white border border-gray-200 rounded-lg p-3 select-none shadow-xs hover:shadow-sm hover:border-indigo-200 transition-all ${overlay ? 'shadow-lg rotate-1 border-indigo-300' : ''}`}
      >
        {!overlay && (
          <div
            {...listeners}
            className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-l-lg hover:bg-gray-50"
            title={t('kanban_column.drag_handle')}
          >
            <svg className="w-3 h-3 text-gray-400" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.2" /><circle cx="7" cy="3" r="1.2" />
              <circle cx="3" cy="8" r="1.2" /><circle cx="7" cy="8" r="1.2" />
              <circle cx="3" cy="13" r="1.2" /><circle cx="7" cy="13" r="1.2" />
            </svg>
          </div>
        )}

        {!overlay && canEdit && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-indigo-500 text-xs p-0.5 rounded transition-colors" title={t('kanban_column.edit_task')}>
                ✎
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(task.id)} className="text-gray-300 hover:text-red-500 text-xs p-0.5 rounded transition-colors" title={t('kanban_column.delete_task')}>
                ✕
              </button>
            )}
          </div>
        )}

        <p className="text-sm font-medium text-gray-800 leading-snug px-5">{task.title}</p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 px-5">{task.description}</p>
        )}
        <div className="flex items-center justify-between mt-2 px-5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityStyles[task.priority]}`}>
            {t(`priority.${task.priority}`)}
          </span>
          <div className="flex items-center gap-1.5">
            {task.due_date && (() => {
              const { label, cls } = dueDateBadge(task.due_date, t, t, t)
              return (
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`} title={`Due: ${task.due_date}`}>
                  📅 {label}
                </span>
              )
            })()}
            {task.estimated_hours != null && (
              <span className="text-xs text-gray-400">{task.estimated_hours}h</span>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <TaskEditModal task={task} onSave={handleSave} onClose={() => setEditing(false)} />
      )}
    </>
  )
}
