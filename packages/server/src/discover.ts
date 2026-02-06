import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ResourceDefinition } from '@agentforge/dataobject'
import type { ZodObject, ZodRawShape } from 'zod'
import type { ServiceInfo, IntegrationService, IntegrationModule } from './types'

export type { ServiceInfo, IntegrationService, IntegrationModule }

export interface DataObjectModule {
  serviceInfo: ServiceInfo
  resource: ResourceDefinition<ZodObject<ZodRawShape>>
}

// Discover all *-dataobject services in a directory
export function discoverDataObjectServices(servicesDir: string): ServiceInfo[] {
  const services: ServiceInfo[] = []
  const absoluteDir = resolve(servicesDir)

  if (!existsSync(absoluteDir)) {
    return services
  }

  const entries = readdirSync(absoluteDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (!entry.name.endsWith('-dataobject')) continue

    const servicePath = join(absoluteDir, entry.name)
    const serviceJsonPath = join(servicePath, 'service.json')

    if (!existsSync(serviceJsonPath)) continue

    try {
      const serviceJson = JSON.parse(readFileSync(serviceJsonPath, 'utf-8'))
      services.push({
        name: serviceJson.name || entry.name.replace('-dataobject', ''),
        path: servicePath,
        type: serviceJson.type || 'dataobject',
      })
    } catch {
      // Skip services with invalid service.json
      console.warn(`Warning: Could not parse service.json for ${entry.name}`)
    }
  }

  return services
}

// Dynamically import a dataobject module
export async function loadDataObjectModule(serviceInfo: ServiceInfo): Promise<DataObjectModule | null> {
  const indexPath = join(serviceInfo.path, 'index.ts')

  if (!existsSync(indexPath)) {
    console.warn(`Warning: No index.ts found for ${serviceInfo.name}`)
    return null
  }

  try {
    // Dynamic import of TypeScript file (requires tsx or similar)
    // Use file:// URL for proper module resolution
    const fileUrl = pathToFileURL(indexPath).href
    const module = await import(fileUrl)

    // Find the resource export (named *Resource or just resource)
    const resourceKey = Object.keys(module).find(
      key => key.endsWith('Resource') || key === 'resource'
    )

    if (!resourceKey) {
      console.warn(`Warning: No resource export found in ${serviceInfo.name}`)
      return null
    }

    return {
      serviceInfo,
      resource: module[resourceKey],
    }
  } catch (err) {
    console.error(`Error loading ${serviceInfo.name}:`, err)
    return null
  }
}

// Discover and load all dataobject modules
export async function loadAllDataObjects(servicesDir: string): Promise<DataObjectModule[]> {
  const services = discoverDataObjectServices(servicesDir)
  const modules: DataObjectModule[] = []

  for (const service of services) {
    const module = await loadDataObjectModule(service)
    if (module) {
      modules.push(module)
    }
  }

  return modules
}

// Discover all *-integration services in a directory
export function discoverIntegrationServices(servicesDir: string): ServiceInfo[] {
  const services: ServiceInfo[] = []
  const absoluteDir = resolve(servicesDir)

  if (!existsSync(absoluteDir)) {
    return services
  }

  const entries = readdirSync(absoluteDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (!entry.name.endsWith('-integration')) continue

    const servicePath = join(absoluteDir, entry.name)
    const serviceJsonPath = join(servicePath, 'service.json')

    if (!existsSync(serviceJsonPath)) continue

    try {
      const serviceJson = JSON.parse(readFileSync(serviceJsonPath, 'utf-8'))
      services.push({
        name: serviceJson.name || entry.name.replace('-integration', ''),
        path: servicePath,
        type: serviceJson.type || 'integration',
        version: serviceJson.version,
        description: serviceJson.description,
        entry: serviceJson.entry,
      })
    } catch {
      console.warn(`Warning: Could not parse service.json for ${entry.name}`)
    }
  }

  return services
}

// Dynamically import an integration module
export async function loadIntegrationModule(serviceInfo: ServiceInfo): Promise<IntegrationModule | null> {
  const entryFile = serviceInfo.entry || 'index.ts'
  const indexPath = join(serviceInfo.path, entryFile)

  if (!existsSync(indexPath)) {
    console.warn(`Warning: No ${entryFile} found for ${serviceInfo.name}`)
    return null
  }

  try {
    const fileUrl = pathToFileURL(indexPath).href
    const module = await import(fileUrl)

    // Find the integration export (named *Integration or just integration)
    const integrationKey = Object.keys(module).find(
      key => key.endsWith('Integration') || key === 'integration'
    )

    if (!integrationKey) {
      console.warn(`Warning: No integration export found in ${serviceInfo.name}`)
      return null
    }

    return {
      serviceInfo,
      service: module[integrationKey],
    }
  } catch (err) {
    console.error(`Error loading integration ${serviceInfo.name}:`, err)
    return null
  }
}

// Discover and load all integration modules
export async function loadAllIntegrations(servicesDir: string): Promise<IntegrationModule[]> {
  const services = discoverIntegrationServices(servicesDir)
  const modules: IntegrationModule[] = []

  for (const service of services) {
    const module = await loadIntegrationModule(service)
    if (module) {
      modules.push(module)
    }
  }

  return modules
}
