import { apiRequest, getApiConfig } from '../api.js'

type AgentStatus = 'active' | 'busy' | 'away' | 'offline'

interface StatusUpdate {
  status: AgentStatus
  message?: string
}

export async function statusSet(
  status: AgentStatus,
  message?: string
): Promise<void> {
  const { projectId } = getApiConfig()

  const body: StatusUpdate = { status }
  if (message) body.message = message

  await apiRequest('PATCH', `/api/projects/${projectId}/agent-status`, body)

  console.log(`Status updated: ${status}${message ? ` - ${message}` : ''}`)
}
