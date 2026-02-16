import { defineResource, z } from '@agentforge/dataobject'

export const agentSessionAgentEnum = z.enum(['pm', 'engineer', 'qa', 'lead'])

export const agentSessionPhaseEnum = z.enum(['discovery', 'shaping', 'building', 'delivery'])

export const agentSessionStageEnum = z.enum([
  'pending',
  'cloning',
  'loading',
  'executing',
  'capturing',
  'committing',
  'completed',
  'failed',
  'cancelling',
  'cancelled',
  'paused',
  'resuming',
])

export const agentSessionLogEntry = z.object({
  timestamp: z.coerce.date(),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string(),
})

export const agentSessionStageOutput = z.object({
  logs: z.array(agentSessionLogEntry).default([]),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  duration: z.number().optional(), // Duration in milliseconds
})

export const agentSessionResource = defineResource({
  name: 'agentSession',

  schema: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    sessionId: z.string().min(1), // Auto-generated server-side, e.g., 'pm-001', 'eng-003'
    agent: agentSessionAgentEnum,
    phase: agentSessionPhaseEnum,
    taskPrompt: z.string().min(1),

    // Execution state
    stage: agentSessionStageEnum.default('pending'),
    progress: z.number().min(0).max(100).default(0),
    currentStep: z.string().optional(),
    logs: z.array(agentSessionLogEntry).default([]), // Deprecated: kept for backwards compatibility

    // Stage-specific outputs
    stageOutputs: z.object({
      cloning: agentSessionStageOutput.optional(),
      loading: agentSessionStageOutput.optional(),
      executing: agentSessionStageOutput.optional(),
      capturing: agentSessionStageOutput.optional(),
      committing: agentSessionStageOutput.optional(),
    }).default({}),

    // Result
    summary: z.string().optional(),
    commitSha: z.string().optional(),
    error: z.string().optional(),

    // Retry lineage
    retriedFromId: z.string().uuid().optional(),
    retryCount: z.number().int().min(0).default(0),

    // Timing
    startedAt: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
  }),

  createFields: ['projectId', 'agent', 'phase', 'taskPrompt'],
  updateFields: ['stage', 'progress', 'currentStep', 'logs', 'stageOutputs', 'summary', 'commitSha', 'error', 'retriedFromId', 'retryCount', 'startedAt', 'completedAt'],
  unique: ['sessionId'],
  searchable: ['sessionId', 'agent', 'stage'],
  relations: {
    project: { type: 'belongsTo', resource: 'project', foreignKey: 'projectId' },
  },
  skipRoutes: ['create'], // Custom POST route handles sessionId generation
})
