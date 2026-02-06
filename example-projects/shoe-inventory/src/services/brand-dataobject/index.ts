import { defineResource, z } from '@agentforge/dataobject'

export const brandResource = defineResource({
  name: 'brand',

  schema: z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    code: z.string().min(2).max(4).toUpperCase(), // e.g., 'NK' for Nike
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Which fields are required on create (id, createdAt, updatedAt auto-generated)
  createFields: ['name', 'code'],

  // Which fields can be updated
  updateFields: ['name', 'code'],

  // Unique constraints
  unique: ['code'],

  // Search/filter fields
  searchable: ['name', 'code'],
})
