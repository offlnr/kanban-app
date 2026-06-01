export interface User {
  id: number
  email: string
  full_name: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export type MemberRole = 'owner' | 'editor' | 'viewer'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: number
  name: string
  description: string | null
  owner_id: number
  created_at: string
}

export interface ProjectMember {
  project_id: number
  user_id: number
  role: MemberRole
}

export interface MemberWithUser {
  project_id: number
  user_id: number
  role: MemberRole
  user: User
}

export interface ProjectMembersData {
  owner: User
  members: MemberWithUser[]
  current_user_role: string
}

export interface Phase {
  id: number
  project_id: number
  name: string
  description: string | null
  order: number
}

export interface WorkPackage {
  id: number
  phase_id: number
  name: string
  description: string | null
  acceptance_criteria: string | null
  order: number
}

export interface KanbanColumn {
  id: number
  project_id: number
  name: string
  order: number
  color: string | null
}

export interface Task {
  id: number
  work_package_id: number
  column_id: number
  title: string
  description: string | null
  priority: TaskPriority
  estimated_hours: number | null
  assigned_to: number | null
  due_date: string | null
  order: number
  created_at: string
  updated_at: string
}
