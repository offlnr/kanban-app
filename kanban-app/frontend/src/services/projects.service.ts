import api from './api'
import type { Project, ProjectMembersData, MemberRole } from '../types'

export const projectsService = {
  async list(): Promise<Project[]> {
    const { data } = await api.get<Project[]>('/projects/')
    return data
  },

  async get(id: number): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`)
    return data
  },

  async create(name: string, description?: string): Promise<Project> {
    const { data } = await api.post<Project>('/projects/', { name, description })
    return data
  },

  async update(id: number, payload: { name?: string; description?: string }): Promise<Project> {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/projects/${id}`)
  },

  async getMyRole(projectId: number): Promise<'owner' | 'editor' | 'viewer'> {
    const { data } = await api.get<{ role: 'owner' | 'editor' | 'viewer' }>(`/projects/${projectId}/my-role`)
    return data.role
  },

  async getMembers(projectId: number): Promise<ProjectMembersData> {
    const { data } = await api.get<ProjectMembersData>(`/projects/${projectId}/members`)
    return data
  },

  async addMember(projectId: number, userId: number, role: MemberRole): Promise<void> {
    await api.post(`/projects/${projectId}/members`, { user_id: userId, role })
  },

  async updateMemberRole(projectId: number, userId: number, role: MemberRole): Promise<void> {
    await api.patch(`/projects/${projectId}/members/${userId}`, { role })
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`)
  },
}
