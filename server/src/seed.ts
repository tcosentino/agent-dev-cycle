import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { db } from './db'
import { projects, tasks, channels, messages, agentStatus, sessions } from './schema'
import type { DbSnapshot } from './types'

const snapshotPaths = [
  resolve(import.meta.dirname!, '../../example-projects/todo-app/.agentforge/db-snapshot.json'),
  resolve(import.meta.dirname!, '../../example-projects/shoe-inventory/.agentforge/db-snapshot.json'),
]

console.log('Seeding database...')

for (const path of snapshotPaths) {
  const raw = readFileSync(path, 'utf-8')
  const snapshot: DbSnapshot = JSON.parse(raw)

  db.insert(projects).values(snapshot.projects).run()
  db.insert(tasks).values(snapshot.tasks).run()
  db.insert(channels).values(snapshot.channels).run()
  db.insert(messages).values(snapshot.messages).run()
  db.insert(agentStatus).values(snapshot.agentStatus).run()
  db.insert(sessions).values(snapshot.sessions).run()

  console.log(`  Seeded from ${path}`)
}

console.log('Done.')
