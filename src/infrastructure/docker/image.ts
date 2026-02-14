import { DockerClient } from './client'
import type { BuildOptions } from './types'

export class ImageBuilder {
  constructor(private readonly client: DockerClient) {}

  async buildFromDockerfile(
    contextPath: string,
    options: BuildOptions
  ): Promise<string> {
    return await this.client.buildImage(contextPath, options)
  }

  async buildFromInlineDockerfile(
    dockerfile: string,
    contextPath: string,
    tag: string
  ): Promise<string> {
    return await this.client.buildImage(contextPath, {
      tag,
      dockerfile,
    })
  }

  async removeImage(nameOrId: string, force: boolean = false): Promise<void> {
    await this.client.removeImage(nameOrId, force)
  }
}
