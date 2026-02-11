import { createResourceHooks } from '@agentforge/dataobject-react'
import { taskCommentResource } from './index'

export const {
  useList: useTaskComments,
  useGet: useTaskComment,
  useCreate: useCreateTaskComment,
  useUpdate: useUpdateTaskComment,
  useDelete: useDeleteTaskComment,
} = createResourceHooks(taskCommentResource, {
  baseUrl: '/api',
  optimistic: true,
})
