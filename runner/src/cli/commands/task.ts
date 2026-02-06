import { apiRequest, getApiConfig } from '../api.js'

interface Task {
  id: string
  key: string
  title: string
  status: string
  assignee?: string
  priority?: string
}

export async function taskGet(key: string): Promise<void> {
  const { projectId } = getApiConfig()
  const task = await apiRequest<Task>(
    'GET',
    `/api/projects/${projectId}/tasks/${key}`
  )
  console.log(JSON.stringify(task, null, 2))
}

export async function taskUpdate(
  key: string,
  options: {
    status?: string
    summary?: string
    assignee?: string
  }
): Promise<void> {
  const { projectId } = getApiConfig()

  const body: Record<string, unknown> = {}
  if (options.status) body.status = options.status
  if (options.summary) body.summary = options.summary
  if (options.assignee) body.assignee = options.assignee

  const task = await apiRequest<Task>(
    'PATCH',
    `/api/projects/${projectId}/tasks/${key}`,
    body
  )

  console.log(`Updated task ${key}`)
  console.log(JSON.stringify(task, null, 2))
}

export async function taskList(): Promise<void> {
  const { projectId } = getApiConfig()
  const tasks = await apiRequest<Task[]>(
    'GET',
    `/api/projects/${projectId}/tasks`
  )
  console.log(JSON.stringify(tasks, null, 2))
}
