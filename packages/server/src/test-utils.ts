// Test utilities for @agentforge/server
// Provides easy setup for testing dataobject services

import {
  createOpenApiApp,
  registerOpenApiResource,
  createMemoryStore,
  pluralize,
  type ResourceStore,
  type ResourceDefinition,
} from '@agentforge/dataobject'
import type { ZodObject, ZodRawShape } from 'zod'

export interface TestServerOptions {
  title?: string
}

export interface TestServerInstance {
  app: ReturnType<typeof createOpenApiApp>
  stores: Map<string, ResourceStore<Record<string, unknown>>>
  reset: () => Promise<void>
  seed: (resourceName: string, data: Record<string, unknown>) => Promise<void>
}

// Create a test server from dataobject definitions
export function createTestServer(
  resources: ResourceDefinition<ZodObject<ZodRawShape>>[],
  options: TestServerOptions = {}
): TestServerInstance {
  const { title = 'Test API' } = options

  // Create OpenAPI app
  const app = createOpenApiApp({ title })

  // Create memory stores for each resource
  const stores = new Map<string, ResourceStore<Record<string, unknown>>>()

  for (const resource of resources) {
    const store = createMemoryStore<Record<string, unknown>>()
    stores.set(resource.name, store)

    const pluralName = resource.plural ?? pluralize(resource.name)
    registerOpenApiResource(app, resource, store, {
      basePath: `/api/${pluralName}`,
    })
  }

  // Reset function to clear all stores
  const reset = async () => {
    for (const store of stores.values()) {
      if (store.clear) {
        await store.clear()
      }
    }
  }

  // Seed function to add data to a store (bypasses normal create to preserve ids)
  const seed = async (resourceName: string, data: Record<string, unknown>) => {
    const store = stores.get(resourceName)
    if (!store) {
      throw new Error(`Unknown resource: ${resourceName}`)
    }
    // If data has an id, we need to create it with that id
    // For memory store, we can use internal knowledge that it's a map
    // For now, create normally and accept the generated id
    // The test data shouldn't rely on specific ids for prerequisites
    await store.create(data as Omit<Record<string, unknown>, 'id' | 'createdAt' | 'updatedAt'>)
  }

  return { app, stores, reset, seed }
}

// Create a test context for use with createResourceTests
export function createTestContext(
  server: TestServerInstance,
  baseUrl = 'http://localhost'
) {
  return {
    baseUrl,
    request: (url: string, init?: RequestInit) => server.app.request(url, init),
    reset: server.reset,
    seed: server.seed,
  }
}
