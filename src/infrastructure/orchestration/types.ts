export interface PortPoolConfig {
  min: number
  max: number
  reserved?: number[]
}

export interface TrackedResource {
  id: string
  type: 'container' | 'image' | 'volume' | 'network'
  containerId?: string
  imageId?: string
  port?: number
  workDir?: string
  metadata: Record<string, unknown>
}
