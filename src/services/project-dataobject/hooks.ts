import { createResourceHooks } from '@agentforge/dataobject-react'
import { projectResourceDefinition } from './schema'

export const {
  useList: useProjects,
  useGet: useProject,
  useCreate: useCreateProject,
  useUpdate: useUpdateProject,
  useDelete: useDeleteProject,
} = createResourceHooks(projectResourceDefinition as any, {
  baseUrl: '/api',
  optimistic: true,
})
