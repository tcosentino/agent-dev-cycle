import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

async function runGit(args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    const stderrChunks: Buffer[] = []

    proc.stderr.on('data', chunk => stderrChunks.push(chunk))

    proc.on('close', code => {
      if (code !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString()
        reject(new Error(`git ${args[0]} failed (exit ${code}): ${stderr}`))
      } else {
        resolve()
      }
    })

    proc.on('error', reject)
  })
}

export async function createFixtureRepo(tempDir: string): Promise<string> {
  const bareRepoPath = join(tempDir, 'fixture.git')
  const workingPath = join(tempDir, 'working')

  // 1. Create bare repo
  await mkdir(bareRepoPath, { recursive: true })
  await runGit(['init', '--bare', '--initial-branch=main'], bareRepoPath)

  // 2. Clone bare repo to working directory
  await runGit(['clone', bareRepoPath, workingPath], tempDir)

  // 3. Create project structure
  const agentDir = join(workingPath, '.agentforge', 'agents', 'engineer')
  await mkdir(agentDir, { recursive: true })

  // Agent config - use sonnet (more widely available)
  await writeFile(
    join(agentDir, 'config.json'),
    JSON.stringify(
      {
        id: 'engineer',
        model: 'sonnet',
        maxTokens: 10000,
      },
      null,
      2
    )
  )

  // Agent prompt
  await writeFile(
    join(agentDir, 'prompt.md'),
    `# Engineer Agent

You are a focused engineer working on a test project.

When given a task:
1. Use \`agentforge task get <key>\` to fetch task details
2. Implement the requested change
3. Use \`agentforge task update <key> --status done\` when complete

Keep changes minimal and deterministic.
`
  )

  // PROJECT.md
  await writeFile(
    join(workingPath, '.agentforge', 'PROJECT.md'),
    `# Test Project

A minimal project for integration testing the AgentForge runner.

## Purpose

This project exists solely to test that the runner pipeline works correctly:
- Clones the repo
- Loads agent config
- Executes Claude Code with task prompt
- Makes requested changes
- Commits and pushes

## Test Tasks

Test tasks are defined in the mock API server, not in this repo.
`
  )

  // tasks.json (fixture data for mock server to return)
  await writeFile(
    join(workingPath, 'tasks.json'),
    JSON.stringify(
      [
        {
          id: 'task-1',
          key: 'AF-1',
          title: 'Update README with test marker',
          description: 'Add a line to README.md to verify the agent made changes',
          status: 'todo',
          priority: 'high',
        },
        {
          id: 'task-2',
          key: 'AF-2',
          title: 'Create hello.txt',
          description: 'Create a new file hello.txt with the content "Hello from AgentForge"',
          status: 'todo',
          priority: 'medium',
        },
      ],
      null,
      2
    )
  )

  // README.md
  await writeFile(
    join(workingPath, 'README.md'),
    `# AgentForge Integration Test Fixture

This is a minimal test project for validating the agent session runner.

Do not modify this file manually - agents will modify it during tests.
`
  )

  // 4. Configure git user
  await runGit(['config', 'user.name', 'Test Runner'], workingPath)
  await runGit(['config', 'user.email', 'test@agentforge.dev'], workingPath)

  // 5. Commit initial structure
  await runGit(['add', '-A'], workingPath)
  await runGit(['commit', '-m', 'Initial fixture'], workingPath)

  // 6. Push to bare repo
  await runGit(['push', 'origin', 'main'], workingPath)

  // Return bare repo path (for cloning in tests)
  return bareRepoPath
}
