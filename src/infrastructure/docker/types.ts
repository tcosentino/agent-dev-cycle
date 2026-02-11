export interface ContainerConfig {
  name: string
  image: string
  env?: Record<string, string>
  ports?: Array<{ container: number; host: number }>
  volumes?: Array<{ host: string; container: string; readOnly?: boolean }>
  workDir?: string
  cmd?: string[]
  entrypoint?: string[]
  labels?: Record<string, string>
  networkMode?: string
}

export interface ContainerInfo {
  id: string
  name: string
  state: ContainerState
  image: string
  ports: Array<{ internal: number; external: number }>
  exitCode?: number
}

export interface ContainerState {
  running: boolean
  paused: boolean
  restarting: boolean
  dead: boolean
  exitCode?: number
  error?: string
}

export interface BuildOptions {
  tag: string
  dockerfile?: string
  buildArgs?: Record<string, string>
  onProgress?: (message: string) => void
}

export interface HealthcheckConfig {
  path?: string
  interval?: number
  timeout?: number
  retries?: number
}
