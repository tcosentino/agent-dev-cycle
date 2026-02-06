import Database from 'better-sqlite3'
import { cors } from 'hono/cors'
import {
  createOpenApiApp,
  registerOpenApiResource,
  createSqliteStore,
  createTableFromResource,
  createMemoryStore,
  pluralize,
  capitalize,
  type ResourceStore,
} from '@agentforge/dataobject'
import type { DataObjectModule, IntegrationModule } from './discover'

export interface ServerOptions {
  title?: string
  version?: string
  description?: string
  port?: number
  // Storage options
  storage?: 'memory' | 'sqlite'
  dbPath?: string
}

export interface ServerInstance {
  app: ReturnType<typeof createOpenApiApp>
  db?: Database.Database
  stores: Map<string, ResourceStore<Record<string, unknown>>>
}

// Create an API server from dataobject modules and integration services
export function createServer(
  modules: DataObjectModule[],
  integrations: IntegrationModule[] = [],
  options: ServerOptions = {}
): ServerInstance {
  const {
    title = 'AgentForge API',
    version = '0.1.0',
    description = 'Auto-generated API from dataobject services',
    storage = 'memory',
    dbPath = ':memory:',
  } = options

  // Create OpenAPI app
  const app = createOpenApiApp({ title, version, description })

  // Enable CORS
  app.use('*', cors())

  // Initialize database if using SQLite
  let db: Database.Database | undefined
  if (storage === 'sqlite') {
    db = new Database(dbPath)
  }

  // Create stores for each module (first pass - create all stores)
  const stores = new Map<string, ResourceStore<Record<string, unknown>>>()

  for (const module of modules) {
    const { resource } = module
    const resourceName = resource.name
    const pluralName = resource.plural ?? pluralize(resourceName)

    // Create store based on storage type
    let store: ResourceStore<Record<string, unknown>>

    if (storage === 'sqlite' && db) {
      // Create table and SQLite store
      createTableFromResource(db, resource, pluralName)
      store = createSqliteStore({
        db,
        tableName: pluralName,
      })
    } else {
      // Create memory store
      store = createMemoryStore()
    }

    stores.set(resourceName, store)
  }

  // Register OpenAPI routes (second pass - now all stores exist for auto-increment lookups)
  for (const module of modules) {
    const { resource, serviceInfo } = module
    const resourceName = resource.name
    const pluralName = resource.plural ?? pluralize(resourceName)
    const store = stores.get(resourceName)!

    registerOpenApiResource(app, resource, store, {
      basePath: `/api/${pluralName}`,
      tags: [capitalize(resourceName)],
      stores, // Pass all stores for auto-increment lookups
    })

    console.log(`Registered: /api/${pluralName} (${serviceInfo.name})`)
  }

  // Register integration services
  for (const integration of integrations) {
    const { service, serviceInfo } = integration
    service.register(app, { stores })
    console.log(`Registered integration: ${service.name} (${serviceInfo.name})`)
  }

  // Health check endpoint
  app.get('/health', (c) => c.json({ status: 'ok' }))

  // Root endpoint with service list
  app.get('/', (c) => {
    const services = modules.map(m => ({
      name: m.resource.name,
      path: `/api/${m.resource.plural ?? pluralize(m.resource.name)}`,
      service: m.serviceInfo.name,
    }))
    return c.json({
      title,
      version,
      services,
      docs: '/api/doc',
    })
  })

  return { app, db, stores }
}
