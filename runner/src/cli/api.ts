export interface ApiConfig {
  serverUrl: string
  projectId: string
  runId: string
  sessionId?: string
}

export function getApiConfig(): ApiConfig {
  const serverUrl = process.env.AGENTFORGE_SERVER_URL
  const projectId = process.env.AGENTFORGE_PROJECT_ID
  const runId = process.env.AGENTFORGE_RUN_ID
  const sessionId = process.env.AGENTFORGE_SESSION_ID

  if (!serverUrl) {
    throw new Error('AGENTFORGE_SERVER_URL not set')
  }
  if (!projectId) {
    throw new Error('AGENTFORGE_PROJECT_ID not set')
  }
  if (!runId) {
    throw new Error('AGENTFORGE_RUN_ID not set')
  }

  return { serverUrl, projectId, runId, sessionId }
}

export async function apiRequest<T = unknown>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const { serverUrl } = getApiConfig()
  const url = `${serverUrl}${path}`

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API request failed: ${response.status} ${text}`)
  }

  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>
  }

  return response.text() as unknown as T
}
