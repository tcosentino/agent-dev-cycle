import { createResourceHooks } from '@agentforge/dataobject-react'
import { taskResourceDefinition } from './schema'

export const {
  useList: useTasks,
  useGet: useTask,
  useCreate: useCreateTask,
  useUpdate: useUpdateTask,
  useDelete: useDeleteTask,
} = createResourceHooks(taskResourceDefinition as any, {
  baseUrl: '/api',
  optimistic: true,
})
