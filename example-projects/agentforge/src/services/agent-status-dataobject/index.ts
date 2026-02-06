import { defineResource, z } from '@agentforge/resource'

export const agentRoleEnum = z.enum(['pm', 'engineer', 'qa', 'lead'])

export const agentStatusValueEnum = z.enum(['active', 'away', 'busy'])

export const agentStatusResource = defineResource({
  name: 'agentStatus',

  schema: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    role: agentRoleEnum,
    status: agentStatusValueEnum.default('away'),
    currentTask: z.string().optional(), // task key being worked on
    lastActiveAt: z.date(),
  }),

  createFields: ['projectId', 'role', 'status', 'currentTask'],
  updateFields: ['status', 'currentTask', 'lastActiveAt'],
  unique: [], // Each project can have one of each role
  searchable: ['role'],
})
