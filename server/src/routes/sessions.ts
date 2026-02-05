import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { sessions } from '../schema'
import {
  SessionSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  IdParam,
  ProjectIdQuery,
  NotFoundSchema,
  OkSchema,
} from '../schemas'

export const sessionRoutes = new OpenAPIHono()

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Sessions'],
  summary: 'List sessions',
  request: { query: ProjectIdQuery },
  responses: {
    200: { content: { 'application/json': { schema: SessionSchema.array() } }, description: 'List of sessions' },
  },
})

const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Sessions'],
  summary: 'Get a session by ID',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: SessionSchema } }, description: 'Session found' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['Sessions'],
  summary: 'Create a session',
  request: { body: { content: { 'application/json': { schema: CreateSessionSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: SessionSchema } }, description: 'Session created' },
  },
})

const update = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Sessions'],
  summary: 'Update a session',
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdateSessionSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: SessionSchema } }, description: 'Session updated' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const remove = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Sessions'],
  summary: 'Delete a session',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Deleted' },
  },
})

sessionRoutes.openapi(list, (c) => {
  const { projectId } = c.req.valid('query')
  const result = projectId
    ? db.select().from(sessions).where(eq(sessions.projectId, projectId)).all()
    : db.select().from(sessions).all()
  return c.json(result, 200)
})

sessionRoutes.openapi(getById, (c) => {
  const { id } = c.req.valid('param')
  const result = db.select().from(sessions).where(eq(sessions.id, id)).get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

sessionRoutes.openapi(create, async (c) => {
  const body = c.req.valid('json')
  const result = db.insert(sessions).values(body).returning().get()
  return c.json(result, 201)
})

sessionRoutes.openapi(update, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const result = db.update(sessions).set(body).where(eq(sessions.id, id)).returning().get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

sessionRoutes.openapi(remove, (c) => {
  const { id } = c.req.valid('param')
  db.delete(sessions).where(eq(sessions.id, id)).run()
  return c.json({ ok: true }, 200)
})
