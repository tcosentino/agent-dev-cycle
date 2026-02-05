import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { messages } from '../schema'
import {
  MessageSchema,
  CreateMessageSchema,
  UpdateMessageSchema,
  IdParam,
  MessageFilterQuery,
  NotFoundSchema,
  OkSchema,
} from '../schemas'

export const messageRoutes = new OpenAPIHono()

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Messages'],
  summary: 'List messages',
  request: { query: MessageFilterQuery },
  responses: {
    200: { content: { 'application/json': { schema: MessageSchema.array() } }, description: 'List of messages' },
  },
})

const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Messages'],
  summary: 'Get a message by ID',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: MessageSchema } }, description: 'Message found' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['Messages'],
  summary: 'Create a message',
  request: { body: { content: { 'application/json': { schema: CreateMessageSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: MessageSchema } }, description: 'Message created' },
  },
})

const update = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Messages'],
  summary: 'Update a message',
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdateMessageSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: MessageSchema } }, description: 'Message updated' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const remove = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Messages'],
  summary: 'Delete a message',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Deleted' },
  },
})

messageRoutes.openapi(list, (c) => {
  const { projectId, channelId } = c.req.valid('query')

  const conditions = []
  if (projectId) conditions.push(eq(messages.projectId, projectId))
  if (channelId) conditions.push(eq(messages.channelId, channelId))

  const result = conditions.length > 0
    ? db.select().from(messages).where(and(...conditions)).all()
    : db.select().from(messages).all()
  return c.json(result, 200)
})

messageRoutes.openapi(getById, (c) => {
  const { id } = c.req.valid('param')
  const result = db.select().from(messages).where(eq(messages.id, id)).get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

messageRoutes.openapi(create, async (c) => {
  const body = c.req.valid('json')
  const result = db.insert(messages).values(body).returning().get()
  return c.json(result, 201)
})

messageRoutes.openapi(update, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const result = db.update(messages).set(body).where(eq(messages.id, id)).returning().get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

messageRoutes.openapi(remove, (c) => {
  const { id } = c.req.valid('param')
  db.delete(messages).where(eq(messages.id, id)).run()
  return c.json({ ok: true }, 200)
})
