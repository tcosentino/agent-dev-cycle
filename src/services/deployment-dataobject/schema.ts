import { z } from 'zod'

export const deploymentStatusEnum = z.enum(['active', 'inactive', 'archived'])

export const deploymentSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  serviceName: z.string().min(1).max(100),
  servicePath: z.string().min(1),
  status: deploymentStatusEnum.default('active'),
})

export const deploymentResourceDefinition = {
  name: 'deployment',
  schema: deploymentSchema,
  createFields: ['projectId', 'serviceName', 'servicePath'],
  updateFields: ['status'],
  unique: [],
  searchable: ['serviceName'],
} as const
