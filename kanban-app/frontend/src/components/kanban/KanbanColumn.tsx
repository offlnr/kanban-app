import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { KanbanColumn as Col, Task, WorkPackage, TaskPriority } from '../../types'
import TaskCard from './TaskCard'
import { kanbanColumnsService } from '../../services/kanbanColumns.service'
import { colId, type NewTaskPayload } from './kanban.utils'
import { useCanEdit } from '../../contexts/ProjectRoleContext'


const COLORS = [
  { value: null,      bg: '#e5e7eb', label: 'Sin color' },
  { value: '#6366f1', bg: '#6366f1', label: 'Índigo' },
  { value: '#3b82f6', bg: '#3b82f6', label: 'Azul' },
  { value: '#14b8a6', bg: '#14b8a6', label: 'Teal' },
  { value: '#10b981', bg: '#10b981', label: 'Verde' },
  { value: '#f59e0b', bg: '#f59e0b', label: 'Amarillo' },
  { value: '#f97316', bg: '#f97316', label: 'Naranja' },
  { value: '#ef4444', bg: '#ef4444', label: 'Rojo' },
  { value: '#ec4899', bg: '#ec4899', label: 'Rosa' },
  { value: '#8b5cf6', bg: '#8b5cf6', label: 'Violeta' },
]

interface Props {
  column: Col
  tasks: Task[]
  workPackages: WorkPackage[]
  onAddTask: (columnId: number, payload: NewTaskPayload) => Promise<void>
  onDeleteTask: (taskId: number) => void
  onDeleteColumn: (columnId: number) => void
  onEditTask: (updated: Task) => void
  onRenameColumn: (columnId: number, name: string) => void
  onColorChange: (columnId: number, color: string | null) => void
  onMoveLeft?: () => void
  onMoveRight?: () => void
}

export default function KanbanColumn({
  column, tasks, workPackages,
  onAddTask, onDeleteTask, onDeleteColumn, onEditTask, onRenameColumn, onColorChange,
  onMoveLeft, onMoveRight,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: colId(column.id), data: { type: 'column', columnId: column.id } })
  const canEdit = useCanEdit()
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [wpId, setWpId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [hours, setHours] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(column.name)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    if (showColorPicker) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColorPicker])

  const resetForm = () => {
    setTitle('')
    setWpId('')
    setDescription('')
    setPriority('medium')
    setHours('')
    setDueDate('')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !wpId) return
    setSaving(true)
    try {
      await onAddTask(column.id, {
        title: title.trim(),
        workPackageId: wpId as number,
        description: description.trim() || undefined,
        priority,
        estimated_hours: hours ? parseFloat(hours) : undefined,
        due_date: dueDate || undefined,
      })
      resetForm()
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteColumn = () => {
    onDeleteColumn(column.id)
  }

  const startEditName = () => {
    setEditingName(true)
    setNameValue(column.name)
    setTimeout(() => nameInputRef.current?.select(), 0)
  }

  const saveColumnName = async () => {
    const trimmed = nameValue.trim()
    setEditingName(false)
    if (!trimmed || trimmed === column.name) return
    await kanbanColumnsService.update(column.id, { name: trimmed })
    onRenameColumn(column.id, trimmed)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveColumnName()
    if (e.key === 'Escape') setEditingName(false)
  }

  const handleColorSelect = async (color: string | null) => {
    setShowColorPicker(false)
    await kanbanColumnsService.update(column.id, { color })
    onColorChange(column.id, color)
  }

  const accentColor = column.color ?? null

  const inputCls = "w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Color accent bar */}
      {accentColor && (
        <div className="h-1 rounded-t-lg mb-0" style={{ background: accentColor }} />
      )}

      {/* Column header */}
      <div className="group flex items-center justify-between mb-2 px-1 gap-2">
        {editingName && canEdit ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveColumnName}
            onKeyDown={handleNameKeyDown}
            className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 border border-indigo-300 dark:border-indigo-600 rounded px-2 py-0.5 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <h3
            onClick={canEdit ? startEditName : undefined}
            className={`font-medium text-sm truncate ${canEdit ? 'cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors' : 'cursor-default text-gray-700 dark:text-gray-300'}`}
            style={{ color: accentColor ?? undefined }}
            title={canEdit ? t('kanban_board.rename_column') : undefined}
          >
            {column.name}
          </h3>
        )}

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">{tasks.length}</span>

          {canEdit && (
            <>
              {onMoveLeft && (
                <button
                  onClick={onMoveLeft}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs"
                  title={t('kanban_board.move_left')}
                >
                  ←
                </button>
              )}
              {onMoveRight && (
                <button
                  onClick={onMoveRight}
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs"
                  title={t('kanban_board.move_right')}
                >
                  →
                </button>
              )}
            </>
          )}
          {canEdit && (
            <>
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker((v) => !v)}
                  className="opacity-0 group-hover:opacity-100 transition-all p-0.5 rounded text-sm"
                  title={t('kanban_board.column_color')}
                >
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ background: accentColor ?? '#e5e7eb' }}
                  />
                </button>

                {showColorPicker && (
                  <div className="absolute right-0 top-7 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2.5 flex flex-wrap gap-1.5 w-36">
                    {COLORS.map((c) => (
                      <button
                        key={String(c.value)}
                        onClick={() => handleColorSelect(c.value)}
                        title={c.label}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          column.color === c.value ? 'border-gray-800 dark:border-gray-200 scale-110' : 'border-transparent'
                        }`}
                        style={{ background: c.bg }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleDeleteColumn}
                className="opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all text-xs p-0.5 rounded"
                title={t('kanban_board.delete_column')}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 min-h-32 transition-colors ${
          isOver ? 'bg-indigo-50 dark:bg-indigo-950/50 border-2 border-indigo-200 dark:border-indigo-700' : 'bg-gray-100 dark:bg-gray-700/60'
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onEdit={onEditTask}
              />
            ))}
          </div>
        </SortableContext>

        {adding ? (
          <form onSubmit={handleAdd} className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2 shadow-sm">
            {workPackages.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-2"
                dangerouslySetInnerHTML={{ __html: t('kanban_column.no_wp_msg') }}
              />
            ) : (
              <>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('kanban_column.task_title')}
                  className={inputCls}
                  required
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('kanban_column.description')}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className={inputCls}
                  >
                    <option value="low">{t('priority.low')}</option>
                    <option value="medium">{t('priority.medium')}</option>
                    <option value="high">{t('priority.high')}</option>
                    <option value="critical">{t('priority.critical')}</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder={t('kanban_column.hours')}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('kanban_column.due_date')}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <select
                  value={wpId}
                  onChange={(e) => setWpId(Number(e.target.value))}
                  className={inputCls}
                  required
                >
                  <option value="">{t('kanban_column.work_package')}</option>
                  {workPackages.map((wp) => (
                    <option key={wp.id} value={wp.id}>{wp.name}</option>
                  ))}
                </select>
              </>
            )}
            <div className="flex gap-1 pt-1">
              <button
                type="submit"
                disabled={saving || workPackages.length === 0}
                className="flex-1 bg-indigo-600 text-white text-xs font-medium rounded-lg py-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? t('common.adding') : t('kanban_column.add_task_btn')}
              </button>
              <button
                type="button"
                onClick={() => { resetForm(); setAdding(false) }}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 px-2"
              >
                ✕
              </button>
            </div>
          </form>
        ) : canEdit ? (
          <button
            onClick={() => setAdding(true)}
            className="mt-2 w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600/50 transition-colors text-left px-2"
          >
            {t('kanban_column.add_task')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
