import { useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DragCancelEvent,
} from '@dnd-kit/core'
import type { KanbanColumn as Col, Task, WorkPackage } from '../../types'
import { parseColId, isColId, type NewTaskPayload } from './kanban.utils'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { tasksService } from '../../services/tasks.service'
import { kanbanColumnsService } from '../../services/kanbanColumns.service'
import { useToast } from '../../contexts/ToastContext'
import { useCanEdit } from '../../contexts/ProjectRoleContext'

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }


interface Props {
  columns: Col[]
  tasks: Task[]
  workPackages: WorkPackage[]
  onTasksChange: (tasks: Task[]) => void
  onColumnsChange: (columns: Col[]) => void
  onAddColumn: (name: string) => Promise<void>
  onAddTask: (columnId: number, payload: NewTaskPayload) => Promise<void>
  onDeleteTask: (taskId: number) => void
  onDeleteColumn: (columnId: number) => void
  onColorChange: (columnId: number, color: string | null) => void
  taskFilter?: (task: Task) => boolean
}

type MoveDirection = 'left' | 'right'

export default function KanbanBoard({
  columns, tasks, workPackages,
  onTasksChange, onColumnsChange,
  onAddColumn, onAddTask,
  onDeleteTask, onDeleteColumn, onColorChange,
  taskFilter,
}: Props) {
  const toast = useToast()
  const canEdit = useCanEdit()
  const { t } = useTranslation()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [addingCol, setAddingCol] = useState(false)
  const [colName, setColName] = useState('')

  // Track the original column before drag starts — used to revert on cancel/error
  const originalColumnId = useRef<number | null>(null)
  const tasksRef = useRef(tasks)
  tasksRef.current = tasks

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const getTargetColumn = useCallback((over: DragOverEvent['over']): number | null => {
    if (!over) return null
    const overId = String(over.id)
    if (isColId(overId)) return parseColId(overId)
    // over is a task — find its current column
    const overTask = tasksRef.current.find((t) => t.id === Number(over.id))
    return overTask?.column_id ?? null
  }, [])

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasksRef.current.find((t) => t.id === active.id)
    if (!task) return
    setActiveTask(task)
    originalColumnId.current = task.column_id
  }

  // Move task visually in real-time as user drags over columns/tasks
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const targetColId = getTargetColumn(over)
    if (targetColId === null) return

    const dragged = tasksRef.current.find((t) => t.id === active.id)
    if (!dragged || dragged.column_id === targetColId) return

    onTasksChange(
      tasksRef.current.map((t) =>
        t.id === dragged.id ? { ...t, column_id: targetColId } : t
      )
    )
  }

  const handleDragEnd = async ({ active }: DragEndEvent) => {
    const dragged = tasksRef.current.find((t) => t.id === active.id)
    setActiveTask(null)

    if (!dragged || originalColumnId.current === null) {
      originalColumnId.current = null
      return
    }

    const newColumnId = dragged.column_id

    if (newColumnId === originalColumnId.current) {
      originalColumnId.current = null
      return
    }

    // Persist to API
    try {
      await tasksService.update(dragged.id, { column_id: newColumnId })
    } catch {
      // Revert on error
      onTasksChange(
        tasksRef.current.map((t) =>
          t.id === dragged.id ? { ...t, column_id: originalColumnId.current! } : t
        )
      )
      toast.error('No se pudo mover la tarea')
    }

    originalColumnId.current = null
  }

  const handleDragCancel = ({ active }: DragCancelEvent) => {
    setActiveTask(null)
    // Snap back to original column
    if (originalColumnId.current !== null) {
      onTasksChange(
        tasksRef.current.map((t) =>
          t.id === active.id ? { ...t, column_id: originalColumnId.current! } : t
        )
      )
    }
    originalColumnId.current = null
  }

  const handleEditTask = (updated: Task) => {
    onTasksChange(tasksRef.current.map((t) => (t.id === updated.id ? updated : t)))
  }

  const handleMoveColumn = async (columnId: number, direction: MoveDirection) => {
    const sorted = [...columns].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((c) => c.id === columnId)
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const col = sorted[idx]
    const neighbor = sorted[swapIdx]
    const prevColumns = columns

    onColumnsChange(
      columns.map((c) => {
        if (c.id === col.id) return { ...c, order: neighbor.order }
        if (c.id === neighbor.id) return { ...c, order: col.order }
        return c
      })
    )

    try {
      await Promise.all([
        kanbanColumnsService.update(col.id, { order: neighbor.order }),
        kanbanColumnsService.update(neighbor.id, { order: col.order }),
      ])
    } catch {
      onColumnsChange(prevColumns)
      toast.error(t('project.col_move_error'))
    }
  }

  const handleRenameColumn = (columnId: number, name: string) => {
    onColumnsChange(columns.map((c) => (c.id === columnId ? { ...c, name } : c)))
  }

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!colName.trim()) return
    await onAddColumn(colName.trim())
    setColName('')
    setAddingCol(false)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {columns
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((col, idx, sorted) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasks
                .filter((t) => t.column_id === col.id && (!taskFilter || taskFilter(t)))
                .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.order - b.order)}
              workPackages={workPackages}
              onAddTask={onAddTask}
              onDeleteTask={onDeleteTask}
              onDeleteColumn={onDeleteColumn}
              onEditTask={handleEditTask}
              onRenameColumn={handleRenameColumn}
              onColorChange={onColorChange}
              onMoveLeft={idx > 0 ? () => handleMoveColumn(col.id, 'left') : undefined}
              onMoveRight={idx < sorted.length - 1 ? () => handleMoveColumn(col.id, 'right') : undefined}
            />
          ))}

        {canEdit && (
          <div className="w-72 shrink-0">
            {addingCol ? (
              <form onSubmit={handleAddColumn} className="bg-gray-100 rounded-xl p-3 space-y-2">
                <input
                  autoFocus
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  placeholder={t('kanban_board.column_name_placeholder')}
                  className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="flex gap-1">
                  <button type="submit" className="flex-1 bg-indigo-600 text-white text-xs font-medium rounded-lg py-1.5 hover:bg-indigo-700">
                    {t('kanban_board.add_btn')}
                  </button>
                  <button type="button" onClick={() => setAddingCol(false)} className="text-xs text-gray-500 px-2 hover:text-gray-700">
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingCol(true)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl py-3 px-4 text-left transition-colors"
              >
                {t('kanban_board.add_column')}
              </button>
            )}
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeTask && <TaskCard task={activeTask} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
