import { defineResource, z } from '@agentforge/dataobject'

export const taskTypeEnum = z.enum([
  'epic',
  'api',
  'backend',
  'frontend',
  'testing',
  'documentation',
  'devops',
])

export const taskPriorityEnum = z.enum(['critical', 'high', 'medium', 'low'])

export const taskStatusEnum = z.enum([
  'todo',
  'in-progress',
  'review',
  'done',
  'blocked',
])

export const taskResource = defineResource({
  name: 'task',

  schema: z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    key: z.string().min(1).max(20), // e.g., 'AF-1' - auto-generated from project.key
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    type: taskTypeEnum.optional(),
    priority: taskPriorityEnum.optional(),
    status: taskStatusEnum.default('todo'),
    assignee: z.string().optional(), // agent role: 'pm', 'engineer', 'qa', 'lead'
  }),

  createFields: ['projectId', 'key', 'title', 'description', 'type', 'priority', 'status', 'assignee'],
  updateFields: ['title', 'description', 'type', 'priority', 'status', 'assignee'],
  unique: ['key'],
  searchable: ['title', 'key', 'assignee'],
  relations: {
    project: { type: 'belongsTo', resource: 'project', foreignKey: 'projectId' },
  },

  // Auto-generate key from project's key prefix (e.g., "AF-1", "AF-2")
  autoIncrement: {
    field: 'key',
    prefixFrom: {
      relation: 'project',
      field: 'key',
    },
  },
})
