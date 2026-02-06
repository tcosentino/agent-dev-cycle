#!/usr/bin/env node
// Seed script to populate the server with sample data

const API_BASE = process.env.API_URL || 'http://localhost:3000'

// Generate deterministic UUIDs from string keys for consistency
function stringToUUID(str: string): string {
  // Create a simple hash and format as UUID
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `00000000-0000-4000-8000-${hex.padStart(12, '0')}`
}

// Map old IDs to new UUIDs
const idMap: Record<string, string> = {}

function mapId(oldId: string): string {
  if (!idMap[oldId]) {
    idMap[oldId] = stringToUUID(oldId)
  }
  return idMap[oldId]
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`GET ${path} failed: ${res.status} ${error}`)
  }
  return res.json()
}

async function post(path: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`POST ${path} failed: ${res.status} ${error}`)
  }
  return res.json()
}

async function seed() {
  console.log('Seeding database...\n')

  // Create projects
  console.log('Creating projects...')
  const projects = [
    { name: 'TaskFlow - Personal Task Manager', key: 'TF', repoUrl: 'https://github.com/tcosentino/agentforge-example-todo-app.git' },
    { name: 'ShoeVault Inventory System', key: 'SV', repoUrl: 'https://github.com/tcosentino/agentforge-example-shoe-inventory.git' },
    { name: 'AgentForge Platform', key: 'AF', repoUrl: 'https://github.com/tcosentino/agent-dev-cycle.git' },
  ]

  const createdProjects: Record<string, { id: string; name: string }> = {}
  for (const project of projects) {
    try {
      const created = await post('/api/projects', project)
      createdProjects[project.key] = created
      console.log(`  Created project: ${project.name} (${created.id})`)
    } catch (err) {
      // If project already exists, fetch it
      const existing = await get<Array<{ id: string; name: string; key: string }>>('/api/projects')
      const found = existing.find(p => p.key === project.key)
      if (found) {
        createdProjects[project.key] = found
        console.log(`  Using existing project: ${project.name} (${found.id})`)
      } else {
        console.log(`  Skipped project ${project.key}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  // Create channels for each project
  console.log('\nCreating channels...')
  for (const [key, project] of Object.entries(createdProjects)) {
    try {
      const channel = await post('/api/channels', {
        projectId: project.id,
        name: 'general',
        type: 'team',
      })
      console.log(`  Created channel: ${key}/general (${channel.id})`)
    } catch (err) {
      console.log(`  Skipped channel for ${key}: ${err instanceof Error ? err.message : err}`)
    }
  }

  // Create tasks for TaskFlow project
  const tfProject = createdProjects['TF']
  if (tfProject) {
    console.log('\nCreating TaskFlow tasks...')
    const tasks = [
      { key: 'TF-1', title: 'Set up project scaffold', description: 'Initialize Next.js 14 with App Router, TypeScript, Tailwind, Drizzle ORM', type: 'frontend', priority: 'high', status: 'done', assignee: 'engineer' },
      { key: 'TF-2', title: 'Create task database schema', description: 'Define tasks and users tables in Drizzle ORM with SQLite', type: 'backend', priority: 'high', status: 'done', assignee: 'engineer' },
      { key: 'TF-3', title: 'Implement task CRUD API routes', description: 'Server actions for create, read, update, delete tasks', type: 'api', priority: 'high', status: 'in-progress', assignee: 'engineer' },
      { key: 'TF-4', title: 'Build list view UI', description: 'Task list component with sorting, filtering, and status toggles', type: 'frontend', priority: 'high', status: 'todo', assignee: 'engineer' },
      { key: 'TF-5', title: 'Add email/password auth', description: 'Simple authentication with session cookies', type: 'backend', priority: 'medium', status: 'todo' },
      { key: 'TF-6', title: 'Build kanban board view', description: 'Drag-and-drop board view as stretch goal', type: 'frontend', priority: 'low', status: 'todo' },
    ]

    for (const task of tasks) {
      try {
        const created = await post('/api/tasks', { ...task, projectId: tfProject.id })
        console.log(`  Created task: ${task.key} - ${task.title}`)
      } catch (err) {
        console.log(`  Skipped task ${task.key}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  // Create tasks for ShoeVault project
  const svProject = createdProjects['SV']
  if (svProject) {
    console.log('\nCreating ShoeVault tasks...')
    const tasks = [
      { key: 'SV-1', title: 'Design inventory schema', description: 'Define product, warehouse, and stock tables', type: 'backend', priority: 'high', status: 'done', assignee: 'engineer' },
      { key: 'SV-2', title: 'Build product catalog API', description: 'REST endpoints for product CRUD operations', type: 'api', priority: 'high', status: 'done', assignee: 'engineer' },
      { key: 'SV-3', title: 'Implement stock tracking', description: 'Real-time stock level updates and alerts', type: 'backend', priority: 'high', status: 'in-progress', assignee: 'engineer' },
      { key: 'SV-4', title: 'Create dashboard UI', description: 'Overview dashboard with key metrics', type: 'frontend', priority: 'medium', status: 'todo' },
      { key: 'SV-5', title: 'Add barcode scanning', description: 'Mobile barcode scanning for inventory updates', type: 'frontend', priority: 'low', status: 'todo' },
    ]

    for (const task of tasks) {
      try {
        await post('/api/tasks', { ...task, projectId: svProject.id })
        console.log(`  Created task: ${task.key} - ${task.title}`)
      } catch (err) {
        console.log(`  Skipped task ${task.key}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  // Create tasks for AgentForge project
  const afProject = createdProjects['AF']
  if (afProject) {
    console.log('\nCreating AgentForge tasks...')
    const tasks = [
      { key: 'AF-1', title: 'Design agent orchestration system', description: 'Architecture for multi-agent coordination', type: 'backend', priority: 'critical', status: 'done', assignee: 'lead' },
      { key: 'AF-2', title: 'Implement dataobject framework', description: 'Generic CRUD with Zod schemas and OpenAPI', type: 'backend', priority: 'high', status: 'done', assignee: 'engineer' },
      { key: 'AF-3', title: 'Build project viewer UI', description: 'VS Code-like file and database browser', type: 'frontend', priority: 'high', status: 'in-progress', assignee: 'engineer' },
      { key: 'AF-4', title: 'Add deployment pipeline', description: 'Automated build and deploy for agent projects', type: 'devops', priority: 'high', status: 'todo' },
      { key: 'AF-5', title: 'Create testing harness', description: 'Generic test generation for dataobjects', type: 'testing', priority: 'medium', status: 'done', assignee: 'engineer' },
    ]

    for (const task of tasks) {
      try {
        await post('/api/tasks', { ...task, projectId: afProject.id })
        console.log(`  Created task: ${task.key} - ${task.title}`)
      } catch (err) {
        console.log(`  Skipped task ${task.key}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  // Create agent statuses for TaskFlow
  if (tfProject) {
    console.log('\nCreating agent statuses...')
    const now = new Date().toISOString()
    const agents = [
      { role: 'pm', status: 'away', lastActiveAt: now },
      { role: 'engineer', status: 'active', currentTask: 'TF-3', lastActiveAt: now },
      { role: 'qa', status: 'away', lastActiveAt: now },
      { role: 'lead', status: 'away', lastActiveAt: now },
    ]

    for (const agent of agents) {
      try {
        await post('/api/agentStatuses', { ...agent, projectId: tfProject.id })
        console.log(`  Created agent: ${agent.role} (${agent.status})`)
      } catch (err) {
        console.log(`  Skipped agent ${agent.role}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  console.log('\nSeeding complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
