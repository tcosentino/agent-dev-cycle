import { apiRequest, getApiConfig } from '../api.js'

interface Task {
  id: string
  key: string
  title: string
  description?: string
  status: string
  assignee?: string
  priority?: string
  type?: string
  parentKey?: string
}

export interface CreateTaskOptions {
  title: string
  description?: string
  type?: string
  priority?: string
  assignee?: string
  parentKey?: string
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

export async function taskCreate(options: CreateTaskOptions): Promise<void> {
  const { projectId } = getApiConfig()

  const body: Record<string, unknown> = {
    title: options.title,
  }
  if (options.description) body.description = options.description
  if (options.type) body.type = options.type
  if (options.priority) body.priority = options.priority
  if (options.assignee) body.assignee = options.assignee
  if (options.parentKey) body.parentKey = options.parentKey

  const task = await apiRequest<Task>(
    'POST',
    `/api/projects/${projectId}/tasks`,
    body
  )

  console.log(`Created task ${task.key}`)
  console.log(JSON.stringify(task, null, 2))
}
