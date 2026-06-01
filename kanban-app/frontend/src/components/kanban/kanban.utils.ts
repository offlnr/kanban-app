import type { TaskPriority } from '../../types'

export const colId = (id: number) => `col-${id}`
export const parseColId = (id: string) => parseInt(id.replace('col-', ''), 10)
export const isColId = (id: string | number) => String(id).startsWith('col-')

export interface NewTaskPayload {
  title: string
  workPackageId: number
  description?: string
  priority: TaskPriority
  estimated_hours?: number
  due_date?: string
}
