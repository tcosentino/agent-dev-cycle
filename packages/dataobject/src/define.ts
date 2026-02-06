import { z } from 'zod'

// Relation types
export type RelationType = 'belongsTo' | 'hasMany' | 'hasOne'

export interface Relation {
  type: RelationType
  resource: string
  foreignKey: string
}

// Timestamp fields automatically added to every resource
const timestampFields = {
  createdAt: z.date(),
  updatedAt: z.date(),
}

// Input definition without timestamps (user provides this)
export interface ResourceInput<T extends z.ZodObject<z.ZodRawShape>> {
  name: string
  plural?: string // Custom plural form (e.g., 'agent-status' -> 'agent-statuses')
  schema: T
  createFields: (keyof z.infer<T>)[]
  updateFields: (keyof z.infer<T>)[]
  unique?: (keyof z.infer<T>)[]
  searchable?: (keyof z.infer<T>)[]
  relations?: Record<string, Relation>
  softDelete?: boolean
}

// The shape of a resource definition (includes auto-added timestamps)
export interface ResourceDefinition<T extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  name: string
  plural?: string
  schema: T
  createFields: (keyof z.infer<T>)[]
  updateFields: (keyof z.infer<T>)[]
  unique?: (keyof z.infer<T>)[]
  searchable?: (keyof z.infer<T>)[]
  relations?: Record<string, Relation>
  softDelete?: boolean
}

// Factory function to define a resource with type inference
// Automatically adds createdAt and updatedAt fields to the schema
export function defineResource<T extends z.ZodObject<z.ZodRawShape>>(
  input: ResourceInput<T>
): ResourceDefinition<ReturnType<T['extend']>> {
  // Extend the schema with timestamp fields
  const extendedSchema = input.schema.extend(timestampFields)

  return {
    ...input,
    schema: extendedSchema,
  } as ResourceDefinition<ReturnType<T['extend']>>
}
