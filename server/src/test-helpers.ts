import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import * as schema from './schema'
import { db as defaultDb } from './db'

export function resetDb() {
  const tables = ['sessions', 'agent_status', 'messages', 'channels', 'tasks', 'projects']
  for (const table of tables) {
    defaultDb.run(sql.raw(`DELETE FROM ${table}`))
  }
}

export function seedProject(projectId = 'proj-test') {
  defaultDb.insert(schema.projects).values({
    id: projectId,
    name: 'Test Project',
    key: 'TP',
    repoUrl: 'https://example.com/test',
    createdAt: '2026-01-01T00:00:00Z',
  }).run()
  return projectId
}
