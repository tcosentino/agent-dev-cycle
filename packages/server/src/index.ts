// @agentforge/server - Dataobject service harness
// Discovers and serves all *-dataobject services as a unified API

export { discoverDataObjectServices, loadDataObjectModule, loadAllDataObjects } from './discover'
export type { ServiceInfo, DataObjectModule } from './discover'

export { createServer } from './server'
export type { ServerOptions, ServerInstance } from './server'
