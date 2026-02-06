import type { OpenAPIHono } from '@hono/zod-openapi'
import type { ResourceStore } from '@agentforge/dataobject'

export interface ServiceInfo {
  name: string
  type: string
  version?: string
  description?: string
  entry?: string
  path: string
}

export interface IntegrationService {
  name: string
  version: string
  register(app: OpenAPIHono, ctx: IntegrationContext): void | Promise<void>
}

export interface IntegrationContext {
  stores: Map<string, ResourceStore<Record<string, unknown>>>
}

export interface IntegrationModule {
  service: IntegrationService
  serviceInfo: ServiceInfo
}
