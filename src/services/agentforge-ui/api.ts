// API client for fetching data from the server

const API_BASE = '/api'

export interface ApiUser {
  id: string
  githubId: string
  githubLogin: string
  githubEmail?: string
  avatarUrl?: string
}

export interface ApiProject {
  id: string
  userId: string
  name: string
  key: string
  repoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface ApiTask {
  id: string
  projectId: string
  key: string
  title: string
  description?: string
  status: string
  priority: string
  assignee?: string
  createdAt: string
  updatedAt: string
}

export interface ApiChannel {
  id: string
  projectId: string
  name: string
  type: string
  createdAt: string
  updatedAt: string
}

export interface ApiMessage {
  id: string
  channelId: string
  projectId: string
  type: string
  sender?: string
  senderName?: string
  content: string
  actionType?: string
  actionStatus?: string
  actionLabel?: string
  actionSubject?: string
  createdAt: string
}

export interface ApiAgentStatus {
  id: string
  projectId: string
  role: string
  displayName: string
  status: string
  currentTask?: string
  model?: string
  createdAt: string
  updatedAt: string
}

export interface ApiSession {
  id: string
  projectId: string
  name: string
  status: string
  startedAt: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ApiDeployment {
  id: string
  projectId: string
  name: string
  description?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ApiWorkload {
  id: string
  deploymentId: string
  moduleName: string
  moduleType: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ApiAgentSessionLogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export type ApiAgentSessionStage =
  | 'pending'
  | 'cloning'
  | 'loading'
  | 'executing'
  | 'capturing'
  | 'committing'
  | 'completed'
  | 'failed'

export interface ApiAgentSession {
  id: string
  projectId: string
  sessionId: string
  agent: 'pm' | 'engineer' | 'qa' | 'lead'
  phase: 'discovery' | 'shaping' | 'building' | 'delivery'
  taskPrompt: string
  stage: ApiAgentSessionStage
  progress: number
  currentStep?: string
  logs: ApiAgentSessionLogEntry[]
  summary?: string
  commitSha?: string
  error?: string
  retriedFromId?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAgentSessionInput {
  projectId: string
  agent: 'pm' | 'engineer' | 'qa' | 'lead'
  phase: 'discovery' | 'shaping' | 'building' | 'delivery'
  taskPrompt: string
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // Include cookies for auth
  })
  if (!res.ok) {
    if (res.status === 401) {
      throw new AuthError('Unauthorized')
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export interface ApiGitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  html_url: string
  clone_url: string
  default_branch: string
  updated_at: string
}

export const api = {
  // Auth
  me: () => fetchJson<ApiUser>('/me'),
  getLoginUrl: () => '/auth/github',
  getLogoutUrl: () => '/auth/github/logout',

  // GitHub
  github: {
    getRepos: () => fetchJson<{ repos: ApiGitHubRepo[] }>('/github/repos'),
    getTree: (owner: string, repo: string, branch?: string) => {
      const query = branch ? `?branch=${branch}` : ''
      return fetchJson<{ files: Array<{ path: string; size?: number }>; truncated: boolean }>(
        `/github/repos/${owner}/${repo}/tree${query}`
      )
    },
    getContents: (owner: string, repo: string, path: string, branch?: string) => {
      const query = branch ? `?branch=${branch}` : ''
      return fetchJson<{ content: string }>(
        `/github/repos/${owner}/${repo}/contents/${path}${query}`
      )
    },
  },

  projects: {
    list: (userId: string) => fetchJson<ApiProject[]>(`/projects?userId=${userId}`),
    get: (id: string) => fetchJson<ApiProject>(`/projects/${id}`),
    create: (data: { userId: string; name: string; key: string; repoUrl?: string }) =>
      fetchJson<ApiProject>('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
  tasks: {
    list: (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : ''
      return fetchJson<ApiTask[]>(`/tasks${query}`)
    },
    get: (id: string) => fetchJson<ApiTask>(`/tasks/${id}`),
  },
  channels: {
    list: (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : ''
      return fetchJson<ApiChannel[]>(`/channels${query}`)
    },
    get: (id: string) => fetchJson<ApiChannel>(`/channels/${id}`),
  },
  messages: {
    list: (projectId: string, channelId: string) => {
      return fetchJson<ApiMessage[]>(`/messages?projectId=${projectId}&channelId=${channelId}`)
    },
    get: (id: string) => fetchJson<ApiMessage>(`/messages/${id}`),
  },
  agentStatuses: {
    list: (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : ''
      return fetchJson<ApiAgentStatus[]>(`/agentStatuses${query}`)
    },
    get: (id: string) => fetchJson<ApiAgentStatus>(`/agentStatuses/${id}`),
  },
  sessions: {
    list: (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : ''
      return fetchJson<ApiSession[]>(`/sessions${query}`)
    },
    get: (id: string) => fetchJson<ApiSession>(`/sessions/${id}`),
  },
  deployments: {
    list: (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : ''
      return fetchJson<ApiDeployment[]>(`/deployments${query}`)
    },
    get: (id: string) => fetchJson<ApiDeployment>(`/deployments/${id}`),
  },
  workloads: {
    list: (deploymentId: string) => {
      return fetchJson<ApiWorkload[]>(`/workloads?deploymentId=${deploymentId}`)
    },
    get: (id: string) => fetchJson<ApiWorkload>(`/workloads/${id}`),
  },

  agentSessions: {
    list: (projectId: string) => {
      return fetchJson<ApiAgentSession[]>(`/agentSessions?projectId=${projectId}`)
    },
    get: (id: string) => fetchJson<ApiAgentSession>(`/agentSessions/${id}`),
    create: (data: CreateAgentSessionInput) =>
      fetchJson<ApiAgentSession>('/agentSessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    start: (id: string) =>
      fetchJson<{ ok: boolean; message: string }>(`/agentSessions/${id}/start`, {
        method: 'POST',
      }),
    cancel: (id: string) =>
      fetchJson<{ ok: boolean; message: string }>(`/agentSessions/${id}/cancel`, {
        method: 'POST',
      }),
    retry: (id: string) =>
      fetchJson<ApiAgentSession>(`/agentSessions/${id}/retry`, {
        method: 'POST',
      }),
    streamUrl: (id: string) => `${API_BASE}/agentSessions/${id}/stream`,
  },
}

// Parse GitHub repo URL to extract owner and repo
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/.]+)(\.git)?/)
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] }
  }

  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+)(\.git)?/)
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] }
  }

  return null
}

