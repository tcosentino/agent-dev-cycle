// @agentforge/resource - Schema-driven API resource definitions
// Defines resources that get transformed into working APIs

export { z } from 'zod'
export type { ZodObject, ZodRawShape } from 'zod'

export { defineResource } from './define'
export type { ResourceDefinition, Relation, RelationType } from './define'

export { createResourceHandler } from './handler'
export type { ResourceHandler, HandlerContext } from './handler'

export { createMemoryStore } from './stores/memory'
export type { ResourceStore } from './stores/types'

export { registerResource } from './hono'
