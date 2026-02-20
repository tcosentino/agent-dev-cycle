import { spawn } from 'node:child_process'
import { writeFile, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const RUNNER_ROOT = resolve(fileURLToPath(import.meta.url), '../../../../')

export interface RunResult {
  success: boolean
  exitCode: number
  stdout: string
  stderr: string
  duration: number
  workspaceDir: string
}

export async function runSession(config: {
  fixtureRepoPath: string
  taskPrompt: string
  apiServerUrl: string
  anthropicApiKey: string
  gitToken?: string
  timeoutMs?: number
}): Promise<RunResult> {
  const startTime = Date.now()
  const timeoutMs = config.timeoutMs ?? 300000 // 5 minutes default

  // Create temp workspace dir
  const workspaceDir = await mkdtemp(join(tmpdir(), 'runner-workspace-'))

  // Write session config JSON
  const sessionConfigPath = join(workspaceDir, 'session.json')
  const sessionConfig = {
    runId: `test-${Date.now()}`,
    projectId: 'test-project',
    agent: 'engineer',
    phase: 'building',
    repoUrl: config.fixtureRepoPath,
    branch: 'main',
    taskPrompt: config.taskPrompt,
    serverUrl: config.apiServerUrl,
  }
  await writeFile(sessionConfigPath, JSON.stringify(sessionConfig, null, 2))

  // Spawn runner
  const tsxPath = join(RUNNER_ROOT, 'node_modules', '.bin', 'tsx')
  const runnerEntryPoint = join(RUNNER_ROOT, 'src', 'index.ts')

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    SESSION_CONFIG_PATH: sessionConfigPath,
    AGENTFORGE_SERVER_URL: config.apiServerUrl,
    AGENTFORGE_SESSION_ID: sessionConfig.runId,
    AGENTFORGE_PROJECT_ID: sessionConfig.projectId,
    AGENTFORGE_RUN_ID: sessionConfig.runId,
    AGENTFORGE_AGENT_ROLE: 'engineer',
    WORKSPACE_PATH: join(workspaceDir, 'repo'),
    // Pass token as ANTHROPIC_API_KEY (runner reads this, not ANTHROPIC_TOKEN)
    ANTHROPIC_API_KEY: config.anthropicApiKey,
    // Unset CLAUDECODE to allow nested Claude Code sessions in tests
    CLAUDECODE: undefined,
  }

  if (config.gitToken) {
    env.GIT_TOKEN = config.gitToken
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(tsxPath, [runnerEntryPoint], {
      cwd: RUNNER_ROOT,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    proc.stdout.on('data', chunk => stdoutChunks.push(chunk))
    proc.stderr.on('data', chunk => stderrChunks.push(chunk))

    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error(`Runner timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    proc.on('close', code => {
      clearTimeout(timer)
      const duration = Date.now() - startTime
      const exitCode = code ?? 1
      const stdout = Buffer.concat(stdoutChunks).toString()
      const stderr = Buffer.concat(stderrChunks).toString()

      resolve({
        success: exitCode === 0,
        exitCode,
        stdout,
        stderr,
        duration,
        workspaceDir: join(workspaceDir, 'repo'),
      })
    })

    proc.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })
  })
}
