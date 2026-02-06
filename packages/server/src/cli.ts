#!/usr/bin/env node
import { serve } from '@hono/node-server'
import { resolve } from 'node:path'
import { loadAllDataObjects } from './discover'
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

async function main() {
  console.log(`\nAgentForge Server`)
  console.log(`=================`)
  console.log(`Services dir: ${servicesDir}`)
  console.log(`Storage: ${storage}${storage === 'sqlite' ? ` (${dbPath})` : ''}`)
  console.log()

  // Discover and load all dataobject modules
  const modules = await loadAllDataObjects(servicesDir)

  if (modules.length === 0) {
    console.error('No dataobject services found!')
    console.error(`Looking in: ${servicesDir}`)
    console.error('Make sure your services follow the naming convention: *-dataobject/')
    process.exit(1)
  }

  console.log(`\nFound ${modules.length} dataobject service(s):\n`)

  // Create server
  const { app } = createServer(modules, {
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
