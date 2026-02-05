import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { tasks } from '../schema'
import {
  TaskSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  IdParam,
  ProjectIdQuery,
  NotFoundSchema,
  OkSchema,
} from '../schemas'

export const taskRoutes = new OpenAPIHono()

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tasks'],
  summary: 'List tasks',
  request: { query: ProjectIdQuery },
  responses: {
    200: { content: { 'application/json': { schema: TaskSchema.array() } }, description: 'List of tasks' },
  },
})

const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Tasks'],
  summary: 'Get a task by ID',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: TaskSchema } }, description: 'Task found' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['Tasks'],
  summary: 'Create a task',
  request: { body: { content: { 'application/json': { schema: CreateTaskSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: TaskSchema } }, description: 'Task created' },
  },
})

const update = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Tasks'],
  summary: 'Update a task',
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdateTaskSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: TaskSchema } }, description: 'Task updated' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const remove = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Tasks'],
  summary: 'Delete a task',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Deleted' },
  },
})

taskRoutes.openapi(list, (c) => {
  const { projectId } = c.req.valid('query')
  const result = projectId
    ? db.select().from(tasks).where(eq(tasks.projectId, projectId)).all()
    : db.select().from(tasks).all()
  return c.json(result, 200)
})

taskRoutes.openapi(getById, (c) => {
  const { id } = c.req.valid('param')
  const result = db.select().from(tasks).where(eq(tasks.id, id)).get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

taskRoutes.openapi(create, async (c) => {
  const body = c.req.valid('json')
  const result = db.insert(tasks).values(body).returning().get()
  return c.json(result, 201)
})

taskRoutes.openapi(update, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const result = db.update(tasks).set(body).where(eq(tasks.id, id)).returning().get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

taskRoutes.openapi(remove, (c) => {
  const { id } = c.req.valid('param')
  db.delete(tasks).where(eq(tasks.id, id)).run()
  return c.json({ ok: true }, 200)
})
