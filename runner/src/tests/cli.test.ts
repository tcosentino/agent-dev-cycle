import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { startMockServer, type MockServer } from './mock-server.js'
import { runCli } from './cli-runner.js'

const BASE_ENV = {
  serverUrl: '', // filled in beforeAll
  projectId: 'proj-123',
  runId: 'run-001',
  agentRole: 'engineer',
}

const TASK_1 = {
  id: 'task-id-1',
  key: 'AF-1',
  title: 'Fix auth bug',
  status: 'todo',
  priority: 'high',
  type: 'backend',
}

const TASK_2 = {
  id: 'task-id-2',
  key: 'AF-2',
  title: 'Write tests',
  status: 'in-progress',
  priority: 'medium',
  type: 'backend',
}

const COMMENT_1 = {
  id: 'comment-id-1',
  taskId: 'task-id-1',
  content: 'Looking into this',
  authorName: 'engineer',
}

describe('agentforge CLI', () => {
  let server: MockServer
  let env: typeof BASE_ENV

  beforeAll(async () => {
    server = await startMockServer()
    env = { ...BASE_ENV, serverUrl: server.url }
  })

  afterAll(async () => {
    await server.close()
  })

  beforeEach(() => {
    server.clearCalls()
  })

  // ─── task list ───────────────────────────────────────────────────────────────

  describe('task list', () => {
    it('outputs JSON array of tasks', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1, TASK_2])

      const result = await runCli(['task', 'list'], env)

      expect(result.exitCode).toBe(0)
      expect(JSON.parse(result.stdout)).toEqual([TASK_1, TASK_2])
      expect(server.calls).toHaveLength(1)
      expect(server.calls[0].query.projectId).toBe(env.projectId)
    })

    it('forwards --status filter as query param', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1])

      await runCli(['task', 'list', '--status', 'todo'], env)

      expect(server.calls[0].query.status).toBe('todo')
    })

    it('forwards --assignee filter as query param', async () => {
      server.setRoute('GET', '/api/tasks', 200, [])

      await runCli(['task', 'list', '--assignee', 'engineer'], env)

      expect(server.calls[0].query.assignee).toBe('engineer')
    })

    it('outputs empty array when no tasks exist', async () => {
      server.setRoute('GET', '/api/tasks', 200, [])

      const result = await runCli(['task', 'list'], env)

      expect(result.exitCode).toBe(0)
      expect(JSON.parse(result.stdout)).toEqual([])
    })
  })

  // ─── task get ────────────────────────────────────────────────────────────────

  describe('task get', () => {
    it('finds task by key and outputs it as JSON', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1, TASK_2])

      const result = await runCli(['task', 'get', 'AF-1'], env)

      expect(result.exitCode).toBe(0)
      expect(JSON.parse(result.stdout)).toEqual(TASK_1)
    })

    it('exits 1 when task key is not found', async () => {
      server.setRoute('GET', '/api/tasks', 200, [])

      const result = await runCli(['task', 'get', 'AF-999'], env)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Task not found: AF-999')
    })
  })

  // ─── task create ─────────────────────────────────────────────────────────────

  describe('task create', () => {
    it('POSTs task body and outputs created task', async () => {
      const created = { ...TASK_1, key: 'AF-3', title: 'New task' }
      server.setRoute('POST', '/api/tasks', 201, created)

      const result = await runCli(
        ['task', 'create', 'New task', '--type', 'backend', '--priority', 'high'],
        env
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Created task AF-3')

      const call = server.calls[0]
      expect(call.method).toBe('POST')
      expect(call.body).toMatchObject({
        projectId: env.projectId,
        title: 'New task',
        type: 'backend',
        priority: 'high',
      })
    })

    it('sends only required fields when no options given', async () => {
      const created = { ...TASK_1, key: 'AF-4', title: 'Minimal' }
      server.setRoute('POST', '/api/tasks', 201, created)

      await runCli(['task', 'create', 'Minimal'], env)

      const call = server.calls[0]
      expect(call.body).toMatchObject({ projectId: env.projectId, title: 'Minimal' })
      expect((call.body as Record<string, unknown>).type).toBeUndefined()
      expect((call.body as Record<string, unknown>).priority).toBeUndefined()
    })

    it('sends --assignee when provided', async () => {
      server.setRoute('POST', '/api/tasks', 201, TASK_1)

      await runCli(['task', 'create', 'Assigned task', '--assignee', 'pm'], env)

      expect((server.calls[0].body as Record<string, unknown>).assignee).toBe('pm')
    })
  })

  // ─── task update ─────────────────────────────────────────────────────────────

  describe('task update', () => {
    it('GETs tasks to find by key then PATCHes the task', async () => {
      const updated = { ...TASK_1, status: 'done' }
      server.setRoute('GET', '/api/tasks', 200, [TASK_1])
      server.setRoute('PATCH', '/api/tasks/:id', 200, updated)

      const result = await runCli(['task', 'update', 'AF-1', '--status', 'done'], env)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Updated task AF-1')

      expect(server.calls).toHaveLength(2)
      const getCall = server.calls[0]
      const patchCall = server.calls[1]

      expect(getCall.method).toBe('GET')
      expect(getCall.query.projectId).toBe(env.projectId)

      expect(patchCall.method).toBe('PATCH')
      expect(patchCall.path).toBe(`/api/tasks/${TASK_1.id}`)
      expect(patchCall.body).toEqual({ status: 'done' })
    })

    it('can update multiple fields at once', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1])
      server.setRoute('PATCH', '/api/tasks/:id', 200, { ...TASK_1, title: 'Renamed', priority: 'low' })

      await runCli(['task', 'update', 'AF-1', '--title', 'Renamed', '--priority', 'low'], env)

      const patchCall = server.calls[1]
      expect(patchCall.body).toEqual({ title: 'Renamed', priority: 'low' })
    })

    it('exits 1 when task key is not found', async () => {
      server.setRoute('GET', '/api/tasks', 200, [])

      const result = await runCli(['task', 'update', 'AF-999', '--status', 'done'], env)

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Task not found: AF-999')
    })
  })

  // ─── task delete ─────────────────────────────────────────────────────────────

  describe('task delete', () => {
    it('GETs tasks to find by key then DELETEs the task', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1])
      server.setRoute('DELETE', '/api/tasks/:id', 200, {})

      const result = await runCli(['task', 'delete', 'AF-1'], env)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Deleted task AF-1')

      expect(server.calls).toHaveLength(2)
      expect(server.calls[1].method).toBe('DELETE')
      expect(server.calls[1].path).toBe(`/api/tasks/${TASK_1.id}`)
    })

    it('exits 1 when task key is not found', async () => {
      server.setRoute('GET', '/api/tasks', 200, [])

      const result = await runCli(['task', 'delete', 'AF-999'], env)

      expect(result.exitCode).toBe(1)
    })
  })

  // ─── task comment list ────────────────────────────────────────────────────────

  describe('task comment list', () => {
    it('lists comments for a task', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1])
      server.setRoute('GET', '/api/taskComments', 200, [COMMENT_1])

      const result = await runCli(['task', 'comment', 'list', 'AF-1'], env)

      expect(result.exitCode).toBe(0)
      expect(JSON.parse(result.stdout)).toEqual([COMMENT_1])

      expect(server.calls).toHaveLength(2)
      expect(server.calls[1].query.taskId).toBe(TASK_1.id)
    })
  })

  // ─── task comment add ─────────────────────────────────────────────────────────

  describe('task comment add', () => {
    it('POSTs a comment with taskId and content', async () => {
      server.setRoute('GET', '/api/tasks', 200, [TASK_1])
      server.setRoute('POST', '/api/taskComments', 201, COMMENT_1)

      const result = await runCli(
        ['task', 'comment', 'add', 'AF-1', 'Looking into this'],
        { ...env, agentRole: 'engineer' }
      )

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Added comment to AF-1')

      const postCall = server.calls[1]
      expect(postCall.body).toMatchObject({
        taskId: TASK_1.id,
        content: 'Looking into this',
        authorName: 'engineer',
      })
    })
  })

  // ─── task comment delete ──────────────────────────────────────────────────────

  describe('task comment delete', () => {
    it('DELETEs a comment by ID', async () => {
      server.setRoute('DELETE', '/api/taskComments/:id', 200, {})

      const result = await runCli(['task', 'comment', 'delete', 'comment-id-1'], env)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Deleted comment comment-id-1')

      expect(server.calls).toHaveLength(1)
      expect(server.calls[0].method).toBe('DELETE')
      expect(server.calls[0].path).toBe('/api/taskComments/comment-id-1')
    })
  })

  // ─── chat post ────────────────────────────────────────────────────────────────

  describe('chat post', () => {
    it('POSTs a message to the project channel', async () => {
      const msg = { id: 'msg-1', content: 'Hello team', sender: 'agent', timestamp: '' }
      server.setRoute('POST', '/api/projects/:projectId/messages', 200, msg)

      const result = await runCli(['chat', 'post', 'Hello team'], env)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Posted message: msg-1')

      expect(server.calls).toHaveLength(1)
      const call = server.calls[0]
      expect(call.path).toBe(`/api/projects/${env.projectId}/messages`)
      expect(call.body).toMatchObject({
        content: 'Hello team',
        sender: 'agent',
        runId: env.runId,
      })
    })
  })

  // ─── status set ───────────────────────────────────────────────────────────────

  describe('status set', () => {
    it('PATCHes the agent-status endpoint', async () => {
      server.setRoute('PATCH', '/api/projects/:projectId/agent-status', 200, {})

      const result = await runCli(['status', 'set', 'busy'], env)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Status updated: busy')

      const call = server.calls[0]
      expect(call.path).toBe(`/api/projects/${env.projectId}/agent-status`)
      expect(call.body).toEqual({ status: 'busy' })
    })

    it('includes optional message when provided', async () => {
      server.setRoute('PATCH', '/api/projects/:projectId/agent-status', 200, {})

      const result = await runCli(['status', 'set', 'busy', 'Working on AF-1'], env)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Status updated: busy - Working on AF-1')
      expect(server.calls[0].body).toEqual({ status: 'busy', message: 'Working on AF-1' })
    })

    it('works for all valid status values', async () => {
      for (const status of ['active', 'away', 'offline'] as const) {
        server.clearCalls()
        server.setRoute('PATCH', '/api/projects/:projectId/agent-status', 200, {})

        const result = await runCli(['status', 'set', status], env)
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain(`Status updated: ${status}`)
      }
    })
  })
})
