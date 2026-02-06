// @agentforge/server - Dataobject service harness
// Discovers and serves all *-dataobject services as a unified API

export {
  discoverDataObjectServices,
  loadDataObjectModule,
  loadAllDataObjects,
  discoverIntegrationServices,
  loadIntegrationModule,
  loadAllIntegrations,
} from './discover'
export type { ServiceInfo, DataObjectModule, IntegrationModule, IntegrationService } from './discover'
export type { IntegrationContext } from './types'

export { createServer } from './server'
export type { ServerOptions, ServerInstance } from './server'

// Test utilities
export { createTestServer, createTestContext } from './test-utils'
export type { TestServerOptions, TestServerInstance } from './test-utils'

// Logging
export { createLogger, logger } from './logger'
export type { Logger, LoggerOptions, LogLevel } from './logger'
