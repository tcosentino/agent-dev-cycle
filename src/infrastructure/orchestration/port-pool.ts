import type { PortPoolConfig } from './types'

export class PortPool {
  private availablePorts: Set<number>
  private assignedPorts: Set<number>

  constructor(config: PortPoolConfig) {
    this.availablePorts = new Set()
    this.assignedPorts = new Set()

    for (let port = config.min; port <= config.max; port++) {
      if (!config.reserved?.includes(port)) {
        this.availablePorts.add(port)
      }
    }
  }

  assign(): number | null {
    const port = this.availablePorts.values().next().value
    if (port === undefined) {
      return null
    }

    this.availablePorts.delete(port)
    this.assignedPorts.add(port)
    return port
  }

  release(port: number): void {
    if (this.assignedPorts.has(port)) {
      this.assignedPorts.delete(port)
      this.availablePorts.add(port)
    }
  }

  isAvailable(port: number): boolean {
    return this.availablePorts.has(port)
  }

  isAssigned(port: number): boolean {
    return this.assignedPorts.has(port)
  }

  getAvailableCount(): number {
    return this.availablePorts.size
  }

  getAssignedCount(): number {
    return this.assignedPorts.size
  }
}
