import api from './api'
import type { WorkPackage } from '../types'

export const workPackagesService = {
  async list(phaseId: number): Promise<WorkPackage[]> {
    const { data } = await api.get<WorkPackage[]>(`/phases/${phaseId}/work-packages`)
    return data
  },

  async create(phaseId: number, payload: { name: string; description?: string; acceptance_criteria?: string }): Promise<WorkPackage> {
    const { data } = await api.post<WorkPackage>(`/phases/${phaseId}/work-packages`, { ...payload, order: 0 })
    return data
  },

  async update(wpId: number, payload: Partial<Pick<WorkPackage, 'name' | 'description' | 'acceptance_criteria' | 'order'>>): Promise<WorkPackage> {
    const { data } = await api.patch<WorkPackage>(`/work-packages/${wpId}`, payload)
    return data
  },

  async remove(wpId: number): Promise<void> {
    await api.delete(`/work-packages/${wpId}`)
  },
}
