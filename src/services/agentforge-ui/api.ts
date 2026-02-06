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
