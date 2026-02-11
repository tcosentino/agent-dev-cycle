export interface DockerfileConfig {
  baseImage: string
  workdir?: string
  copyFiles?: Array<{ src: string; dest: string }>
  runCommands?: string[]
  env?: Record<string, string>
  expose?: number[]
  cmd?: string[]
  entrypoint?: string[]
}

export interface NodeServiceConfig {
  baseImage?: string
  workdir?: string
  port?: number
  entryFile: string
}

export interface ExpressServiceConfig {
  workloadId: string
  entryFile: string
  port: number
  resourcePath: string
}
