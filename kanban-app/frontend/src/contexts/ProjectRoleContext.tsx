import { createContext, useContext } from 'react'

type ProjectRole = 'owner' | 'editor' | 'viewer'

const ProjectRoleContext = createContext<ProjectRole>('viewer')

export const ProjectRoleProvider = ProjectRoleContext.Provider

export const useProjectRole = () => useContext(ProjectRoleContext)

export const useCanEdit = () => {
  const role = useProjectRole()
  return role === 'owner' || role === 'editor'
}
