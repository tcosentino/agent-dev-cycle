// @agentforge/resource - Schema-driven API resource definitions
// This is the "fake" library that our AI agents will use to define resources.
// The factory will read these definitions and generate:
// - Database tables (via Drizzle ORM)
// - API routes (CRUD endpoints)
// - TypeScript types
// - Validation

import { z } from 'zod'

// Re-export zod for convenience
export { z }

// Relation types
export type RelationType = 'belongsTo' | 'hasMany' | 'hasOne'

export interface Relation {
  type: RelationType
  resource: string      // Name of the related resource
  foreignKey: string    // The FK field (on this resource for belongsTo, on related for hasMany)
}

// The shape of a resource definition
export interface ResourceDefinition<T extends z.ZodObject<z.ZodRawShape>> {
  // Resource name (singular, lowercase) - e.g., 'brand', 'product'
  name: string

  // Zod schema defining all fields
  schema: T

  // Fields required when creating (excludes auto-generated: id, createdAt, updatedAt)
  createFields: (keyof z.infer<T>)[]

  // Fields that can be updated
  updateFields: (keyof z.infer<T>)[]

  // Fields with unique constraints
  unique?: (keyof z.infer<T>)[]

  // Fields that can be searched/filtered
  searchable?: (keyof z.infer<T>)[]

  // Relations to other resources
  relations?: Record<string, Relation>

  // Optional: soft delete instead of hard delete
  softDelete?: boolean
}

// Factory function to define a resource with type inference
export function defineResource<T extends z.ZodObject<z.ZodRawShape>>(
  definition: ResourceDefinition<T>
): ResourceDefinition<T> {
  return definition
}

// Utility types that the factory will generate
export type InferResource<T extends ResourceDefinition<z.ZodObject<z.ZodRawShape>>> =
  z.infer<T['schema']>

export type InferCreateInput<T extends ResourceDefinition<z.ZodObject<z.ZodRawShape>>> =
  Pick<z.infer<T['schema']>, T['createFields'][number]>

export type InferUpdateInput<T extends ResourceDefinition<z.ZodObject<z.ZodRawShape>>> =
  Partial<Pick<z.infer<T['schema']>, T['updateFields'][number]>>
