import { createResourceHooks } from '@agentforge/dataobject-react'
import { taskResource } from './index'

export const {
  useList: useTasks,
  useGet: useTask,
  useCreate: useCreateTask,
  useUpdate: useUpdateTask,
  useDelete: useDeleteTask,
} = createResourceHooks(taskResource, {
  baseUrl: '/api',
  optimistic: true,
})
