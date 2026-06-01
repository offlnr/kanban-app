import api from './api'
import type { KanbanColumn } from '../types'

export const kanbanColumnsService = {
  async list(projectId: number): Promise<KanbanColumn[]> {
    const { data } = await api.get<KanbanColumn[]>(`/projects/${projectId}/columns`)
    return data
  },

  async create(projectId: number, name: string, order = 0): Promise<KanbanColumn> {
    const { data } = await api.post<KanbanColumn>(`/projects/${projectId}/columns`, { name, order })
    return data
  },


  async update(
    columnId: number, 
    payload: { name?: string; order?: number; color?: string | null }
  ): Promise<KanbanColumn> {
    const { data } = await api.patch<KanbanColumn>(`/columns/${columnId}`, payload)
    return data
  },

  async remove(columnId: number): Promise<void> {
    await api.delete(`/columns/${columnId}`)
  },
}