// Fetch files from GitHub for a project
export async function fetchProjectFiles(repoUrl: string): Promise<Record<string, string>> {
  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    console.warn('Could not parse repo URL:', repoUrl)
    return {}
  }

  try {
    const { files } = await api.github.getTree(parsed.owner, parsed.repo)

    // Create a map of file paths (content will be loaded on demand)
    const fileMap: Record<string, string> = {}
    for (const file of files) {
      // Mark files as loadable with empty content initially
      fileMap[file.path] = ''
    }

    return fileMap
  } catch (err) {
    console.warn('Failed to fetch repo files:', err)
    return {}
  }
}

// Fetch file content from GitHub
export async function fetchFileContent(repoUrl: string, path: string): Promise<string> {
  const parsed = parseRepoUrl(repoUrl)
  if (!parsed) {
    throw new Error('Invalid repo URL')
  }

  const { content } = await api.github.getContents(parsed.owner, parsed.repo, path)
  return content
}

// Fetch all data for a project and build a DbSnapshot-compatible object
export async function fetchProjectSnapshot(projectId: string) {
  // First fetch the resources that don't have nested dependencies
  const [project, tasks, channels, agentStatus, sessions, deployments] = await Promise.all([
    api.projects.get(projectId),
    api.tasks.list(projectId),
    api.channels.list(projectId),
    api.agentStatuses.list(projectId),
    api.sessions.list(projectId),
    api.deployments.list(projectId),
  ])

  // Fetch messages for each channel (messages require both projectId and channelId)
  const messagesByChannel = await Promise.all(
    channels.map(channel => api.messages.list(projectId, channel.id))
  )
  const messages = messagesByChannel.flat()

  // Fetch workloads for each deployment (workloads require deploymentId)
  const workloadsByDeployment = await Promise.all(
    deployments.map(deployment => api.workloads.list(deployment.id))
  )
  const workloads = workloadsByDeployment.flat()

  return {
    projects: [project],
    tasks,
    channels,
    messages,
    agentStatus,
    sessions,
    deployments,
    workloads,
  }
}
