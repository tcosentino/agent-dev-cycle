import { spawn } from 'node:child_process'
import type { SessionConfig, ModelTier } from './types.js'
import { MODEL_MAP, WORKSPACE_PATH, DEFAULT_TIMEOUT_MS } from './types.js'
import { reportLog, reportProgress } from './progress.js'

export interface ClaudeResult {
  success: boolean
  output: string
  error?: string
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
    '--no-session-persistence',
  ]
}

function buildEnv(
  config: SessionConfig,
  anthropicApiKey: string | undefined
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
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
  const env = buildEnv(config, anthropicApiKey)

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
      })
    }, timeoutMs)

    proc.stdout.on('data', (data: Buffer) => {
      const str = data.toString()
      process.stdout.write(str) // Stream output live
      outputChunks.push(str)
      outputLineCount += str.split('\n').length

      // Report progress periodically (every 5 seconds) to show activity
      const now = Date.now()
      if (now - lastProgressReport > 5000) {
        lastProgressReport = now
        // Calculate rough progress (30-75% during execution)
        const estimatedProgress = Math.min(75, 30 + Math.floor(outputLineCount / 10))
        reportProgress({ progress: estimatedProgress, currentStep: `Claude Code working... (${outputLineCount} lines output)` })
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
        })
      } else {
        reportLog({ level: 'error', message: `Claude Code exited with code ${code}` }, 'executing')
        resolve({
          success: false,
          output: outputChunks.join(''),
          error: errorChunks.join('') || `Process exited with code ${code}`,
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
      })
    })
  })
}

export function extractSummary(output: string): string {
  // Try to extract a summary from the stream-json output
  // Look for the final result message
  const lines = output.trim().split('\n')

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const event = JSON.parse(lines[i])
      if (event.result) {
        // Extract first sentence or first 100 chars
        const text = event.result as string
        const firstSentence = text.split(/[.!?]/)[0]
        return firstSentence.slice(0, 100).trim() || 'Completed session'
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  return 'Completed session'
}
