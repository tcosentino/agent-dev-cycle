import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import YAML from 'yaml'
import type { SessionConfig, ProjectProgress } from './types.js'
import { WORKSPACE_PATH } from './types.js'

const PROGRESS_PATH = 'state/progress.yaml'

export async function readProgress(): Promise<ProjectProgress | null> {
  try {
    const fullPath = join(WORKSPACE_PATH, PROGRESS_PATH)
    const content = await readFile(fullPath, 'utf-8')
    return YAML.parse(content) as ProjectProgress
  } catch {
    return null
  }
}

export async function updateProgress(config: SessionConfig): Promise<void> {
  const progress = await readProgress()
  if (!progress) {
    console.warn('No progress.yaml found, skipping state update')
    return
  }

  // Update last agent and timestamp
  progress.lastAgent = config.agent
  progress.lastRunAt = new Date().toISOString()

  // Update phase if it changed
  if (progress.phase !== config.phase) {
    progress.phase = config.phase

    // Update milestone status
    const milestone = progress.milestones.find((m) => m.id === config.phase)
    if (milestone && milestone.status === 'pending') {
      milestone.status = 'in-progress'
    }
  }

  const fullPath = join(WORKSPACE_PATH, PROGRESS_PATH)
  const yaml = YAML.stringify(progress)
  await writeFile(fullPath, yaml, 'utf-8')
}
