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
  createdAt?: string
  updatedAt?: string
}

interface TaskComment {
  id: string
  taskId: string
  userId?: string
  content: string
  authorName?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateTaskOptions {
  title: string
  description?: string
  type?: string
  priority?: string
  assignee?: string
}

async function findTaskByKey(key: string): Promise<Task> {
  const { projectId } = getApiConfig()
  const tasks = await apiRequest<Task[]>('GET', `/api/tasks?projectId=${projectId}`)
  const task = tasks.find(t => t.key === key)
  if (!task) {
    throw new Error(`Task not found: ${key}`)
  }
  return task
}

export async function taskGet(key: string): Promise<void> {
  const task = await findTaskByKey(key)
  console.log(JSON.stringify(task, null, 2))
}

export async function taskUpdate(
  key: string,
  options: {
    status?: string
    title?: string
    description?: string
    priority?: string
    type?: string
    assignee?: string
  }
): Promise<void> {
  const task = await findTaskByKey(key)

  const body: Record<string, unknown> = {}
  if (options.status) body.status = options.status
  if (options.title) body.title = options.title
  if (options.description) body.description = options.description
  if (options.priority) body.priority = options.priority
  if (options.type) body.type = options.type
  if (options.assignee) body.assignee = options.assignee

  const updated = await apiRequest<Task>('PATCH', `/api/tasks/${task.id}`, body)

  console.log(`Updated task ${key}`)
  console.log(JSON.stringify(updated, null, 2))
}

export async function taskList(options: { status?: string; assignee?: string } = {}): Promise<void> {
  const { projectId } = getApiConfig()
  const params = new URLSearchParams({ projectId })
  if (options.status) params.set('status', options.status)
  if (options.assignee) params.set('assignee', options.assignee)

  const tasks = await apiRequest<Task[]>('GET', `/api/tasks?${params}`)
  console.log(JSON.stringify(tasks, null, 2))
}

export async function taskCreate(options: CreateTaskOptions): Promise<void> {
  const { projectId } = getApiConfig()

  const body: Record<string, unknown> = {
    projectId,
    title: options.title,
  }
  if (options.description) body.description = options.description
  if (options.type) body.type = options.type
  if (options.priority) body.priority = options.priority
  if (options.assignee) body.assignee = options.assignee

  const task = await apiRequest<Task>('POST', `/api/tasks`, body)

  console.log(`Created task ${task.key}`)
  console.log(JSON.stringify(task, null, 2))
}

export async function taskDelete(key: string): Promise<void> {
  const task = await findTaskByKey(key)
  await apiRequest('DELETE', `/api/tasks/${task.id}`)
  console.log(`Deleted task ${key}`)
}

export async function taskCommentList(key: string): Promise<void> {
  const task = await findTaskByKey(key)
  const comments = await apiRequest<TaskComment[]>('GET', `/api/taskComments?taskId=${task.id}`)
  console.log(JSON.stringify(comments, null, 2))
}

export async function taskCommentAdd(key: string, content: string): Promise<void> {
  const task = await findTaskByKey(key)
  const { agentRole } = getApiConfig()

  const body: Record<string, unknown> = {
    taskId: task.id,
    content,
  }
  if (agentRole) body.authorName = agentRole

  const comment = await apiRequest<TaskComment>('POST', `/api/taskComments`, body)

  console.log(`Added comment to ${key}`)
  console.log(JSON.stringify(comment, null, 2))
}

export async function taskCommentDelete(commentId: string): Promise<void> {
  await apiRequest('DELETE', `/api/taskComments/${commentId}`)
  console.log(`Deleted comment ${commentId}`)
}
