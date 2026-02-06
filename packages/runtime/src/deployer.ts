import Docker from 'dockerode'
import type {
  Workload,
  WorkloadStage,
  WorkloadTarget,
  WorkloadArtifacts,
  WorkloadEvent,
  ModuleDefinition,
  StageResult,
  TestDefinition,
  HttpTestConfig,
} from './types'
import { getModuleTypeHandler } from './module-types'

export interface DeployerOptions {
  docker?: Docker
  onEvent?: (event: WorkloadEvent) => void
}

const STAGES: WorkloadStage[] = ['validate', 'build', 'deploy', 'healthcheck', 'test', 'complete']

export class Deployer {
  private docker: Docker
  private onEvent: (event: WorkloadEvent) => void

  constructor(options: DeployerOptions = {}) {
    this.docker = options.docker || new Docker()
    this.onEvent = options.onEvent || (() => {})
  }

  async deployWorkload(
    module: ModuleDefinition,
    target: WorkloadTarget,
    deploymentId: string
  ): Promise<Workload> {
    const workloadId = crypto.randomUUID()
    const now = new Date().toISOString()

    const workload: Workload = {
      id: workloadId,
      deploymentId,
      moduleId: module.id,
      moduleName: module.name,
      moduleType: module.type,
      status: 'running',
      currentStage: 'pending',
      stages: [],
      target,
      createdAt: now,
      updatedAt: now,
    }

    const handler = getModuleTypeHandler(module.type)
    if (!handler) {
      return this.failWorkload(workload, 'validate', `Unknown module type: ${module.type}`)
    }

    try {
      // Run through each stage
      for (const stage of STAGES) {
        workload.currentStage = stage
        this.emit({ type: 'stage-start', workloadId, stage })

        const result = await this.runStage(stage, module, target, workload, handler)
        workload.stages.push(result)
        workload.updatedAt = new Date().toISOString()

        this.emit({ type: 'stage-complete', workloadId, stage, result })

        if (result.status === 'failed') {
          return this.failWorkload(workload, stage, result.error || 'Stage failed')
        }
      }

      // Success!
      workload.status = 'success'
      workload.completedAt = new Date().toISOString()
      this.emit({ type: 'workload-complete', workloadId, status: 'success' })
      return workload

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.failWorkload(workload, workload.currentStage, errorMessage)
    }
  }

  private async runStage(
    stage: WorkloadStage,
    module: ModuleDefinition,
    target: WorkloadTarget,
    workload: Workload,
    handler: ReturnType<typeof getModuleTypeHandler>
  ): Promise<StageResult> {
    const startedAt = new Date()
    const logs: string[] = []
    const log = (msg: string) => {
      logs.push(msg)
      this.emit({ type: 'log', workloadId: workload.id, stage, message: msg })
    }

    try {
      switch (stage) {
        case 'validate':
          return await this.runValidate(module, handler!, log, startedAt)

        case 'build':
          return await this.runBuild(module, workload, log, startedAt)

        case 'deploy':
          return await this.runDeploy(module, target, workload, log, startedAt)

        case 'healthcheck':
          return await this.runHealthcheck(module, workload, log, startedAt)

        case 'test':
          return await this.runTests(module, workload, handler!, log, startedAt)

        case 'complete':
          log('Workload deployment complete')
          return this.successResult(stage, logs, startedAt)

        default:
          return this.successResult(stage, logs, startedAt)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      log(`Error: ${errorMessage}`)
      return this.failedResult(stage, logs, errorMessage, startedAt)
    }
  }

  private async runValidate(
    module: ModuleDefinition,
    handler: NonNullable<ReturnType<typeof getModuleTypeHandler>>,
    log: (msg: string) => void,
    startedAt: Date
  ): Promise<StageResult> {
    log(`Validating ${module.type} module: ${module.name}`)

    const result = await handler.validate(module)

    for (const warning of result.warnings) {
      log(`Warning: ${warning}`)
    }

    if (!result.valid) {
      for (const error of result.errors) {
        log(`Error: ${error}`)
      }
      return this.failedResult('validate', [], result.errors.join('; '), startedAt)
    }

    log('Validation passed')
    return this.successResult('validate', [], startedAt)
  }

  private async runBuild(
    module: ModuleDefinition,
    workload: Workload,
    log: (msg: string) => void,
    startedAt: Date
  ): Promise<StageResult> {
    const imageName = `${module.name}:${module.version}`
    log(`Building Docker image: ${imageName}`)

    // For now, assume image is already built (we'll enhance this later)
    workload.artifacts = {
      ...workload.artifacts,
      imageName,
    }
    this.emit({ type: 'artifact', workloadId: workload.id, key: 'imageName', value: imageName })

    log(`Image ready: ${imageName}`)
    return this.successResult('build', [], startedAt)
  }

  private async runDeploy(
    module: ModuleDefinition,
    target: WorkloadTarget,
    workload: Workload,
    log: (msg: string) => void,
    startedAt: Date
  ): Promise<StageResult> {
    if (target.type !== 'docker-local') {
      return this.failedResult('deploy', [], `Unsupported target type: ${target.type}`, startedAt)
    }

    const containerName = `${module.name}-${workload.id.slice(0, 8)}`
    const port = module.runtime.port || 3000
    const hostPort = (target.config.hostPort as number) || port

    log(`Creating container: ${containerName}`)
    log(`Port mapping: ${hostPort}:${port}`)

    try {
      // Remove existing container if any
      try {
        const existing = this.docker.getContainer(containerName)
        await existing.stop().catch(() => {})
        await existing.remove().catch(() => {})
        log(`Removed existing container: ${containerName}`)
      } catch {
        // Container doesn't exist, that's fine
      }

      // Create and start container
      const container = await this.docker.createContainer({
        Image: workload.artifacts?.imageName,
        name: containerName,
        Env: Object.entries(module.runtime.env || {}).map(([k, v]) => `${k}=${v}`),
        ExposedPorts: { [`${port}/tcp`]: {} },
        HostConfig: {
          PortBindings: {
            [`${port}/tcp`]: [{ HostPort: String(hostPort) }],
          },
        },
      })

      await container.start()

      const containerInfo = await container.inspect()
      workload.artifacts = {
        ...workload.artifacts,
        containerId: containerInfo.Id,
        containerName,
        port: hostPort,
        url: `http://localhost:${hostPort}`,
      }

      this.emit({ type: 'artifact', workloadId: workload.id, key: 'containerId', value: containerInfo.Id })
      this.emit({ type: 'artifact', workloadId: workload.id, key: 'url', value: `http://localhost:${hostPort}` })

      log(`Container started: ${containerName}`)
      return this.successResult('deploy', [], startedAt)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.failedResult('deploy', [], errorMessage, startedAt)
    }
  }

  private async runHealthcheck(
    module: ModuleDefinition,
    workload: Workload,
    log: (msg: string) => void,
    startedAt: Date
  ): Promise<StageResult> {
    const healthcheck = module.runtime.healthcheck || {
      path: '/health',
      interval: 1000,
      timeout: 5000,
      retries: 10,
    }

    const url = `${workload.artifacts?.url}${healthcheck.path}`
    log(`Running healthcheck: ${url}`)

    for (let attempt = 1; attempt <= healthcheck.retries; attempt++) {
      log(`Attempt ${attempt}/${healthcheck.retries}`)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), healthcheck.timeout)

        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (response.ok) {
          log(`Healthcheck passed (status ${response.status})`)
          return this.successResult('healthcheck', [], startedAt)
        }

        log(`Healthcheck returned status ${response.status}`)
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        log(`Healthcheck failed: ${msg}`)
      }

