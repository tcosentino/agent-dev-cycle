import { z } from 'zod'
import type { ResourceDefinition } from './define'
import type { ResourceStore } from './stores/types'

export interface HandlerContext {
  params: Record<string, string>
}

export interface ResourceHandler {
  GET: (request: Request, context: HandlerContext) => Promise<Response>
  POST: (request: Request, context: HandlerContext) => Promise<Response>
  PUT: (request: Request, context: HandlerContext) => Promise<Response>
  DELETE: (request: Request, context: HandlerContext) => Promise<Response>
}

// Create Next.js route handlers from a resource definition
export function createResourceHandler<T extends z.ZodObject<z.ZodRawShape>>(
  resource: ResourceDefinition<T>,
  store: ResourceStore<z.infer<T>>
): ResourceHandler {
  type ResourceType = z.infer<T>

  // Build create schema (only createFields, all required)
  const createSchema = resource.schema.pick(
    Object.fromEntries(resource.createFields.map(f => [f, true])) as Record<string, true>
  )

  // Build update schema (only updateFields, all optional)
  const updateSchema = resource.schema
    .pick(Object.fromEntries(resource.updateFields.map(f => [f, true])) as Record<string, true>)
    .partial()

  return {
    // GET /resources or GET /resources/[id]
    async GET(request: Request, context: HandlerContext) {
      const id = context.params?.id

      if (id) {
        // Get single record
        const record = await store.findById(id)
        if (!record) {
          return Response.json({ error: `${resource.name} not found` }, { status: 404 })
        }
        return Response.json(record)
      }

      // List all records
      const url = new URL(request.url)
      const search = url.searchParams.get('q') || undefined
      const records = await store.findAll({
        search,
        searchFields: resource.searchable as string[],
      })
      return Response.json(records)
    },

    // POST /resources
    async POST(request: Request) {
      try {
        const body = await request.json()
        const validated = createSchema.parse(body)

        // Check unique constraints
        if (resource.unique) {
          for (const field of resource.unique) {
            const existing = await store.findOne({ [field]: validated[field as keyof typeof validated] } as Partial<ResourceType>)
            if (existing) {
              return Response.json(
                { error: `${resource.name} with this ${String(field)} already exists` },
                { status: 409 }
              )
            }
          }
        }

        const record = await store.create(validated as Omit<ResourceType, 'id' | 'createdAt' | 'updatedAt'>)
        return Response.json(record, { status: 201 })
      } catch (err) {
        if (err instanceof z.ZodError) {
          return Response.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
        }
        throw err
      }
    },

    // PUT /resources/[id]
    async PUT(request: Request, context: HandlerContext) {
      const id = context.params?.id
      if (!id) {
        return Response.json({ error: 'ID required' }, { status: 400 })
      }

      try {
        const body = await request.json()
        const validated = updateSchema.parse(body)

        // Check unique constraints for updated fields
        if (resource.unique) {
          for (const field of resource.unique) {
            if (field in validated) {
              const existing = await store.findOne({ [field]: validated[field as keyof typeof validated] } as Partial<ResourceType>)
              if (existing && (existing as Record<string, unknown>).id !== id) {
                return Response.json(
                  { error: `${resource.name} with this ${String(field)} already exists` },
                  { status: 409 }
                )
              }
            }
          }
        }

        const record = await store.update(id, validated as Partial<ResourceType>)
        if (!record) {
          return Response.json({ error: `${resource.name} not found` }, { status: 404 })
        }
        return Response.json(record)
      } catch (err) {
        if (err instanceof z.ZodError) {
          return Response.json({ error: 'Validation failed', details: err.errors }, { status: 400 })
        }
        throw err
      }
    },

    // DELETE /resources/[id]
    async DELETE(_request: Request, context: HandlerContext) {
      const id = context.params?.id
      if (!id) {
        return Response.json({ error: 'ID required' }, { status: 400 })
      }

      const deleted = await store.delete(id)
      if (!deleted) {
        return Response.json({ error: `${resource.name} not found` }, { status: 404 })
      }
      return new Response(null, { status: 204 })
    },
  }
}
