import type { ResourceStore } from './types'

// Simple in-memory store for development/testing
export function createMemoryStore<T extends Record<string, unknown>>(): ResourceStore<T> {
  const data = new Map<string, T>()

  return {
    async findAll(options) {
      let results = Array.from(data.values())

      // Filter by where clause
      if (options?.where) {
        results = results.filter(item =>
          Object.entries(options.where!).every(([key, value]) => item[key] === value)
        )
      }

      // Search across searchable fields
      if (options?.search && options?.searchFields) {
        const searchLower = options.search.toLowerCase()
        results = results.filter(item =>
          options.searchFields!.some(field => {
            const val = item[field]
            return typeof val === 'string' && val.toLowerCase().includes(searchLower)
          })
        )
      }

      return results
    },

    async findById(id) {
      return data.get(id) ?? null
    },

    async findOne(where) {
      for (const item of data.values()) {
        if (Object.entries(where).every(([key, value]) => item[key] === value)) {
          return item
        }
      }
      return null
    },

    async create(input) {
      const id = crypto.randomUUID()
      const now = new Date()
      const record = {
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
      } as T
      data.set(id, record)
      return record
    },

    async update(id, updates) {
      const existing = data.get(id)
      if (!existing) return null

      const updated = {
        ...existing,
        ...updates,
        id, // Preserve id
        createdAt: existing.createdAt, // Preserve createdAt
        updatedAt: new Date(),
      } as T
      data.set(id, updated)
      return updated
    },

    async delete(id) {
      return data.delete(id)
    },
  }
}
