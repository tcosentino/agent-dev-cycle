// @agentforge/dataobject - Schema-driven API data object definitions
// Defines data objects that get transformed into working APIs

export { z } from 'zod'
export type { ZodObject, ZodRawShape } from 'zod'

export { defineResource } from './define'
export type { ResourceDefinition, Relation, RelationType, AutoIncrementConfig, SkippableRoute } from './define'

export { pluralize, capitalize } from './utils'

export { createResourceHandler } from './handler'
export type { ResourceHandler, HandlerContext } from './handler'

// Stores
export { createMemoryStore } from './stores/memory'
export { createSqliteStore, createTableFromResource, migrateTableFromResource } from './stores/sqlite'
export type { ResourceStore } from './stores/types'

// Hono integration (basic)
export { registerResource } from './hono'

// OpenAPI integration
export { registerOpenApiResource, createOpenApiApp } from './openapi'
export type { OpenApiResourceOptions } from './openapi'
