import { z } from 'zod'

// Relation types
export type RelationType = 'belongsTo' | 'hasMany' | 'hasOne'

export interface Relation {
  type: RelationType
  resource: string
  foreignKey: string
}

// The shape of a resource definition
export interface ResourceDefinition<T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  name: string
  schema: T
  createFields: (keyof z.infer<T>)[]
  updateFields: (keyof z.infer<T>)[]
  unique?: (keyof z.infer<T>)[]
  searchable?: (keyof z.infer<T>)[]
  relations?: Record<string, Relation>
  softDelete?: boolean
}

// Factory function to define a resource with type inference
export function defineResource<T extends z.ZodObject<z.ZodRawShape>>(
  definition: ResourceDefinition<T>
): ResourceDefinition<T> {
  return definition
}
