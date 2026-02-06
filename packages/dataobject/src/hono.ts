import { Hono } from 'hono'
import { z } from 'zod'
import type { ResourceDefinition } from './define'
import type { ResourceStore } from './stores/types'

// Register resource routes on a Hono app
export function registerResource<T extends z.ZodObject<z.ZodRawShape>>(
  app: Hono,
  resource: ResourceDefinition<T>,
  store: ResourceStore<z.infer<T>>,
  basePath = `/${resource.name}s` // Default pluralization
) {
  type ResourceType = z.infer<T>

  // Build create schema (only createFields, all required)
  const createSchema = resource.schema.pick(
    Object.fromEntries(resource.createFields.map(f => [f, true])) as Record<string, true>
  )

  // Build update schema (only updateFields, all optional)
  const updateSchema = resource.schema
    .pick(Object.fromEntries(resource.updateFields.map(f => [f, true])) as Record<string, true>)
    .partial()

  // GET /resources - List all
  app.get(basePath, async (c) => {
    const search = c.req.query('q')
    const records = await store.findAll({
      search,
      searchFields: resource.searchable as string[],
    })
    return c.json(records)
  })

  // GET /resources/:id - Get one
  app.get(`${basePath}/:id`, async (c) => {
    const id = c.req.param('id')
    const record = await store.findById(id)
    if (!record) {
      return c.json({ error: `${resource.name} not found` }, 404)
    }
    return c.json(record)
  })

  // POST /resources - Create
  app.post(basePath, async (c) => {
    try {
      const body = await c.req.json()
      const validated = createSchema.parse(body)

      // Check unique constraints
      if (resource.unique) {
        for (const field of resource.unique) {
          const existing = await store.findOne({ [field]: validated[field as keyof typeof validated] } as Partial<ResourceType>)
          if (existing) {
            return c.json(
              { error: `${resource.name} with this ${String(field)} already exists` },
              409
            )
          }
        }
      }

      const record = await store.create(validated as Omit<ResourceType, 'id' | 'createdAt' | 'updatedAt'>)
      return c.json(record, 201)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ error: 'Validation failed', details: err.errors }, 400)
      }
      throw err
    }
  })

  // PUT /resources/:id - Update
  app.put(`${basePath}/:id`, async (c) => {
    const id = c.req.param('id')

    try {
      const body = await c.req.json()
      const validated = updateSchema.parse(body)

      // Check unique constraints for updated fields
      if (resource.unique) {
        for (const field of resource.unique) {
          if (field in validated) {
            const existing = await store.findOne({ [field]: validated[field as keyof typeof validated] } as Partial<ResourceType>)
            if (existing && (existing as Record<string, unknown>).id !== id) {
              return c.json(
                { error: `${resource.name} with this ${String(field)} already exists` },
                409
              )
            }
          }
        }
      }

      const record = await store.update(id, validated as Partial<ResourceType>)
      if (!record) {
        return c.json({ error: `${resource.name} not found` }, 404)
      }
      return c.json(record)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return c.json({ error: 'Validation failed', details: err.errors }, 400)
      }
      throw err
    }
  })

  // DELETE /resources/:id - Delete
  app.delete(`${basePath}/:id`, async (c) => {
    const id = c.req.param('id')
    const deleted = await store.delete(id)
    if (!deleted) {
      return c.json({ error: `${resource.name} not found` }, 404)
    }
    return c.body(null, 204)
  })
}
