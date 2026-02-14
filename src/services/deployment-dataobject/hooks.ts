import { createResourceHooks } from '@agentforge/dataobject-react'
import { deploymentResourceDefinition } from './schema'

export const {
  useList: useDeployments,
  useGet: useDeployment,
  useCreate: useCreateDeployment,
  useUpdate: useUpdateDeployment,
  useDelete: useDeleteDeployment,
} = createResourceHooks(deploymentResourceDefinition as any, {
  baseUrl: '/api',
  optimistic: true,
})
