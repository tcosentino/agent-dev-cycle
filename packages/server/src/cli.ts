#!/usr/bin/env node
import { config } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env from project root (3 levels up from packages/server/src/cli.ts)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '..', '..', '.env')
const result = config({ path: envPath })
if (result.error) {
  console.warn('Note: No .env file found at', envPath)
}

import { spawn } from 'node:child_process'
import { serve } from '@hono/node-server'
import { loadAllDataObjects, loadAllIntegrations } from './discover'
import { createServer } from './server'

// Parse CLI arguments
const args = process.argv.slice(2)
const flags: Record<string, string> = {}

for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg.startsWith('--')) {
    const key = arg.slice(2)
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true'
    flags[key] = value
  }
}

const servicesDir = flags.services || flags.s || resolve(process.cwd(), 'src/services')
const port = parseInt(flags.port || flags.p || '3000', 10)
const storage = (flags.storage || 'memory') as 'memory' | 'sqlite'
const dbPath = flags.db || ':memory:'
const title = flags.title || 'AgentForge API'

// Build the runner Docker image so it's ready for agent sessions
async function buildRunnerImage(): Promise<void> {
  const runnerDir = resolve(__dirname, '..', '..', '..', 'runner')
  const imageName = 'agentforge-runner:latest'

  console.log(`Building runner image (${imageName})...`)

  return new Promise((resolve, reject) => {
    const proc = spawn('docker', ['build', '-t', imageName, runnerDir], {
      stdio: ['ignore', 'inherit', 'inherit'],
    })

    proc.on('error', (err) => {
      reject(new Error(`docker build failed: ${err.message}`))
    })

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`Runner image built successfully\n`)
        resolve()
      } else {
        reject(new Error(`docker build exited with code ${code}`))
      }
    })
  })
}

async function main() {
  console.log(`\nAgentForge Server`)
  console.log(`=================`)
  console.log(`Services dir: ${servicesDir}`)
  console.log(`Storage: ${storage}${storage === 'sqlite' ? ` (${dbPath})` : ''}`)
  console.log()

  // Build runner Docker image at startup (skip in local runner mode)
  if (process.env.RUNNER_MODE !== 'local') {
    try {
      await buildRunnerImage()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`Warning: Could not build runner image: ${msg}`)
      console.warn('Agent sessions may fail if the image is missing or outdated\n')
    }
  }

  // Discover and load all dataobject modules
  const modules = await loadAllDataObjects(servicesDir)

  if (modules.length === 0) {
    console.error('No dataobject services found!')
    console.error(`Looking in: ${servicesDir}`)
    console.error('Make sure your services follow the naming convention: *-dataobject/')
    process.exit(1)
  }

  console.log(`Found ${modules.length} dataobject service(s)`)

  // Discover and load all integration modules
  const integrations = await loadAllIntegrations(servicesDir)
  if (integrations.length > 0) {
    console.log(`Found ${integrations.length} integration service(s)`)
  }

  console.log()

  // Create server
  const { app } = createServer(modules, integrations, {
    title,
    storage,
    dbPath,
    port,
  })

  // Start server
  console.log(`\nStarting server on http://localhost:${port}`)
  console.log(`API docs: http://localhost:${port}/api/doc\n`)

  serve({
    fetch: app.fetch,
    port,
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
