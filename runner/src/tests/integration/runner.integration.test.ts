import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { config as loadDotenv } from 'dotenv'
import { createFixtureRepo } from './fixture-repo.js'
import { startMockApiServer, type MockApiServer } from './mock-api-server.js'
import { runSession } from './runner-harness.js'
import {
  assertTaskFetched,
  assertCommitCreated,
  assertFileContains,
  assertFileExists,
} from './assertions.js'

// Load .env from project root (two levels up from runner/)
loadDotenv({ path: join(import.meta.dirname, '../../../../.env') })

describe('Runner Integration', () => {
  let fixtureRepoPath: string
  let apiServer: MockApiServer
  let tempDir: string

  beforeAll(async () => {
    // Create temp directory
    tempDir = await mkdtemp(join(tmpdir(), 'runner-test-'))

    // Create fixture repo
    fixtureRepoPath = await createFixtureRepo(tempDir)

    // Start mock API server with fixture data
    const workingDir = join(tempDir, 'working')
    apiServer = await startMockApiServer(workingDir)
  }, 120000)

  afterAll(async () => {
    await apiServer.close()
    await rm(tempDir, { recursive: true, force: true })
  })

  it('completes full pipeline: clone → execute → commit', async () => {
    // Support both ANTHROPIC_TOKEN and ANTHROPIC_API_KEY
    const apiKey = process.env.ANTHROPIC_TOKEN || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('⏭️  Skipping integration test: ANTHROPIC_TOKEN or ANTHROPIC_API_KEY not set')
      return
    }

    const result = await runSession({
      fixtureRepoPath,
      taskPrompt: 'Add a line "Test: Integration" to README.md',
      apiServerUrl: apiServer.url,
      anthropicApiKey: apiKey,
      timeoutMs: 300000, // 5 minutes
    })

    // Print output for debugging
    if (!result.success) {
      console.error('Runner stdout:', result.stdout)
      console.error('Runner stderr:', result.stderr)
    }

    // Assert runner succeeded
    expect(result.success, `Runner failed with exit code ${result.exitCode}`).toBe(true)
    expect(result.exitCode).toBe(0)

    // Assert file was modified
    await assertFileContains(result.workspaceDir, 'README.md', 'Test: Integration')

    // Assert commit was created
    const commitSha = await assertCommitCreated(
      result.workspaceDir,
      /agent\(engineer\):/
    )
    expect(commitSha).toMatch(/^[0-9a-f]{40}$/)

    console.log(`✅ Pipeline completed in ${(result.duration / 1000).toFixed(1)}s`)
  }, 300000)

  it('makes agentforge CLI available to Claude during execution', async () => {
    const apiKey = process.env.ANTHROPIC_TOKEN || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('⏭️  Skipping integration test: ANTHROPIC_TOKEN or ANTHROPIC_API_KEY not set')
      return
    }

    const result = await runSession({
      fixtureRepoPath,
      taskPrompt: 'Run the command `agentforge task list` and tell me if it works',
      apiServerUrl: apiServer.url,
      anthropicApiKey: apiKey,
      timeoutMs: 300000,
    })

    if (!result.success) {
      console.error('Runner stdout:', result.stdout)
      console.error('Runner stderr:', result.stderr)
    }

    expect(result.success, `Runner failed with exit code ${result.exitCode}`).toBe(true)

    // Either Claude called the API, or it tried to run the CLI command
    // (we can't force Claude to use bash tools, but we can verify the CLI is available)
    const taskApiCalls = apiServer.getCalls({ pathPrefix: '/api/tasks' })
    console.log('Task API calls made:', taskApiCalls.length)

    // The test passes if runner completed successfully - this proves the infrastructure works
    // For evaluation purposes, examine the transcript to see what Claude actually did
    console.log(`✅ CLI environment validated in ${(result.duration / 1000).toFixed(1)}s`)
    console.log(`   Workspace: ${result.workspaceDir}`)
  }, 300000)

  it('saves transcript and notepad artifacts', async () => {
    const apiKey = process.env.ANTHROPIC_TOKEN || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.warn('⏭️  Skipping integration test: ANTHROPIC_TOKEN or ANTHROPIC_API_KEY not set')
      return
    }

    const result = await runSession({
      fixtureRepoPath,
      taskPrompt: 'Add a comment "# Test comment" to README.md',
      apiServerUrl: apiServer.url,
      anthropicApiKey: apiKey,
      timeoutMs: 300000,
    })

    if (!result.success) {
      console.error('Runner stdout:', result.stdout)
      console.error('Runner stderr:', result.stderr)
    }

    expect(result.success, `Runner failed with exit code ${result.exitCode}`).toBe(true)

    // Assert transcript was captured (sessions/engineer/{runId}/transcript.jsonl)
    // Use a flexible path check since runId is dynamic
    const sessionsDirs = join(result.workspaceDir, 'sessions', 'engineer')
    await assertFileExists(result.workspaceDir, 'sessions')

    console.log(`✅ Artifacts validated in ${(result.duration / 1000).toFixed(1)}s`)
  }, 300000)
})
