import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface RecordedRequest {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
  headers: Record<string, string>
}

interface RouteEntry {
  method: string
  pattern: RegExp
  paramNames: string[]
  status: number
  body: unknown
}

function compilePattern(path: string): { pattern: RegExp; paramNames: string[] } {
  const paramNames: string[] = []
  const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const patternStr = escaped.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name)
    return '([^/]+)'
  })
  return { pattern: new RegExp(`^${patternStr}$`), paramNames }
}

function readBody(req: IncomingMessage): Promise<unknown> {
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

export interface MockServer {
  url: string
  calls: RecordedRequest[]
  setRoute(method: string, path: string, status: number, body: unknown): void
  clearCalls(): void
  close(): Promise<void>
}

export async function startMockServer(): Promise<MockServer> {
  const routes: RouteEntry[] = []
  const calls: RecordedRequest[] = []

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const rawUrl = req.url ?? '/'
    const [pathname, queryStr] = rawUrl.split('?')
    const query: Record<string, string> = {}
    if (queryStr) {
      for (const [k, v] of new URLSearchParams(queryStr)) {
        query[k] = v
      }
    }

    const headers: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers[k] = v
    }

    const body = await readBody(req)
    const method = (req.method ?? 'GET').toUpperCase()

    const recorded: RecordedRequest = { method, path: pathname, query, body, headers }
    calls.push(recorded)

    // Find matching route (first match wins; routes are prepended so latest takes priority)
    const matched = routes.find(r => r.method === method && r.pattern.test(pathname))

    if (matched) {
      const responseBody = JSON.stringify(matched.body)
      res.writeHead(matched.status, { 'Content-Type': 'application/json' })
      res.end(responseBody)
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not Found', path: pathname, method }))
    }
  })

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  const { port } = server.address() as AddressInfo
  const url = `http://127.0.0.1:${port}`

  return {
    url,
    calls,
    setRoute(method: string, path: string, status: number, body: unknown) {
      const { pattern, paramNames } = compilePattern(path)
      routes.unshift({ method: method.toUpperCase(), pattern, paramNames, status, body })
    },
    clearCalls() {
      calls.splice(0, calls.length)
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()))
      })
    },
  }
}
