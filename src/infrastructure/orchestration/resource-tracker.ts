import type { TrackedResource } from './types'

export class ResourceTracker {
  private resources: Map<string, TrackedResource> = new Map()

  track(resourceId: string, resource: TrackedResource): void {
    this.resources.set(resourceId, resource)
  }

  untrack(resourceId: string): void {
    this.resources.delete(resourceId)
  }

  get(resourceId: string): TrackedResource | undefined {
    return this.resources.get(resourceId)
  }

  getAll(): Map<string, TrackedResource> {
    return new Map(this.resources)
  }

  getAllByType(type: TrackedResource['type']): TrackedResource[] {
    return Array.from(this.resources.values()).filter(r => r.type === type)
  }

  clear(): void {
    this.resources.clear()
  }
}
