import api from './api'
import type { Task, TaskPriority } from '../types'

export const tasksService = {
  async listByProject(projectId: number): Promise<Task[]> {
    const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks`)
    return data
  },

  async create(payload: {
    work_package_id: number
    column_id: number
    title: string
    description?: string
    priority?: TaskPriority
    estimated_hours?: number
    due_date?: string
    order?: number
  }): Promise<Task> {
    const { data } = await api.post<Task>('/tasks', { order: 0, ...payload })
    return data
  },

  async update(taskId: number, payload: Partial<Pick<Task, 'title' | 'description' | 'priority' | 'estimated_hours' | 'assigned_to' | 'due_date' | 'column_id' | 'order'>>): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${taskId}`, payload)
    return data
  },

  async remove(taskId: number): Promise<void> {
    await api.delete(`/tasks/${taskId}`)
  },
}
