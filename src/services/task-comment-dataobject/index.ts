import { defineResource, z } from '@agentforge/dataobject'

export const taskCommentResource = defineResource({
  name: 'taskComment',

  schema: z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    userId: z.string().uuid(),
    content: z.string().min(1).max(5000),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    // For displaying author info
    authorName: z.string().optional(),
    authorEmail: z.string().optional(),
  }),

  createFields: ['taskId', 'userId', 'content'],
  updateFields: ['content'],
  searchable: ['content'],
  relations: {
    task: { type: 'belongsTo', resource: 'task', foreignKey: 'taskId' },
    user: { type: 'belongsTo', resource: 'user', foreignKey: 'userId' },
  },
})
