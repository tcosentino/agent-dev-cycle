import { defineResource, z } from '@agentforge/dataobject'

export const deploymentStatusEnum = z.enum(['active', 'inactive', 'archived'])

export const deploymentResource = defineResource({
  name: 'deployment',

  schema: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    serviceName: z.string().min(1).max(100),
    servicePath: z.string().min(1), // path to service in repo
    status: deploymentStatusEnum.default('active'),
    createdAt: z.date(),
  }),

  createFields: ['projectId', 'serviceName', 'servicePath'],
  updateFields: ['status'],
  unique: [],
  searchable: ['serviceName'],
})
