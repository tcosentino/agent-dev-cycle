import { spawn } from 'node:child_process'
import { readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import type { ApiCall } from './mock-api-server.js'

export function assertToolCalled(
  calls: string[],
  pattern: RegExp,
  message?: string
): void {
  const found = calls.some(call => pattern.test(call))
  if (!found) {
    const msg = message ?? `Expected to find tool call matching ${pattern}`
    const callList = calls.length > 0 ? calls.join('\n  ') : '(none)'
    throw new Error(`${msg}\nActual calls:\n  ${callList}`)
  }
}

export function assertTaskFetched(
  calls: string[],
  taskKey: string
): void {
  const pattern = new RegExp(`agentforge task (get|list).*${taskKey}`)
  assertToolCalled(calls, pattern, `Expected to find "agentforge task get/list ${taskKey}"`)
}

export function assertTaskUpdated(
  apiCalls: ApiCall[],
  taskId: string,
  updates: Record<string, unknown>
): void {
  const patchCalls = apiCalls.filter(
    c => c.method === 'PATCH' && c.path.includes(`/api/tasks/${taskId}`)
  )

  if (patchCalls.length === 0) {
    throw new Error(`Expected PATCH /api/tasks/${taskId} but found none`)
  }

  const lastPatch = patchCalls[patchCalls.length - 1]
  const body = lastPatch.body as Record<string, unknown>

  for (const [key, value] of Object.entries(updates)) {
    if (body[key] !== value) {
      throw new Error(
        `Expected task ${taskId} to have ${key}=${JSON.stringify(value)}, got ${JSON.stringify(body[key])}`
      )
    }
  }
}

async function runGitCommand(workspaceDir: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd: workspaceDir, stdio: ['ignore', 'pipe', 'pipe'] })
    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    proc.stdout.on('data', chunk => stdoutChunks.push(chunk))
    proc.stderr.on('data', chunk => stderrChunks.push(chunk))

    proc.on('close', code => {
      const stdout = Buffer.concat(stdoutChunks).toString().trim()
      const stderr = Buffer.concat(stderrChunks).toString().trim()

      if (code !== 0) {
        reject(new Error(`git ${args[0]} failed: ${stderr}`))
      } else {
        resolve(stdout)
      }
    })

    proc.on('error', reject)
  })
}

export async function assertCommitCreated(
  workspaceDir: string,
  messagePattern: RegExp
): Promise<string> {
  const log = await runGitCommand(workspaceDir, ['log', '-1', '--format=%H %s'])
  const [sha, ...messageParts] = log.split(' ')
  const message = messageParts.join(' ')

  if (!messagePattern.test(message)) {
    throw new Error(
      `Expected commit message to match ${messagePattern}, got: "${message}"`
    )
  }

  return sha
}

export async function assertFileContains(
  workspaceDir: string,
  filePath: string,
  content: string
): Promise<void> {
  const fullPath = join(workspaceDir, filePath)

  // Check file exists
  try {
    await access(fullPath)
  } catch {
    throw new Error(`Expected file ${filePath} to exist in ${workspaceDir}`)
  }

  // Read and check content
  const fileContent = await readFile(fullPath, 'utf-8')
  if (!fileContent.includes(content)) {
    throw new Error(
      `Expected ${filePath} to contain "${content}"\nActual content:\n${fileContent}`
    )
  }
}

export async function assertFileExists(
  workspaceDir: string,
  filePath: string
): Promise<void> {
  const fullPath = join(workspaceDir, filePath)
  try {
    await access(fullPath)
  } catch {
    throw new Error(`Expected file ${filePath} to exist in ${workspaceDir}`)
  }
}
