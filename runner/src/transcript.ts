import { readdir, copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { SessionConfig } from './types.js'
import { WORKSPACE_PATH } from './types.js'

async function findJsonlCreatedAfter(dir: string, afterMs: number): Promise<{ path: string; mtime: number } | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const jsonlFiles: Array<{ path: string; mtime: number }> = []

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        const fullPath = join(dir, entry.name)
        try {
          const { mtime } = await import('node:fs/promises').then((fs) =>
            fs.stat(fullPath)
          )
          const mtimeMs = mtime.getTime()
          if (mtimeMs >= afterMs) {
            jsonlFiles.push({ path: fullPath, mtime: mtimeMs })
          }
        } catch {
          // Skip files we can't stat
        }
      }
    }

    if (jsonlFiles.length === 0) return null

    // Sort by mtime descending and return most recent
    jsonlFiles.sort((a, b) => b.mtime - a.mtime)
    return jsonlFiles[0]
  } catch {
    return null
  }
}

async function findClaudeTranscript(isolatedHome: string, afterMs: number): Promise<string | null> {
  const claudeProjectsDir = join(isolatedHome, '.claude', 'projects')
  try {
    const entries = await readdir(claudeProjectsDir, { withFileTypes: true })

    // Find all project directories and look for JSONL files created after the run started
    const candidates: Array<{ path: string; mtime: number }> = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectDir = join(claudeProjectsDir, entry.name)
        const match = await findJsonlCreatedAfter(projectDir, afterMs)
        if (match) {
          candidates.push(match)
        }
      }
    }

    if (candidates.length === 0) return null

    // Return most recently modified transcript
    candidates.sort((a, b) => b.mtime - a.mtime)
    return candidates[0].path
  } catch {
    return null
  }
}

export async function captureTranscript(config: SessionConfig, startedAtMs: number, isolatedHome: string): Promise<boolean> {
  const transcriptPath = await findClaudeTranscript(isolatedHome, startedAtMs)
  if (!transcriptPath) {
    console.warn('No Claude Code transcript found')
    return false
  }

  // Create session directory
  const sessionDir = join(
    WORKSPACE_PATH,
    'sessions',
    config.agent,
    config.runId
  )
  await mkdir(sessionDir, { recursive: true })

  // Copy transcript to session directory
  const destPath = join(sessionDir, 'transcript.jsonl')
  await copyFile(transcriptPath, destPath)

  console.log(`Captured transcript to ${destPath}`)
  return true
}
