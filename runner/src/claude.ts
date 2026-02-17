import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import type { SessionConfig, ModelTier } from './types.js'
import { MODEL_MAP, WORKSPACE_PATH, DEFAULT_TIMEOUT_MS } from './types.js'
import { reportLog, reportProgress, reportClaudeOutput } from './progress.js'

export interface ClaudeResult {
  success: boolean
  output: string
  error?: string
  isolatedHome: string
}

function buildArgs(
  taskPrompt: string,
  contextPath: string,
  model: ModelTier
): string[] {
  return [
    '--print',
    taskPrompt,
    '--append-system-prompt-file',
    contextPath,
    '--output-format',
    'text',
    '--dangerously-skip-permissions',
    '--model',
    MODEL_MAP[model],
    '--verbose',
  ]
}

function createIsolatedHome(runId: string): string {
  const isolatedHome = join(tmpdir(), `agentforge-${runId}`)
  const claudeDir = join(isolatedHome, '.claude')
  mkdirSync(claudeDir, { recursive: true })
  // Skip interactive onboarding
  writeFileSync(
    join(isolatedHome, '.claude.json'),
    JSON.stringify({ hasCompletedOnboarding: true })
  )
  return isolatedHome
}

function buildEnvWithHome(
  config: SessionConfig,
  anthropicApiKey: string | undefined,
  isolatedHome: string
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: isolatedHome,
    AGENTFORGE_SERVER_URL: config.serverUrl || '',
    AGENTFORGE_PROJECT_ID: config.projectId,
    AGENTFORGE_RUN_ID: config.runId,
  }

  // Only set API key if provided (otherwise Claude Code uses subscription auth)
  if (anthropicApiKey) {
    env.ANTHROPIC_API_KEY = anthropicApiKey
  }

  return env
}

export async function runClaude(
  config: SessionConfig,
  contextPath: string,
  model: ModelTier,
  anthropicApiKey: string | undefined,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ClaudeResult> {
  const args = buildArgs(config.taskPrompt, contextPath, model)
  const isolatedHome = createIsolatedHome(config.runId)
  const env = buildEnvWithHome(config, anthropicApiKey, isolatedHome)

  return new Promise((resolve) => {
    const outputChunks: string[] = []
    const errorChunks: string[] = []
    let lastProgressReport = Date.now()
    let outputLineCount = 0

    console.log('Claude args:', args.join(' '))

    const proc = spawn('claude', args, {
      cwd: WORKSPACE_PATH,
      env,
      stdio: ['ignore', 'pipe', 'pipe'], // ignore stdin - Claude doesn't need input
    })

    // Report that Claude has started
    reportLog({ level: 'info', message: 'Claude Code process started, waiting for output...' }, 'executing')

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM')
      reportLog({ level: 'error', message: 'Claude Code process timed out' }, 'executing')
      resolve({
        success: false,
        output: outputChunks.join(''),
        error: 'Process timed out',
        isolatedHome,
      })
    }, timeoutMs)

    proc.stdout.on('data', (data: Buffer) => {
      const str = data.toString()
      process.stdout.write(str) // Stream output live
      outputChunks.push(str)

      // Stream actual Claude output to logs
      const lines = str.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) {
          reportClaudeOutput(trimmed).catch(err => {
            console.warn('Failed to report Claude output:', err)
          })
          outputLineCount++
        }
      }

      // Report progress periodically (every 5 seconds) to show activity
      const now = Date.now()
      if (now - lastProgressReport > 5000) {
        lastProgressReport = now
        // Calculate rough progress (30-75% during execution)
        const estimatedProgress = Math.min(75, 30 + Math.floor(outputLineCount / 10))
        reportProgress({ progress: estimatedProgress, currentStep: `Claude Code working...` })
      }
    })

    proc.stderr.on('data', (data: Buffer) => {
      const str = data.toString()
      process.stderr.write(str) // Stream errors live
      errorChunks.push(str)
      // Report stderr as warnings
      const trimmed = str.trim()
      if (trimmed) {
        reportLog({ level: 'warn', message: trimmed.slice(0, 500) }, 'executing')
      }
    })

    proc.on('close', (code) => {
      clearTimeout(timeout)

      if (code === 0) {
        reportLog({ level: 'info', message: `Claude Code completed successfully (${outputLineCount} lines output)` }, 'executing')
        resolve({
          success: true,
          output: outputChunks.join(''),
          isolatedHome,
        })
      } else {
        reportLog({ level: 'error', message: `Claude Code exited with code ${code}` }, 'executing')
        resolve({
          success: false,
          output: outputChunks.join(''),
          error: errorChunks.join('') || `Process exited with code ${code}`,
          isolatedHome,
        })
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reportLog({ level: 'error', message: `Failed to spawn Claude Code: ${err.message}` }, 'executing')
      resolve({
        success: false,
        output: outputChunks.join(''),
        error: err.message,
        isolatedHome,
      })
    })
  })
}

export function extractSummary(output: string): string {
  // Claude runs with --output-format text, so output is plain text / markdown.
  // Strip a leading "# Summary" (or "## Summary" etc.) header line if present.
  const trimmed = output.trim()
  const withoutHeader = trimmed.replace(/^#{1,6}\s+Summary\s*\n/, '').trim()
  return withoutHeader || 'Completed session'
}
