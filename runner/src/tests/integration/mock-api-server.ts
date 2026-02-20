import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface ApiCall {
  timestamp: number
  method: string
  path: string
  query: Record<string, string>
  body: unknown
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString()
      if (!raw) {
        resolve(undefined)
        return
      }
      const contentType = req.headers['content-type'] ?? ''
      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(raw))
        } catch {
          resolve(raw)
        }
      } else {
        resolve(raw)
      }
    })
    req.on('error', reject)
  })
}

export interface MockApiServer {
  url: string
  getCalls(filter?: { method?: string; pathPrefix?: string }): ApiCall[]
  getToolCalls(): string[]
  close(): Promise<void>
}

export async function startMockApiServer(fixtureDataPath?: string): Promise<MockApiServer> {
  const calls: ApiCall[] = []
  let fixtureTasks: unknown[] = []

  // Load fixture tasks if path provided
  if (fixtureDataPath) {
    const content = await readFile(join(fixtureDataPath, 'tasks.json'), 'utf-8')
    fixtureTasks = JSON.parse(content)
  }

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const rawUrl = req.url ?? '/'
    const [pathname, queryStr] = rawUrl.split('?')
    const query: Record<string, string> = {}
    if (queryStr) {
      for (const [k, v] of new URLSearchParams(queryStr)) {
        query[k] = v
      }
    }

    const body = await parseBody(req)
    const method = (req.method ?? 'GET').toUpperCase()

    const call: ApiCall = {
      timestamp: Date.now(),
      method,
      path: pathname,
      query,
      body,
    }
    calls.push(call)

    // Route handling
    res.setHeader('Content-Type', 'application/json')

    // Tasks endpoints
    if (method === 'GET' && pathname === '/api/tasks') {
      res.writeHead(200)
      res.end(JSON.stringify(fixtureTasks))
      return
    }

    if (method === 'POST' && pathname === '/api/tasks') {
      const created = { id: `task-${Date.now()}`, key: 'AF-NEW', ...(body as object) }
      res.writeHead(201)
      res.end(JSON.stringify(created))
      return
    }

    if (method === 'PATCH' && pathname.startsWith('/api/tasks/')) {
      const taskId = pathname.split('/').pop()
      const updated = { id: taskId, ...(body as object) }
      res.writeHead(200)
      res.end(JSON.stringify(updated))
      return
    }

    if (method === 'DELETE' && pathname.startsWith('/api/tasks/')) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // Task comments
    if (method === 'GET' && pathname === '/api/taskComments') {
      res.writeHead(200)
      res.end(JSON.stringify([]))
      return
    }

    if (method === 'POST' && pathname === '/api/taskComments') {
      const created = { id: `comment-${Date.now()}`, ...(body as object) }
      res.writeHead(201)
      res.end(JSON.stringify(created))
      return
    }

    if (method === 'DELETE' && pathname.startsWith('/api/taskComments/')) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // Project messages (chat)
    if (method === 'POST' && pathname.match(/^\/api\/projects\/[^/]+\/messages$/)) {
      const created = { id: `msg-${Date.now()}`, ...(body as object) }
      res.writeHead(200)
      res.end(JSON.stringify(created))
      return
    }

    // Agent status
    if (method === 'PATCH' && pathname.match(/^\/api\/projects\/[^/]+\/agent-status$/)) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // Agent session progress (runner reports)
    if (method === 'PATCH' && pathname.match(/^\/api\/agentSessions\/[^/]+\/progress$/)) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // Agent session logs
    if (method === 'POST' && pathname.match(/^\/api\/agentSessions\/[^/]+\/logs$/)) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // Agent session stage completion
    if (method === 'POST' && pathname.match(/^\/api\/agentSessions\/[^/]+\/stages\/[^/]+\/complete$/)) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // Resource metrics
    if (method === 'POST' && pathname.match(/^\/api\/agentSessions\/[^/]+\/resourceMetrics$/)) {
      res.writeHead(200)
      res.end(JSON.stringify({}))
      return
    }

    // 404 for unhandled routes
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not Found', path: pathname, method }))
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  const { port } = server.address() as AddressInfo
  const url = `http://127.0.0.1:${port}`

  return {
    url,
    getCalls(filter?: { method?: string; pathPrefix?: string }) {
      if (!filter) return [...calls]
      return calls.filter(call => {
        if (filter.method && call.method !== filter.method) return false
        if (filter.pathPrefix && !call.path.startsWith(filter.pathPrefix)) return false
        return true
      })
    },
    getToolCalls() {
      // Extract CLI commands from log messages
      const logCalls = calls.filter(c => c.method === 'POST' && c.path.includes('/logs'))
      const toolCalls: string[] = []

      for (const call of logCalls) {
        const msg = (call.body as { message?: string })?.message ?? ''
        // Look for "Running: agentforge ..." in log messages
        const match = msg.match(/(?:Running|Executing):\s*agentforge\s+(.+)/)
        if (match) {
          toolCalls.push(`agentforge ${match[1]}`)
        }
      }

      return toolCalls
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()))
      })
    },
  }
}
