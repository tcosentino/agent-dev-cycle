import { createResourceHooks } from '@agentforge/dataobject-react'
import { workloadResourceDefinition } from './schema'

export const {
  useList: useWorkloads,
  useGet: useWorkload,
  useCreate: useCreateWorkload,
  useUpdate: useUpdateWorkload,
  useDelete: useDeleteWorkload,
} = createResourceHooks(workloadResourceDefinition as any, {
  baseUrl: '/api',
  optimistic: true,
})
