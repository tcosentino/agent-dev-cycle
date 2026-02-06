import { defineResource, z } from '@agentforge/resource'

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

export const workloadResource = defineResource({
  name: 'workload',

  schema: z.object({
    id: z.string().uuid(),
    deploymentId: z.string().uuid(),
    servicePath: z.string().min(1),
    stage: workloadStageEnum.default('pending'),
    logs: z.array(workloadLogEntry).default([]),
    error: z.string().optional(),
    containerId: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  createFields: ['deploymentId', 'servicePath'],
  updateFields: ['stage', 'logs', 'error', 'containerId', 'port'],
  unique: [],
  searchable: ['servicePath', 'stage'],

  // Custom actions for the deployment pipeline
  actions: {
    run: {
      description: 'Start the deployment pipeline',
      handler: async (workload, ctx) => {
        // Will be wired to @agentforge/runtime Deployer
        return ctx.deployer?.start(workload)
      },
    },
    stop: {
      description: 'Stop a running workload',
      handler: async (workload, ctx) => {
        return ctx.deployer?.stop(workload)
      },
    },
  },
})
