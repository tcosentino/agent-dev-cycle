import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { registerResource, createMemoryStore } from '@agentforge/dataobject'
import { brandResource } from './resources/brand.resource'
import { productResource } from './resources/product.resource'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Register resources
const brandStore = createMemoryStore()
registerResource(app, brandResource, brandStore)

const productStore = createMemoryStore()
registerResource(app, productResource, productStore)

// Start server
const port = parseInt(process.env.PORT || '3001')
console.log(`Starting server on port ${port}...`)

serve({
  fetch: app.fetch,
  port,
})

console.log(`Server running at http://localhost:${port}`)
