import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import type { RouteHandler } from '@hono/zod-openapi'
import { z } from 'zod'
import type { ResourceDefinition } from './define'
import type { ResourceStore } from './stores/types'
import { pluralize, capitalize } from './utils'

// Common schemas
const NotFoundSchema = z.object({
  error: z.string(),
})

const ValidationErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.object({
    code: z.string(),
    message: z.string(),
    path: z.array(z.union([z.string(), z.number()])),
  })),
})

const ConflictSchema = z.object({
  error: z.string(),
})

const OkSchema = z.object({
  ok: z.boolean(),
})

export interface OpenApiResourceOptions {
  basePath?: string
  tags?: string[]
}

// Register resource with OpenAPI documentation
export function registerOpenApiResource<T extends z.ZodObject<z.ZodRawShape>>(
  app: OpenAPIHono,
  resource: ResourceDefinition<T>,
  store: ResourceStore<z.infer<T>>,
  options: OpenApiResourceOptions = {}
) {
  type ResourceType = z.infer<T>

  const pluralName = resource.plural ?? pluralize(resource.name)
  const basePath = options.basePath ?? `/${pluralName}`
  const tags = options.tags ?? [capitalize(resource.name)]
  const resourceName = capitalize(resource.name)

  // Build create schema (only createFields, all required)
  const createSchema = resource.schema.pick(
    Object.fromEntries(resource.createFields.map(f => [f, true])) as Record<string, true>
  )

  // Build update schema (only updateFields, all optional)
  const updateSchema = resource.schema
    .pick(Object.fromEntries(resource.updateFields.map(f => [f, true])) as Record<string, true>)
    .partial()

  // Build query params schema from relations (foreign keys) and search
  // belongsTo relations are REQUIRED - you must scope queries to their parent
  const requiredParams: Record<string, z.ZodString> = {}
  const optionalParams: Record<string, z.ZodOptional<z.ZodString>> = {}

  // Add foreign key filters from relations (required for belongsTo)
  if (resource.relations) {
    for (const [, relation] of Object.entries(resource.relations)) {
      if (relation.type === 'belongsTo') {
        requiredParams[relation.foreignKey] = z.string().uuid()
      }
    }
  }

  // Add search param (optional)
  if (resource.searchable && resource.searchable.length > 0) {
    optionalParams['q'] = z.string().optional()
  }

  const querySchema = z.object({ ...requiredParams, ...optionalParams })

  // ID param schema
  const idParam = z.object({
    id: z.string().uuid().openapi({ description: `${resourceName} ID` }),
  })

  // --- LIST route ---
  const listRoute = createRoute({
    method: 'get',
    path: basePath,
    tags,
    summary: `List ${pluralName}`,
    request: { query: querySchema },
    responses: {
      200: {
        content: { 'application/json': { schema: resource.schema.array() } },
        description: `List of ${pluralName}`,
      },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.openapi(listRoute, (async (c: any) => {
    const query = c.req.valid('query') as Record<string, string | undefined>
    const search = query?.q

    // Build where clause from foreign key params
    const where: Partial<ResourceType> = {}
    if (resource.relations) {
      for (const [, relation] of Object.entries(resource.relations)) {
        if (relation.type === 'belongsTo') {
          const val = query[relation.foreignKey]
          if (val) {
            (where as Record<string, unknown>)[relation.foreignKey] = val
          }
        }
      }
    }

    const records = await store.findAll({
      where: Object.keys(where).length > 0 ? where : undefined,
      search,
      searchFields: resource.searchable as string[],
    })
    return c.json(records, 200)
  }) as unknown as RouteHandler<typeof listRoute>)

  // --- GET BY ID route ---
  const getByIdRoute = createRoute({
    method: 'get',
    path: `${basePath}/{id}`,
    tags,
    summary: `Get ${resource.name} by ID`,
    request: { params: idParam },
    responses: {
      200: {
        content: { 'application/json': { schema: resource.schema } },
        description: `${resourceName} found`,
      },
      404: {
        content: { 'application/json': { schema: NotFoundSchema } },
        description: 'Not found',
      },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.openapi(getByIdRoute, (async (c: any) => {
    const { id } = c.req.valid('param')
    const record = await store.findById(id)
    if (!record) {
      return c.json({ error: `${resourceName} not found` }, 404)
    }
    return c.json(record, 200)
  }) as unknown as RouteHandler<typeof getByIdRoute>)

  // --- CREATE route ---
  const createRoute_ = createRoute({
    method: 'post',
    path: basePath,
    tags,
    summary: `Create ${resource.name}`,
    request: {
      body: { content: { 'application/json': { schema: createSchema } } },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: resource.schema } },
        description: `${resourceName} created`,
      },
      400: {
        content: { 'application/json': { schema: ValidationErrorSchema } },
        description: 'Validation error',
      },
      409: {
        content: { 'application/json': { schema: ConflictSchema } },
        description: 'Conflict - unique constraint violated',
      },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.openapi(createRoute_, (async (c: any) => {
    const body = c.req.valid('json')

    // Check unique constraints
    if (resource.unique) {
      for (const field of resource.unique) {
        const existing = await store.findOne({
          [field]: body[field as keyof typeof body],
        } as Partial<ResourceType>)
        if (existing) {
          return c.json(
            { error: `${resourceName} with this ${String(field)} already exists` },
            409
          )
        }
      }
    }

    const record = await store.create(body as Omit<ResourceType, 'id' | 'createdAt' | 'updatedAt'>)
    return c.json(record, 201)
  }) as unknown as RouteHandler<typeof createRoute_>)

  // --- UPDATE route ---
  const updateRoute = createRoute({
    method: 'patch',
    path: `${basePath}/{id}`,
    tags,
    summary: `Update ${resource.name}`,
    request: {
      params: idParam,
      body: { content: { 'application/json': { schema: updateSchema } } },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: resource.schema } },
        description: `${resourceName} updated`,
      },
      400: {
        content: { 'application/json': { schema: ValidationErrorSchema } },
        description: 'Validation error',
      },
      404: {
        content: { 'application/json': { schema: NotFoundSchema } },
        description: 'Not found',
      },
      409: {
        content: { 'application/json': { schema: ConflictSchema } },
        description: 'Conflict - unique constraint violated',
      },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.openapi(updateRoute, (async (c: any) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    // Check unique constraints for updated fields
    if (resource.unique) {
      for (const field of resource.unique) {
        if (field in body) {
          const existing = await store.findOne({
            [field]: body[field as keyof typeof body],
          } as Partial<ResourceType>)
          if (existing && (existing as Record<string, unknown>).id !== id) {
            return c.json(
              { error: `${resourceName} with this ${String(field)} already exists` },
              409
            )
          }
        }
      }
    }

    const record = await store.update(id, body as Partial<ResourceType>)
    if (!record) {
      return c.json({ error: `${resourceName} not found` }, 404)
    }
    return c.json(record, 200)
  }) as unknown as RouteHandler<typeof updateRoute>)

  // --- DELETE route ---
  const deleteRoute = createRoute({
    method: 'delete',
    path: `${basePath}/{id}`,
    tags,
    summary: `Delete ${resource.name}`,
    request: { params: idParam },
    responses: {
      200: {
        content: { 'application/json': { schema: OkSchema } },
        description: 'Deleted successfully',
      },
      404: {
        content: { 'application/json': { schema: NotFoundSchema } },
        description: 'Not found',
      },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.openapi(deleteRoute, (async (c: any) => {
    const { id } = c.req.valid('param')
    const deleted = await store.delete(id)
    if (!deleted) {
      return c.json({ error: `${resourceName} not found` }, 404)
    }
    return c.json({ ok: true }, 200)
  }) as unknown as RouteHandler<typeof deleteRoute>)
}

// Create an OpenAPI Hono app with documentation endpoint
export function createOpenApiApp(options?: {
  title?: string
  version?: string
  description?: string
}) {
  const app = new OpenAPIHono()

  app.doc('/api/doc', {
    openapi: '3.1.0',
    info: {
      title: options?.title ?? 'API',
      version: options?.version ?? '0.1.0',
      description: options?.description,
    },
  })

  return app
}
