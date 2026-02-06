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
])

export const agentSessionLogEntry = z.object({
  timestamp: z.coerce.date(),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string(),
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
    logs: z.array(agentSessionLogEntry).default([]),

    // Result
    summary: z.string().optional(),
    commitSha: z.string().optional(),
    error: z.string().optional(),

    // Timing
    startedAt: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
  }),

  createFields: ['projectId', 'agent', 'phase', 'taskPrompt'],
  updateFields: ['stage', 'progress', 'currentStep', 'logs', 'summary', 'commitSha', 'error', 'startedAt', 'completedAt'],
  unique: ['sessionId'],
  searchable: ['sessionId', 'agent', 'stage'],
  relations: {
    project: { type: 'belongsTo', resource: 'project', foreignKey: 'projectId' },
  },
  skipRoutes: ['create'], // Custom POST route handles sessionId generation
})
