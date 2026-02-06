// API client for fetching data from the server

const API_BASE = '/api'

export interface ApiProject {
  id: string
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

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const api = {
  projects: {
    list: () => fetchJson<ApiProject[]>('/projects'),
    get: (id: string) => fetchJson<ApiProject>(`/projects/${id}`),
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
    list: (channelId?: string) => {
      const query = channelId ? `?channelId=${channelId}` : ''
      return fetchJson<ApiMessage[]>(`/messages${query}`)
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
    list: (deploymentId?: string) => {
      const query = deploymentId ? `?deploymentId=${deploymentId}` : ''
      return fetchJson<ApiWorkload[]>(`/workloads${query}`)
    },
    get: (id: string) => fetchJson<ApiWorkload>(`/workloads/${id}`),
  },
}

// Fetch all data for a project and build a DbSnapshot-compatible object
export async function fetchProjectSnapshot(projectId: string) {
  const [project, tasks, channels, messages, agentStatus, sessions, deployments, workloads] = await Promise.all([
    api.projects.get(projectId),
    api.tasks.list(projectId),
    api.channels.list(projectId),
    api.messages.list(), // TODO: filter by project's channels
    api.agentStatuses.list(projectId),
    api.sessions.list(projectId),
    api.deployments.list(projectId),
    api.workloads.list(),
  ])

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