      if (attempt < healthcheck.retries) {
        await this.sleep(healthcheck.interval)
      }
    }

    return this.failedResult('healthcheck', [], 'Healthcheck failed after all retries', startedAt)
  }

  private async runTests(
    module: ModuleDefinition,
    workload: Workload,
    handler: NonNullable<ReturnType<typeof getModuleTypeHandler>>,
    log: (msg: string) => void,
    startedAt: Date
  ): Promise<StageResult> {
    const tests = handler.getTests(module, workload.artifacts || {})
    log(`Running ${tests.length} tests`)

    const failures: string[] = []

    for (const test of tests) {
      this.emit({ type: 'test-start', workloadId: workload.id, test: test.name })
      log(`Running test: ${test.name}`)

      try {
        const passed = await this.runTest(test)

        if (passed) {
          log(`  PASS: ${test.name}`)
          this.emit({ type: 'test-complete', workloadId: workload.id, test: test.name, passed: true })
        } else {
          log(`  FAIL: ${test.name}`)
          failures.push(test.name)
          this.emit({ type: 'test-complete', workloadId: workload.id, test: test.name, passed: false })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        log(`  FAIL: ${test.name} - ${errorMessage}`)
        failures.push(`${test.name}: ${errorMessage}`)
        this.emit({ type: 'test-complete', workloadId: workload.id, test: test.name, passed: false, error: errorMessage })
      }
    }

    if (failures.length > 0) {
      return this.failedResult('test', [], `${failures.length} test(s) failed: ${failures.join(', ')}`, startedAt)
    }

    log(`All ${tests.length} tests passed`)
    return this.successResult('test', [], startedAt)
  }

  private async runTest(test: TestDefinition): Promise<boolean> {
    if (test.type === 'http') {
      return this.runHttpTest(test.config as HttpTestConfig)
    }
    return false
  }

  private async runHttpTest(config: HttpTestConfig): Promise<boolean> {
    const response = await fetch(config.path, {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    })

    if (config.expect.status && response.status !== config.expect.status) {
      return false
    }

    if (config.expect.bodyContains) {
      const body = await response.text()
      if (!body.includes(config.expect.bodyContains)) {
        return false
      }
    }

    return true
  }

  private emit(event: WorkloadEvent) {
    this.onEvent(event)
  }

  private failWorkload(workload: Workload, stage: WorkloadStage, error: string): Workload {
    workload.status = 'failed'
    workload.completedAt = new Date().toISOString()
    this.emit({ type: 'workload-complete', workloadId: workload.id, status: 'failed' })
    return workload
  }

  private successResult(stage: WorkloadStage, logs: string[], startedAt: Date): StageResult {
    return {
      stage,
      status: 'success',
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startedAt.getTime(),
      logs,
    }
  }

  private failedResult(stage: WorkloadStage, logs: string[], error: string, startedAt: Date): StageResult {
    return {
      stage,
      status: 'failed',
      startedAt: startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      duration: Date.now() - startedAt.getTime(),
      logs,
      error,
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
