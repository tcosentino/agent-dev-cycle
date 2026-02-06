import { apiRequest, getApiConfig } from '../api.js'

interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
}

export async function chatPost(message: string): Promise<void> {
  const { projectId, runId } = getApiConfig()

  const result = await apiRequest<Message>(
    'POST',
    `/api/projects/${projectId}/messages`,
    {
      content: message,
      sender: 'agent',
      runId,
    }
  )

  console.log(`Posted message: ${result.id}`)
}
