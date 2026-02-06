import { readdir, copyFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { SessionConfig } from './types.js'
import { WORKSPACE_PATH } from './types.js'

// Claude Code stores transcripts in ~/.claude/projects/<hash>/
const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects')

async function findMostRecentJsonl(dir: string): Promise<string | null> {
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
          jsonlFiles.push({ path: fullPath, mtime: mtime.getTime() })
        } catch {
          // Skip files we can't stat
        }
      }
    }

    if (jsonlFiles.length === 0) return null

    // Sort by mtime descending and return most recent
    jsonlFiles.sort((a, b) => b.mtime - a.mtime)
    return jsonlFiles[0].path
  } catch {
    return null
  }
}

async function findClaudeTranscript(): Promise<string | null> {
  try {
    const entries = await readdir(CLAUDE_PROJECTS_DIR, { withFileTypes: true })

    // Find all project directories and look for most recent JSONL
    const candidates: Array<{ path: string; mtime: number }> = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectDir = join(CLAUDE_PROJECTS_DIR, entry.name)
        const jsonlPath = await findMostRecentJsonl(projectDir)
        if (jsonlPath) {
          const { mtime } = await import('node:fs/promises').then((fs) =>
            fs.stat(jsonlPath)
          )
          candidates.push({ path: jsonlPath, mtime: mtime.getTime() })
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

export async function captureTranscript(config: SessionConfig): Promise<boolean> {
  const transcriptPath = await findClaudeTranscript()
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
