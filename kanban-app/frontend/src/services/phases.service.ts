import api from './api'
import type { Phase } from '../types'

export const phasesService = {
  async list(projectId: number): Promise<Phase[]> {
    const { data } = await api.get<Phase[]>(`/projects/${projectId}/phases`)
    return data
  },

  async create(projectId: number, name: string, description?: string): Promise<Phase> {
    const { data } = await api.post<Phase>(`/projects/${projectId}/phases`, { name, description, order: 0 })
    return data
  },

  async update(phaseId: number, payload: Partial<Pick<Phase, 'name' | 'description' | 'order'>>): Promise<Phase> {
    const { data } = await api.patch<Phase>(`/phases/${phaseId}`, payload)
    return data
  },

  async remove(phaseId: number): Promise<void> {
    await api.delete(`/phases/${phaseId}`)
  },
}
