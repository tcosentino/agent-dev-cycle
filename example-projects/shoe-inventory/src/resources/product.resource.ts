import { defineResource, z } from '@agentforge/resource'

export const productResource = defineResource({
  name: 'product',

  schema: z.object({
    id: z.string().uuid(),
    brandId: z.string().uuid(),
    model: z.string().min(1).max(100),   // e.g., 'Air Force 1'
    baseSku: z.string().min(2).max(20),  // e.g., 'AF1'
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  createFields: ['brandId', 'model', 'baseSku'],
  updateFields: ['model', 'baseSku'],

  unique: ['baseSku'],
  searchable: ['model', 'baseSku'],

  // Relations - the factory uses these to set up foreign keys and joins
  relations: {
    brand: {
      type: 'belongsTo',
      resource: 'brand',
      foreignKey: 'brandId',
    },
    variants: {
      type: 'hasMany',
      resource: 'variant',
      foreignKey: 'productId',
    },
  },
})
