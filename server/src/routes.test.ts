import { describe, it, expect, beforeEach } from 'vitest'
import { app } from './app'
import { resetDb, seedProject } from './test-helpers'

const json = (body: unknown) => ({
  method: 'POST' as const,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const patch = (body: unknown) => ({
  method: 'PATCH' as const,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

beforeEach(() => {
  resetDb()
})

// --- Projects ---

describe('Projects', () => {
  const base = 'http://localhost/api/projects'

  it('GET / returns empty list', async () => {
    const res = await app.request(base)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST / creates a project', async () => {
    const body = { id: 'proj-1', name: 'Test', key: 'T', repoUrl: 'https://example.com', createdAt: '2026-01-01T00:00:00Z' }
    const res = await app.request(base, json(body))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('proj-1')
    expect(data.name).toBe('Test')
  })

  it('GET /:id returns a project', async () => {
    seedProject('proj-1')
    const res = await app.request(`${base}/proj-1`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe('proj-1')
  })

  it('GET /:id returns 404 for missing project', async () => {
    const res = await app.request(`${base}/nonexistent`)
    expect(res.status).toBe(404)
  })

  it('PATCH /:id updates a project', async () => {
    seedProject('proj-1')
    const res = await app.request(`${base}/proj-1`, patch({ name: 'Updated' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Updated')
  })

  it('DELETE /:id deletes a project', async () => {
    seedProject('proj-1')
    const res = await app.request(`${base}/proj-1`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const check = await app.request(`${base}/proj-1`)
    expect(check.status).toBe(404)
  })

  it('GET / returns multiple projects', async () => {
    seedProject('proj-1')
    seedProject('proj-2')
    const res = await app.request(base)
    const data = await res.json()
    expect(data).toHaveLength(2)
  })
})

// --- Tasks ---

describe('Tasks', () => {
  const base = 'http://localhost/api/tasks'

  const makeTask = (id: string, projectId: string) => ({
    id,
    projectId,
    key: `T-${id}`,
    title: `Task ${id}`,
    description: null,
    type: 'backend' as const,
    priority: 'high' as const,
    status: 'todo' as const,
    assignee: 'engineer' as const,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })

  it('GET / returns empty list', async () => {
    const res = await app.request(base)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST / creates a task', async () => {
    seedProject('proj-1')
    const res = await app.request(base, json(makeTask('task-1', 'proj-1')))
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.id).toBe('task-1')
  })

  it('GET /?projectId= filters by project', async () => {
    seedProject('proj-1')
    seedProject('proj-2')
    await app.request(base, json(makeTask('task-1', 'proj-1')))
    await app.request(base, json(makeTask('task-2', 'proj-2')))

    const res = await app.request(`${base}?projectId=proj-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe('proj-1')
  })

  it('GET /:id returns a task', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeTask('task-1', 'proj-1')))

    const res = await app.request(`${base}/task-1`)
    expect(res.status).toBe(200)
    expect((await res.json()).title).toBe('Task task-1')
  })

  it('GET /:id returns 404 for missing task', async () => {
    const res = await app.request(`${base}/nonexistent`)
    expect(res.status).toBe(404)
  })

  it('PATCH /:id updates task status', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeTask('task-1', 'proj-1')))

    const res = await app.request(`${base}/task-1`, patch({ status: 'done' }))
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('done')
  })

  it('DELETE /:id deletes a task', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeTask('task-1', 'proj-1')))

    const res = await app.request(`${base}/task-1`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const check = await app.request(`${base}/task-1`)
    expect(check.status).toBe(404)
  })
})

// --- Channels ---

describe('Channels', () => {
  const base = 'http://localhost/api/channels'

  const makeChannel = (id: string, projectId: string) => ({
    id,
    projectId,
    name: `channel-${id}`,
    createdAt: '2026-01-01T00:00:00Z',
  })

  it('GET / returns empty list', async () => {
    const res = await app.request(base)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST / creates a channel', async () => {
    seedProject('proj-1')
    const res = await app.request(base, json(makeChannel('ch-1', 'proj-1')))
    expect(res.status).toBe(201)
    expect((await res.json()).name).toBe('channel-ch-1')
  })

  it('GET /?projectId= filters by project', async () => {
    seedProject('proj-1')
    seedProject('proj-2')
    await app.request(base, json(makeChannel('ch-1', 'proj-1')))
    await app.request(base, json(makeChannel('ch-2', 'proj-2')))

    const res = await app.request(`${base}?projectId=proj-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe('proj-1')
  })

  it('GET /:id returns 404 for missing channel', async () => {
    const res = await app.request(`${base}/nonexistent`)
    expect(res.status).toBe(404)
  })

  it('PATCH /:id updates a channel', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeChannel('ch-1', 'proj-1')))

    const res = await app.request(`${base}/ch-1`, patch({ name: 'renamed' }))
    expect(res.status).toBe(200)
    expect((await res.json()).name).toBe('renamed')
  })

  it('DELETE /:id deletes a channel', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeChannel('ch-1', 'proj-1')))

    const res = await app.request(`${base}/ch-1`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const check = await app.request(`${base}/ch-1`)
    expect(check.status).toBe(404)
  })
})

// --- Messages ---

describe('Messages', () => {
  const base = 'http://localhost/api/messages'

  const makeMessage = (id: string, channelId: string, projectId: string) => ({
    id,
    channelId,
    projectId,
    type: 'agent' as const,
    sender: 'engineer' as const,
    senderName: 'Engineer Agent',
    content: `Message ${id}`,
    actionType: null,
    actionStatus: null,
    actionLabel: null,
    actionSubject: null,
    createdAt: '2026-01-01T00:00:00Z',
  })

  const setupChannels = async () => {
    seedProject('proj-1')
    seedProject('proj-2')
    await app.request('http://localhost/api/channels', json({ id: 'ch-1', projectId: 'proj-1', name: 'general', createdAt: '2026-01-01T00:00:00Z' }))
    await app.request('http://localhost/api/channels', json({ id: 'ch-2', projectId: 'proj-2', name: 'general', createdAt: '2026-01-01T00:00:00Z' }))
  }

  it('GET / returns empty list', async () => {
    const res = await app.request(base)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST / creates a message', async () => {
    await setupChannels()
    const res = await app.request(base, json(makeMessage('msg-1', 'ch-1', 'proj-1')))
    expect(res.status).toBe(201)
    expect((await res.json()).content).toBe('Message msg-1')
  })

  it('GET /?projectId= filters by project', async () => {
    await setupChannels()
    await app.request(base, json(makeMessage('msg-1', 'ch-1', 'proj-1')))
    await app.request(base, json(makeMessage('msg-2', 'ch-2', 'proj-2')))

    const res = await app.request(`${base}?projectId=proj-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe('proj-1')
  })

  it('GET /?channelId= filters by channel', async () => {
    await setupChannels()
    await app.request(base, json(makeMessage('msg-1', 'ch-1', 'proj-1')))
    await app.request(base, json(makeMessage('msg-2', 'ch-2', 'proj-2')))

    const res = await app.request(`${base}?channelId=ch-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].channelId).toBe('ch-1')
  })

  it('GET /?projectId=&channelId= filters by both', async () => {
    await setupChannels()
    await app.request(base, json(makeMessage('msg-1', 'ch-1', 'proj-1')))
    await app.request(base, json(makeMessage('msg-2', 'ch-2', 'proj-2')))

    const res = await app.request(`${base}?projectId=proj-1&channelId=ch-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })

  it('GET /:id returns 404 for missing message', async () => {
    const res = await app.request(`${base}/nonexistent`)
    expect(res.status).toBe(404)
  })

  it('PATCH /:id updates a message', async () => {
    await setupChannels()
    await app.request(base, json(makeMessage('msg-1', 'ch-1', 'proj-1')))

    const res = await app.request(`${base}/msg-1`, patch({ content: 'Updated' }))
    expect(res.status).toBe(200)
    expect((await res.json()).content).toBe('Updated')
  })

  it('DELETE /:id deletes a message', async () => {
    await setupChannels()
    await app.request(base, json(makeMessage('msg-1', 'ch-1', 'proj-1')))

    const res = await app.request(`${base}/msg-1`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const check = await app.request(`${base}/msg-1`)
    expect(check.status).toBe(404)
  })
})

// --- Agent Status ---

describe('Agent Status', () => {
  const base = 'http://localhost/api/agent-status'

  const makeStatus = (id: string, projectId: string) => ({
    id,
    projectId,
    role: 'engineer' as const,
    status: 'active' as const,
    currentTask: null,
    lastActiveAt: '2026-01-01T00:00:00Z',
  })

  it('GET / returns empty list', async () => {
    const res = await app.request(base)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST / creates an agent status', async () => {
    seedProject('proj-1')
    const res = await app.request(base, json(makeStatus('as-1', 'proj-1')))
    expect(res.status).toBe(201)
    expect((await res.json()).role).toBe('engineer')
  })

  it('GET /?projectId= filters by project', async () => {
    seedProject('proj-1')
    seedProject('proj-2')
    await app.request(base, json(makeStatus('as-1', 'proj-1')))
    await app.request(base, json(makeStatus('as-2', 'proj-2')))

    const res = await app.request(`${base}?projectId=proj-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe('proj-1')
  })

  it('GET /:id returns 404 for missing status', async () => {
    const res = await app.request(`${base}/nonexistent`)
    expect(res.status).toBe(404)
  })

  it('PATCH /:id updates agent status', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeStatus('as-1', 'proj-1')))

    const res = await app.request(`${base}/as-1`, patch({ status: 'away', currentTask: 'TF-3' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('away')
    expect(data.currentTask).toBe('TF-3')
  })

  it('DELETE /:id deletes an agent status', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeStatus('as-1', 'proj-1')))

    const res = await app.request(`${base}/as-1`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const check = await app.request(`${base}/as-1`)
    expect(check.status).toBe(404)
  })
})

// --- Sessions ---

describe('Sessions', () => {
  const base = 'http://localhost/api/sessions'

  const makeSession = (id: string, projectId: string) => ({
    id,
    projectId,
    runId: `run-${id}`,
    agent: 'engineer' as const,
    phase: 'building',
    summary: null,
    startedAt: '2026-01-01T09:00:00Z',
    completedAt: null,
  })

  it('GET / returns empty list', async () => {
    const res = await app.request(base)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('POST / creates a session', async () => {
    seedProject('proj-1')
    const res = await app.request(base, json(makeSession('ses-1', 'proj-1')))
    expect(res.status).toBe(201)
    expect((await res.json()).runId).toBe('run-ses-1')
  })

  it('GET /?projectId= filters by project', async () => {
    seedProject('proj-1')
    seedProject('proj-2')
    await app.request(base, json(makeSession('ses-1', 'proj-1')))
    await app.request(base, json(makeSession('ses-2', 'proj-2')))

    const res = await app.request(`${base}?projectId=proj-1`)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].projectId).toBe('proj-1')
  })

  it('GET /:id returns 404 for missing session', async () => {
    const res = await app.request(`${base}/nonexistent`)
    expect(res.status).toBe(404)
  })

  it('PATCH /:id updates a session', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeSession('ses-1', 'proj-1')))

    const res = await app.request(`${base}/ses-1`, patch({ summary: 'Completed work', completedAt: '2026-01-01T10:00:00Z' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.summary).toBe('Completed work')
    expect(data.completedAt).toBe('2026-01-01T10:00:00Z')
  })

  it('DELETE /:id deletes a session', async () => {
    seedProject('proj-1')
    await app.request(base, json(makeSession('ses-1', 'proj-1')))

    const res = await app.request(`${base}/ses-1`, { method: 'DELETE' })
    expect(res.status).toBe(200)

    const check = await app.request(`${base}/ses-1`)
    expect(check.status).toBe(404)
  })
})

// --- OpenAPI Doc ---

describe('OpenAPI', () => {
  it('GET /api/doc returns OpenAPI spec', async () => {
    const res = await app.request('http://localhost/api/doc')
    expect(res.status).toBe(200)
    const spec = await res.json()
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.info.title).toBe('AgentForge API')
    expect(spec.paths['/api/projects']).toBeDefined()
    expect(spec.paths['/api/tasks']).toBeDefined()
    expect(spec.paths['/api/channels']).toBeDefined()
    expect(spec.paths['/api/messages']).toBeDefined()
    expect(spec.paths['/api/agent-status']).toBeDefined()
    expect(spec.paths['/api/sessions']).toBeDefined()
  })
})
