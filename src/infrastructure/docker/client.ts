import Docker from 'dockerode'
import type { ContainerConfig, ContainerInfo, ContainerState, BuildOptions } from './types'

export class DockerClient {
  private docker: Docker

  constructor(options?: Docker.DockerOptions) {
    this.docker = new Docker(options)
  }

  async createContainer(config: ContainerConfig): Promise<string> {
    try {
      const portBindings: Record<string, Array<{ HostPort: string }>> = {}
      const exposedPorts: Record<string, object> = {}

      if (config.ports) {
        for (const port of config.ports) {
          const key = `${port.container}/tcp`
          exposedPorts[key] = {}
          portBindings[key] = [{ HostPort: port.host.toString() }]
        }
      }

      const binds = config.volumes?.map(v => {
        const mode = v.readOnly ? 'ro' : 'rw'
        return `${v.host}:${v.container}:${mode}`
      })

      const container = await this.docker.createContainer({
        name: config.name,
        Image: config.image,
        Env: config.env ? Object.entries(config.env).map(([k, v]) => `${k}=${v}`) : undefined,
        ExposedPorts: Object.keys(exposedPorts).length > 0 ? exposedPorts : undefined,
        HostConfig: {
          PortBindings: Object.keys(portBindings).length > 0 ? portBindings : undefined,
          Binds: binds,
          NetworkMode: config.networkMode,
        },
        WorkingDir: config.workDir,
        Cmd: config.cmd,
        Entrypoint: config.entrypoint,
        Labels: config.labels,
      })

      return container.id
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to create container: ${message}`)
    }
  }

  async startContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id)
      await container.start()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to start container ${id}: ${message}`)
    }
  }

  async stopContainer(id: string, timeout: number = 10): Promise<void> {
    try {
      const container = this.docker.getContainer(id)
      await container.stop({ t: timeout })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to stop container ${id}: ${message}`)
    }
  }

  async killContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id)
      await container.kill()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to kill container ${id}: ${message}`)
    }
  }

  async removeContainer(id: string, force: boolean = false): Promise<void> {
    try {
      const container = this.docker.getContainer(id)
      await container.remove({ force })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to remove container ${id}: ${message}`)
    }
  }

  async inspectContainer(id: string): Promise<ContainerInfo> {
    try {
      const container = this.docker.getContainer(id)
      const data = await container.inspect()

      const ports: Array<{ internal: number; external: number }> = []
      if (data.NetworkSettings?.Ports) {
        for (const [containerPort, hostPorts] of Object.entries(data.NetworkSettings.Ports)) {
          if (hostPorts && Array.isArray(hostPorts)) {
            const internal = parseInt(containerPort.split('/')[0])
            for (const hp of hostPorts) {
              if (hp.HostPort) {
                ports.push({ internal, external: parseInt(hp.HostPort) })
              }
            }
          }
        }
      }

      return {
        id: data.Id,
        name: data.Name.startsWith('/') ? data.Name.slice(1) : data.Name,
        state: {
          running: data.State.Running,
          paused: data.State.Paused,
          restarting: data.State.Restarting,
          dead: data.State.Dead,
          exitCode: data.State.ExitCode,
          error: data.State.Error || undefined,
        },
        image: data.Image,
        ports,
        exitCode: data.State.ExitCode,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to inspect container ${id}: ${message}`)
    }
  }

  async getContainerLogs(id: string): Promise<string> {
    try {
      const container = this.docker.getContainer(id)
      const stream = await container.logs({
        stdout: true,
        stderr: true,
        timestamps: false,
      })
      return stream.toString()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get logs for container ${id}: ${message}`)
    }
  }

  async streamContainerLogs(
    id: string,
    onLog: (log: string) => void | Promise<void>,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      const container = this.docker.getContainer(id)
      const logStream = await container.logs({
        stdout: true,
        stderr: true,
        follow: true,
        timestamps: false,
      })

      // Docker multiplexes stdout/stderr in a special format
      // Each frame has an 8-byte header: [stream_type, 0, 0, 0, size1, size2, size3, size4]
      let buffer = Buffer.alloc(0)

      const processChunk = async (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk])

        while (buffer.length >= 8) {
          const header = buffer.slice(0, 8)
          const payloadSize = header.readUInt32BE(4)

          if (buffer.length < 8 + payloadSize) {
            break // Wait for more data
          }

          const payload = buffer.slice(8, 8 + payloadSize)
          buffer = buffer.slice(8 + payloadSize)

          const logLine = payload.toString('utf-8').trim()
          if (logLine) {
            await onLog(logLine)
          }
        }
      }

      logStream.on('data', (chunk) => {
        processChunk(chunk).catch(err => {
          console.error('[DockerClient] Error processing log chunk:', err)
        })
      })

      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          logStream.destroy()
        })
      }

      // Wait for stream to end
      await new Promise<void>((resolve, reject) => {
        logStream.on('end', resolve)
        logStream.on('error', reject)
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('aborted')) {
        return // Normal abort
      }
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to stream logs for container ${id}: ${message}`)
    }
  }

  async buildImage(context: string, options: BuildOptions): Promise<string> {
    try {
      const stream = await this.docker.buildImage(
        {
          context,
          src: ['.'],
        },
        {
          t: options.tag,
          dockerfile: options.dockerfile || 'Dockerfile',
          buildargs: options.buildArgs,
        }
      )

      return new Promise<string>((resolve, reject) => {
        let imageId: string | undefined

        this.docker.modem.followProgress(
          stream,
          (err, res) => {
            if (err) {
              reject(new Error(`Build failed: ${err.message}`))
              return
            }

            if (!imageId && res) {
              const lastItem = res[res.length - 1]
              if (lastItem?.aux?.ID) {
                imageId = lastItem.aux.ID
              }
            }

            resolve(imageId || options.tag)
          },
          (event) => {
            if (event.stream && options.onProgress) {
              options.onProgress(event.stream.trim())
            }
          }
        )
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to build image: ${message}`)
    }
  }

  async pullImage(name: string): Promise<void> {
    try {
      const stream = await this.docker.pull(name)
      return new Promise<void>((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err) => {
          if (err) {
            reject(new Error(`Pull failed: ${err.message}`))
          } else {
            resolve()
          }
        })
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to pull image ${name}: ${message}`)
    }
  }

  async removeImage(name: string, force: boolean = false): Promise<void> {
    try {
      const image = this.docker.getImage(name)
      await image.remove({ force })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to remove image ${name}: ${message}`)
    }
  }

  async monitorContainer(
    id: string,
    callback: (state: ContainerState) => void | Promise<void>
  ): Promise<() => void> {
    let stopped = false
    const interval = setInterval(async () => {
      if (stopped) return

      try {
        const info = await this.inspectContainer(id)
        await callback(info.state)

        if (!info.state.running) {
          stopped = true
          clearInterval(interval)
        }
      } catch (error) {
        stopped = true
        clearInterval(interval)
        await callback({
          running: false,
          paused: false,
          restarting: false,
          dead: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }, 5000)

    return () => {
      stopped = true
      clearInterval(interval)
    }
  }
}
