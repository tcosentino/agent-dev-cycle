import { createResourceHooks } from '@agentforge/dataobject-react'
import { taskCommentResourceDefinition } from './schema'

export const {
  useList: useTaskComments,
  useGet: useTaskComment,
  useCreate: useCreateTaskComment,
  useUpdate: useUpdateTaskComment,
  useDelete: useDeleteTaskComment,
} = createResourceHooks(taskCommentResourceDefinition as any, {
  baseUrl: '/api',
  optimistic: true,
})
