import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUNNER_ROOT = resolve(fileURLToPath(import.meta.url), '../../../')
const CLI_PATH = resolve(RUNNER_ROOT, 'src/cli/index.ts')

export interface CliEnv {
  serverUrl: string
  projectId: string
  runId: string
  sessionId?: string
  agentRole?: string
}

export interface CliResult {
  exitCode: number
  stdout: string
  stderr: string
}

export function runCli(
  args: string[],
  env: CliEnv,
  timeoutMs = 10000
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      AGENTFORGE_SERVER_URL: env.serverUrl,
      AGENTFORGE_PROJECT_ID: env.projectId,
      AGENTFORGE_RUN_ID: env.runId,
    }
    if (env.sessionId) childEnv.AGENTFORGE_SESSION_ID = env.sessionId
    if (env.agentRole) childEnv.AGENTFORGE_AGENT_ROLE = env.agentRole

    const child = spawn(
      process.execPath,
      ['--import', 'tsx/esm', CLI_PATH, ...args],
      {
        env: childEnv,
        cwd: RUNNER_ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    child.stdout.on('data', chunk => stdoutChunks.push(chunk))
    child.stderr.on('data', chunk => stderrChunks.push(chunk))

    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`CLI timed out after ${timeoutMs}ms: agentforge ${args.join(' ')}`))
    }, timeoutMs)

    child.on('close', code => {
      clearTimeout(timer)
      resolve({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdoutChunks).toString(),
        stderr: Buffer.concat(stderrChunks).toString(),
      })
    })

    child.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })
  })
}
