import { defineResource, z } from '@agentforge/dataobject'

export const sessionAgentEnum = z.enum(['pm', 'engineer', 'qa', 'lead'])

export const sessionPhaseEnum = z.enum(['shaping', 'building', 'stabilizing'])

export const sessionResource = defineResource({
  name: 'session',

  schema: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    runId: z.string().min(1), // e.g., 'pm-001', 'eng-003'
    agent: sessionAgentEnum,
    phase: sessionPhaseEnum.optional(),
    summary: z.string().optional(),
    startedAt: z.date(),
    completedAt: z.date().optional(),
  }),

  createFields: ['projectId', 'runId', 'agent', 'phase'],
  updateFields: ['summary', 'completedAt'],
  unique: ['runId'],
  searchable: ['runId', 'agent'],
})
