import { describe, it, expect, beforeEach } from 'vitest'
import { createResourceTests, type TestData } from '@agentforge/dataobject/testing'
import { createTestServer, createTestContext } from './test-utils'

// Import dataobject definitions
import { projectResource } from '../../../src/services/project-dataobject'
import { taskResource } from '../../../src/services/task-dataobject'
import { channelResource } from '../../../src/services/channel-dataobject'
import { messageResource } from '../../../src/services/message-dataobject'
import { agentStatusResource } from '../../../src/services/agent-status-dataobject'
import { sessionResource } from '../../../src/services/session-dataobject'

// Fixed UUIDs for testing
const PROJECT_ID_1 = '00000000-0000-0000-0000-000000000001'
const PROJECT_ID_2 = '00000000-0000-0000-0000-000000000002'
const CHANNEL_ID_1 = '00000000-0000-0000-0000-000000000011'

// Create test server with all resources
const resources = [
  projectResource,
  taskResource,
  channelResource,
  messageResource,
  agentStatusResource,
  sessionResource,
]

const server = createTestServer(resources)
const ctx = createTestContext(server)

// Test data factories for each resource
const projectTestData: TestData<typeof projectResource.schema._type> = {
  create: (id) => ({
    name: `Project ${id ?? 'test'}`,
    key: `PJ${id?.replace(/-/g, '').slice(0, 4).toUpperCase() ?? 'TEST'}`,
  }),
  update: { name: 'Updated Project Name' },
}

const taskTestData: TestData<typeof taskResource.schema._type> = {
  create: (id) => ({
    projectId: PROJECT_ID_1,
    key: `T-${id ?? '1'}`,
    title: `Task ${id ?? 'test'}`,
    type: 'backend',
    priority: 'high',
    status: 'todo',
    assignee: 'engineer',
  }),
  update: { status: 'done' },
  prerequisites: [
    { resource: 'project', data: { id: PROJECT_ID_1, name: 'Test Project', key: 'TP' } },
  ],
}

const channelTestData: TestData<typeof channelResource.schema._type> = {
  create: (id) => ({
    projectId: PROJECT_ID_1,
    name: `channel-${id ?? 'test'}`,
  }),
  update: { name: 'renamed-channel' },
  prerequisites: [
    { resource: 'project', data: { id: PROJECT_ID_1, name: 'Test Project', key: 'TP' } },
  ],
}

const messageTestData: TestData<typeof messageResource.schema._type> = {
  create: (id) => ({
    projectId: PROJECT_ID_1,
    channelId: CHANNEL_ID_1,
    type: 'agent',
    sender: 'engineer',
    senderName: 'Engineer Agent',
    content: `Message ${id ?? 'test'}`,
  }),
  update: { content: 'Updated message content' },
  prerequisites: [
    { resource: 'project', data: { id: PROJECT_ID_1, name: 'Test Project', key: 'TP' } },
    { resource: 'channel', data: { id: CHANNEL_ID_1, projectId: PROJECT_ID_1, name: 'general' } },
  ],
}

const agentStatusTestData: TestData<typeof agentStatusResource.schema._type> = {
  create: (id) => ({
    projectId: PROJECT_ID_1,
    role: 'engineer',
    status: 'active',
  }),
  update: { status: 'away', currentTask: 'TF-3' },
  prerequisites: [
    { resource: 'project', data: { id: PROJECT_ID_1, name: 'Test Project', key: 'TP' } },
  ],
}

const sessionTestData: TestData<typeof sessionResource.schema._type> = {
  create: (id) => ({
    projectId: PROJECT_ID_1,
    runId: `run-${id ?? 'test'}`,
    agent: 'engineer',
    phase: 'building',
    startedAt: new Date().toISOString(),
  }),
  update: { summary: 'Completed work', phase: 'complete' },
  prerequisites: [
    { resource: 'project', data: { id: PROJECT_ID_1, name: 'Test Project', key: 'TP' } },
  ],
}

// Generate test suites for each resource
createResourceTests(projectResource, projectTestData, ctx, { describe, it, expect, beforeEach })
createResourceTests(taskResource, taskTestData, ctx, { describe, it, expect, beforeEach })
createResourceTests(channelResource, channelTestData, ctx, { describe, it, expect, beforeEach })
createResourceTests(messageResource, messageTestData, ctx, { describe, it, expect, beforeEach })
createResourceTests(agentStatusResource, agentStatusTestData, ctx, { describe, it, expect, beforeEach })
createResourceTests(sessionResource, sessionTestData, ctx, { describe, it, expect, beforeEach })

// Additional custom tests
describe('OpenAPI', () => {
  it('GET /api/doc returns OpenAPI spec', async () => {
    const res = await server.app.request('http://localhost/api/doc')
    expect(res.status).toBe(200)
    const spec = await res.json()
    expect(spec.openapi).toBe('3.1.0')
    expect(spec.paths['/api/projects']).toBeDefined()
    expect(spec.paths['/api/tasks']).toBeDefined()
    expect(spec.paths['/api/channels']).toBeDefined()
    expect(spec.paths['/api/messages']).toBeDefined()
    expect(spec.paths['/api/agentStatuses']).toBeDefined()
    expect(spec.paths['/api/sessions']).toBeDefined()
  })
})
