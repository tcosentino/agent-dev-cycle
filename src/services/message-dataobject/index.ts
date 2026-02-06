import { defineResource, z } from '@agentforge/dataobject'

export const messageTypeEnum = z.enum(['system', 'agent', 'user'])

export const actionStatusEnum = z.enum(['success', 'error', 'warning', 'info'])

export const messageResource = defineResource({
  name: 'message',

  schema: z.object({
    id: z.string().uuid(),
    channelId: z.string().uuid(),
    projectId: z.string().uuid(),
    type: messageTypeEnum,
    sender: z.string().optional(), // agent role: 'pm', 'engineer', etc.
    senderName: z.string().optional(), // display name: 'PM Agent', 'Engineer Agent'
    content: z.string().min(1),
    // Action metadata for rich message display
    actionType: z.string().optional(), // 'created', 'completed', 'analyzed', etc.
    actionStatus: actionStatusEnum.optional(),
    actionLabel: z.string().optional(), // summary label for UI
    actionSubject: z.string().optional(), // reference to task key, etc.
  }),

  createFields: [
    'channelId',
    'projectId',
    'type',
    'sender',
    'senderName',
    'content',
    'actionType',
    'actionStatus',
    'actionLabel',
    'actionSubject',
  ],
  updateFields: [], // Messages are immutable
  unique: [],
  searchable: ['content', 'sender'],
})
