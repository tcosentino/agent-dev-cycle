import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { agentStatus } from '../schema'
import {
  AgentStatusRowSchema,
  CreateAgentStatusSchema,
  UpdateAgentStatusSchema,
  IdParam,
  ProjectIdQuery,
  NotFoundSchema,
  OkSchema,
} from '../schemas'

export const agentStatusRoutes = new OpenAPIHono()

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Agent Status'],
  summary: 'List agent statuses',
  request: { query: ProjectIdQuery },
  responses: {
    200: { content: { 'application/json': { schema: AgentStatusRowSchema.array() } }, description: 'List of agent statuses' },
  },
})

const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Agent Status'],
  summary: 'Get an agent status by ID',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: AgentStatusRowSchema } }, description: 'Agent status found' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['Agent Status'],
  summary: 'Create an agent status',
  request: { body: { content: { 'application/json': { schema: CreateAgentStatusSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: AgentStatusRowSchema } }, description: 'Agent status created' },
  },
})

const update = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Agent Status'],
  summary: 'Update an agent status',
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdateAgentStatusSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: AgentStatusRowSchema } }, description: 'Agent status updated' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const remove = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Agent Status'],
  summary: 'Delete an agent status',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Deleted' },
  },
})

agentStatusRoutes.openapi(list, (c) => {
  const { projectId } = c.req.valid('query')
  const result = projectId
    ? db.select().from(agentStatus).where(eq(agentStatus.projectId, projectId)).all()
    : db.select().from(agentStatus).all()
  return c.json(result, 200)
})

agentStatusRoutes.openapi(getById, (c) => {
  const { id } = c.req.valid('param')
  const result = db.select().from(agentStatus).where(eq(agentStatus.id, id)).get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

agentStatusRoutes.openapi(create, async (c) => {
  const body = c.req.valid('json')
  const result = db.insert(agentStatus).values(body).returning().get()
  return c.json(result, 201)
})

agentStatusRoutes.openapi(update, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const result = db.update(agentStatus).set(body).where(eq(agentStatus.id, id)).returning().get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

agentStatusRoutes.openapi(remove, (c) => {
  const { id } = c.req.valid('param')
  db.delete(agentStatus).where(eq(agentStatus.id, id)).run()
  return c.json({ ok: true }, 200)
})
