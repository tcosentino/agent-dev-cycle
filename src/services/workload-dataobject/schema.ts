import { z } from 'zod'

export const workloadStageEnum = z.enum([
  'pending',
  'validate',
  'build',
  'deploy',
  'running',
  'failed',
  'stopped',
])

export const workloadLogEntry = z.object({
  timestamp: z.date(),
  stage: workloadStageEnum,
  message: z.string(),
  level: z.enum(['info', 'warn', 'error']).default('info'),
})

export const workloadSchema = z.object({
  id: z.string().uuid(),
  deploymentId: z.string().uuid(),
  servicePath: z.string().min(1),
  stage: workloadStageEnum.default('pending'),
  logs: z.array(workloadLogEntry).default([]),
  error: z.string().optional(),
  containerId: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
})

export const workloadResourceDefinition = {
  name: 'workload',
  schema: workloadSchema,
  createFields: ['deploymentId', 'servicePath'],
  updateFields: ['stage', 'logs', 'error', 'containerId', 'port'],
  unique: [],
  searchable: ['servicePath', 'stage'],
} as const
