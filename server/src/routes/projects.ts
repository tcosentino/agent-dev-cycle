import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { projects } from '../schema'
import {
  ProjectSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  IdParam,
  NotFoundSchema,
  OkSchema,
} from '../schemas'

export const projectRoutes = new OpenAPIHono()

const list = createRoute({
  method: 'get',
  path: '/',
  tags: ['Projects'],
  summary: 'List all projects',
  responses: {
    200: { content: { 'application/json': { schema: ProjectSchema.array() } }, description: 'List of projects' },
  },
})

const getById = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Projects'],
  summary: 'Get a project by ID',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: ProjectSchema } }, description: 'Project found' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const create = createRoute({
  method: 'post',
  path: '/',
  tags: ['Projects'],
  summary: 'Create a project',
  request: { body: { content: { 'application/json': { schema: CreateProjectSchema } } } },
  responses: {
    201: { content: { 'application/json': { schema: ProjectSchema } }, description: 'Project created' },
  },
})

const update = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Projects'],
  summary: 'Update a project',
  request: {
    params: IdParam,
    body: { content: { 'application/json': { schema: UpdateProjectSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: ProjectSchema } }, description: 'Project updated' },
    404: { content: { 'application/json': { schema: NotFoundSchema } }, description: 'Not found' },
  },
})

const remove = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Projects'],
  summary: 'Delete a project',
  request: { params: IdParam },
  responses: {
    200: { content: { 'application/json': { schema: OkSchema } }, description: 'Deleted' },
  },
})

projectRoutes.openapi(list, (c) => {
  const result = db.select().from(projects).all()
  return c.json(result, 200)
})

projectRoutes.openapi(getById, (c) => {
  const { id } = c.req.valid('param')
  const result = db.select().from(projects).where(eq(projects.id, id)).get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

projectRoutes.openapi(create, async (c) => {
  const body = c.req.valid('json')
  const result = db.insert(projects).values(body).returning().get()
  return c.json(result, 201)
})

projectRoutes.openapi(update, async (c) => {
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')
  const result = db.update(projects).set(body).where(eq(projects.id, id)).returning().get()
  if (!result) return c.json({ error: 'Not found' }, 404)
  return c.json(result, 200)
})

projectRoutes.openapi(remove, (c) => {
  const { id } = c.req.valid('param')
  db.delete(projects).where(eq(projects.id, id)).run()
  return c.json({ ok: true }, 200)
})
