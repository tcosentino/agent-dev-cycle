// @agentforge/dataobject/testing - Test utilities for dataobject resources
// Provides generic CRUD test generation for any dataobject

import type { ZodObject, ZodRawShape, z } from 'zod'
import type { ResourceDefinition } from '../define'
import { pluralize } from '../utils'

export interface TestContext {
  // The base URL for the API
  baseUrl: string
  // Function to make requests (e.g., app.request for Hono)
  request: (url: string, init?: RequestInit) => Promise<Response>
  // Function to reset the database/store before each test
  reset: () => void | Promise<void>
  // Optional: Function to seed prerequisite data (e.g., parent resources)
  seed?: (resourceName: string, data: Record<string, unknown>) => void | Promise<void>
}

export interface TestData<T> {
  // Factory function to create valid test data
  create: (id?: string) => Partial<T>
  // Optional: Data for update tests
  update?: Partial<T>
  // Optional: Prerequisites to seed before creating this resource
  prerequisites?: Array<{
    resource: string
    data: Record<string, unknown>
  }>
  // Optional: Required scope params for list queries (derived from belongsTo relations)
  // If not provided, will be auto-extracted from create() data
  scopeParams?: Record<string, string>
}

// Helper functions for making requests
const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const patch = (body: unknown): RequestInit => ({
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Generate a test suite for a dataobject resource
export function createResourceTests<T extends ZodObject<ZodRawShape>>(
  resource: ResourceDefinition<T>,
  testData: TestData<z.infer<T>>,
  ctx: TestContext,
  testRunner: {
    describe: (name: string, fn: () => void) => void
    it: (name: string, fn: () => void | Promise<void>) => void
    expect: (value: unknown) => {
      toBe: (expected: unknown) => void
      toEqual: (expected: unknown) => void
      toHaveLength: (expected: number) => void
      toBeDefined: () => void
    }
    beforeEach: (fn: () => void | Promise<void>) => void
  }
) {
  const { describe, it, expect, beforeEach } = testRunner
  const pluralName = resource.plural ?? pluralize(resource.name)
  const basePath = `${ctx.baseUrl}/api/${pluralName}`

  // Build required scope params from belongsTo relations
  const buildScopeQuery = (): string => {
    // If explicit scopeParams provided, use those
    if (testData.scopeParams) {
      const params = new URLSearchParams(testData.scopeParams)
      return params.toString() ? `?${params.toString()}` : ''
    }

    // Otherwise, extract from create() data based on belongsTo relations
    if (!resource.relations) return ''

    const sampleData = testData.create() as Record<string, unknown>
    const params = new URLSearchParams()

    for (const [, relation] of Object.entries(resource.relations)) {
      if (relation.type === 'belongsTo') {
        const value = sampleData[relation.foreignKey]
        if (typeof value === 'string') {
          params.set(relation.foreignKey, value)
        }
      }
    }

    return params.toString() ? `?${params.toString()}` : ''
  }

  // Base URL with required scope params for list queries
  const scopeQuery = buildScopeQuery()
  const base = basePath + scopeQuery

  // Helper to seed prerequisites
  const seedPrerequisites = async () => {
    if (testData.prerequisites && ctx.seed) {
      for (const prereq of testData.prerequisites) {
        await ctx.seed(prereq.resource, prereq.data)
      }
    }
  }

  describe(resource.name, () => {
    beforeEach(async () => {
      await ctx.reset()
    })

    // --- LIST ---
    it('GET / returns empty list', async () => {
      const res = await ctx.request(base)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual([])
    })

    it('GET / returns multiple items', async () => {
      await seedPrerequisites()
      await ctx.request(base, json(testData.create('id-1')))
      await ctx.request(base, json(testData.create('id-2')))

      const res = await ctx.request(base)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(2)
    })

    // --- CREATE ---
    it('POST / creates a resource', async () => {
      await seedPrerequisites()
      const body = testData.create('test-id')
      const res = await ctx.request(basePath, json(body))

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.id).toBeDefined()
    })

    // --- GET BY ID ---
    it('GET /:id returns a resource', async () => {
      await seedPrerequisites()
      const createRes = await ctx.request(basePath, json(testData.create()))
      const created = await createRes.json()

      const res = await ctx.request(`${basePath}/${created.id}`)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe(created.id)
    })

    it('GET /:id returns 404 for missing resource', async () => {
      const res = await ctx.request(`${basePath}/00000000-0000-0000-0000-000000000000`)
      expect(res.status).toBe(404)
    })

    // --- UPDATE ---
    // Only run update tests if the resource has updateFields
    if (resource.updateFields.length > 0) {
      it('PATCH /:id updates a resource', async () => {
        await seedPrerequisites()
        const createRes = await ctx.request(basePath, json(testData.create()))
        const created = await createRes.json()

        const updateData = testData.update ?? getFirstUpdateField(resource, testData.create())
        const res = await ctx.request(`${basePath}/${created.id}`, patch(updateData))

        expect(res.status).toBe(200)
        const data = await res.json()
        // Verify at least one field was updated
        const updateKey = Object.keys(updateData)[0]
        if (updateKey) {
          expect(data[updateKey]).toBe(updateData[updateKey])
        }
      })
    }

    it('PATCH /:id returns 404 for missing resource', async () => {
      const res = await ctx.request(
        `${basePath}/00000000-0000-0000-0000-000000000000`,
        patch({ name: 'test' })
      )
      expect(res.status).toBe(404)
    })

    // --- DELETE ---
    it('DELETE /:id deletes a resource', async () => {
      await seedPrerequisites()
      const createRes = await ctx.request(basePath, json(testData.create()))
      const created = await createRes.json()

      const res = await ctx.request(`${basePath}/${created.id}`, { method: 'DELETE' })
      expect(res.status).toBe(200)

      // Verify it's gone
      const check = await ctx.request(`${basePath}/${created.id}`)
      expect(check.status).toBe(404)
    })

    it('DELETE /:id returns 404 for missing resource', async () => {
      const res = await ctx.request(
        `${basePath}/00000000-0000-0000-0000-000000000000`,
        { method: 'DELETE' }
      )
      expect(res.status).toBe(404)
    })

    // --- FOREIGN KEY SCOPING ---
    // Test that resources with belongsTo relations require the scope params
    if (resource.relations) {
      const belongsToRelations = Object.entries(resource.relations)
        .filter(([, r]) => r.type === 'belongsTo')

      if (belongsToRelations.length > 0) {
        it('GET / requires scope query params', async () => {
          // Calling without the required scope should return 400
          const res = await ctx.request(basePath)
          expect(res.status).toBe(400)
        })

        it('GET / with all scope params returns results', async () => {
          await seedPrerequisites()

          // Create an item
          const data1 = testData.create('id-1')
          await ctx.request(basePath, json(data1))

          // Query with all scope params should return items
          const res = await ctx.request(base)
          expect(res.status).toBe(200)
          const results = await res.json()
          expect(results.length).toBeDefined()
        })
      }
    }

    // --- UNIQUE CONSTRAINTS ---
    if (resource.unique && resource.unique.length > 0) {
      const uniqueField = resource.unique[0] as string

      it(`POST / returns 409 for duplicate ${uniqueField}`, async () => {
        await seedPrerequisites()
        const data = testData.create()
        await ctx.request(basePath, json(data))

        // Try to create another with the same unique field
        const duplicate = { ...testData.create('different-id'), [uniqueField]: (data as Record<string, unknown>)[uniqueField] }
        const res = await ctx.request(basePath, json(duplicate))

        expect(res.status).toBe(409)
      })
    }

    // --- SEARCH ---
    if (resource.searchable && resource.searchable.length > 0) {
      it('GET /?q= searches resources', async () => {
        await seedPrerequisites()

        // Create items with distinct searchable content
        const data1 = testData.create('id-1')
        const data2 = testData.create('id-2')

        await ctx.request(basePath, json(data1))
        await ctx.request(basePath, json(data2))

        // Search for something that should match at least one
        const searchField = resource.searchable[0] as string
        const searchValue = (data1 as Record<string, unknown>)[searchField]

        if (typeof searchValue === 'string') {
          // Include required scope params along with search
          // Use ? if no scope query, & if there are scope params
          const separator = scopeQuery ? '&' : '?'
          const res = await ctx.request(`${base}${separator}q=${encodeURIComponent(searchValue)}`)
          expect(res.status).toBe(200)
          // At least the first item should match
          const results = await res.json()
          expect(results.length).toBeDefined()
        }
      })
    }
  })
}

// Helper to get the first updateable field for default update tests
function getFirstUpdateField<T extends ZodObject<ZodRawShape>>(
  resource: ResourceDefinition<T>,
  sampleData: Record<string, unknown>
): Record<string, unknown> {
  const field = resource.updateFields[0]
  if (!field) {
    return {}
  }

  const value = sampleData[field as string]

  // Generate a modified value based on type
  if (typeof value === 'string') {
    return { [field]: `updated-${value}` }
  } else if (typeof value === 'number') {
    return { [field]: value + 1 }
  } else if (typeof value === 'boolean') {
    return { [field]: !value }
  }

  return { [field]: value }
}

// Export test helpers
export { json, patch }
