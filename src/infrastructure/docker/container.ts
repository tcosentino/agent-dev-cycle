import { DockerClient } from './client'
import type { ContainerConfig, HealthcheckConfig } from './types'

export class ContainerLifecycle {
  constructor(private readonly client: DockerClient) {}

  async create(config: ContainerConfig): Promise<string> {
    return await this.client.createContainer(config)
  }

  async start(containerId: string): Promise<void> {
    await this.client.startContainer(containerId)
  }

  async stop(containerId: string, graceful: boolean = true): Promise<void> {
    if (graceful) {
      try {
        await this.client.stopContainer(containerId, 10)
      } catch (error) {
        await this.client.killContainer(containerId)
      }
    } else {
      await this.client.killContainer(containerId)
    }
  }

  async restart(containerId: string): Promise<void> {
    await this.stop(containerId, true)
    await this.start(containerId)
  }

  async cleanup(containerId: string): Promise<void> {
    try {
      await this.client.stopContainer(containerId, 5)
    } catch (error) {
      // Container may already be stopped
    }

    try {
      await this.client.removeContainer(containerId, true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to cleanup container ${containerId}: ${message}`)
    }
  }

  async waitForReady(
    containerId: string,
    healthcheck?: HealthcheckConfig
  ): Promise<void> {
    const interval = healthcheck?.interval || 1000
    const timeout = healthcheck?.timeout || 30000
    const retries = healthcheck?.retries || 30

    let attempts = 0
    const startTime = Date.now()

    while (attempts < retries) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Container ${containerId} did not become ready within timeout`)
      }

      try {
        const info = await this.client.inspectContainer(containerId)
        if (info.state.running) {
          // If a health check path is provided, we could check it here
          // For now, just verify the container is running
          return
        }

        if (info.state.dead || (info.state.exitCode !== undefined && info.state.exitCode !== 0)) {
          throw new Error(
            `Container ${containerId} died with exit code ${info.state.exitCode}`
          )
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('died')) {
          throw error
        }
        // Continue checking
      }

      await new Promise(resolve => setTimeout(resolve, interval))
      attempts++
    }

    throw new Error(`Container ${containerId} did not become ready after ${retries} attempts`)
  }
}
