import { defineResource, z } from '@agentforge/dataobject'

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
  }),

  createFields: ['deploymentId', 'servicePath'],
  updateFields: ['stage', 'logs', 'error', 'containerId', 'port'],
  unique: [],
  searchable: ['servicePath', 'stage'],
  relations: {
    deployment: { type: 'belongsTo', resource: 'deployment', foreignKey: 'deploymentId' },
  },

  // TODO: Custom actions for the deployment pipeline will be added
  // when @agentforge/dataobject supports the actions API
  // actions: {
  //   run: { handler: (workload, ctx) => ctx.deployer?.start(workload) },
  //   stop: { handler: (workload, ctx) => ctx.deployer?.stop(workload) },
  // },
})
