import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { channels } from '../schema'
import {
  ChannelSchema,
  CreateChannelSchema,
  UpdateChannelSchema,
  IdParam,
  ProjectIdQuery,
  NotFoundSchema,
  OkSchema,
} from '../schemas'

export const channelRoutes = new OpenAPIHono()

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Channels'],
  summary: 'List channels',
  request: { query: ProjectIdQuery },
  responses: {
    200: { content: { 'application/json': { schema: ChannelSchema.array() } }, description: 'List of channels' },
  },
})

const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Channels'],
  summary: 'Get a channel by ID',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: ChannelSchema } }, description: 'Channel found' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['Channels'],
  summary: 'Create a channel',
  request: { body: { content: { 'application/json': { schema: CreateChannelSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: ChannelSchema } }, description: 'Channel created' },
  },
})

const update = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Channels'],
  summary: 'Update a channel',
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdateChannelSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: ChannelSchema } }, description: 'Channel updated' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const remove = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Channels'],
  summary: 'Delete a channel',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Deleted' },
  },
})

channelRoutes.openapi(list, (c) => {
  const { projectId } = c.req.valid('query')
  const result = projectId
    ? db.select().from(channels).where(eq(channels.projectId, projectId)).all()
    : db.select().from(channels).all()
  return c.json(result, 200)
})

channelRoutes.openapi(getById, (c) => {
  const { id } = c.req.valid('param')
  const result = db.select().from(channels).where(eq(channels.id, id)).get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

channelRoutes.openapi(create, async (c) => {
  const body = c.req.valid('json')
  const result = db.insert(channels).values(body).returning().get()
  return c.json(result, 201)
})

channelRoutes.openapi(update, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const result = db.update(channels).set(body).where(eq(channels.id, id)).returning().get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

channelRoutes.openapi(remove, (c) => {
  const { id } = c.req.valid('param')
  db.delete(channels).where(eq(channels.id, id)).run()
  return c.json({ ok: true }, 200)
})
