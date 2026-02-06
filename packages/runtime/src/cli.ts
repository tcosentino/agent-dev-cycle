#!/usr/bin/env node

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Deployer } from './deployer'
import type { ModuleDefinition, WorkloadEvent } from './types'

// Import to auto-register handlers
import './index'

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: deploy <module.json> [--port <port>]')
    process.exit(1)
  }

  const modulePath = resolve(args[0])
  const module: ModuleDefinition = JSON.parse(readFileSync(modulePath, 'utf-8'))

  // Parse optional port override
  const portIndex = args.indexOf('--port')
  const hostPort = portIndex >= 0 ? parseInt(args[portIndex + 1]) : module.runtime.port

  // Generate a deployment ID for this run
  const deploymentId = crypto.randomUUID()

  console.log('\n========================================')
  console.log(`  Deploying workload: ${module.name} v${module.version}`)
  console.log(`  Type: ${module.type}`)
  console.log(`  Port: ${hostPort}`)
  console.log(`  Deployment: ${deploymentId.slice(0, 8)}`)
  console.log('========================================\n')

  const deployer = new Deployer({
    onEvent: (event: WorkloadEvent) => {
      switch (event.type) {
        case 'stage-start':
          console.log(`\n[${event.stage.toUpperCase()}] Starting...`)
          break
        case 'log':
          console.log(`  ${event.message}`)
          break
        case 'stage-complete':
          const icon = event.result.status === 'success' ? 'OK' : 'FAIL'
          const duration = event.result.duration ? ` (${event.result.duration}ms)` : ''
          console.log(`[${event.stage.toUpperCase()}] ${icon}${duration}`)
          if (event.result.error) {
            console.log(`  Error: ${event.result.error}`)
          }
          break
        case 'test-start':
          console.log(`  Running: ${event.test}`)
          break
        case 'test-complete':
          const testIcon = event.passed ? 'PASS' : 'FAIL'
          console.log(`    ${testIcon}: ${event.test}`)
          break
        case 'workload-complete':
          console.log(`\n========================================`)
          console.log(`  Workload ${event.status.toUpperCase()}`)
          console.log('========================================\n')
          break
      }
    },
  })

  const workload = await deployer.deployWorkload(
    module,
    {
      type: 'docker-local',
      config: { hostPort },
    },
    deploymentId
  )

  if (workload.status === 'success') {
    console.log('Workload artifacts:')
    console.log(`  Container: ${workload.artifacts?.containerName}`)
    console.log(`  URL: ${workload.artifacts?.url}`)
    console.log('\nTo stop:')
    console.log(`  docker stop ${workload.artifacts?.containerName}`)
    process.exit(0)
  } else {
    console.error('Workload deployment failed')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
