# Agent Session Runner Integration Tests

End-to-end integration tests for the full agent session pipeline.

## What These Tests Do

The integration tests validate the complete runner workflow:

1. **Setup** — Create a local bare git repo with a minimal AgentForge project
2. **Run** — Spawn the runner process with a task prompt
3. **Execute** — Runner clones repo, runs real Claude Code CLI, makes changes
4. **Verify** — Assert on tool calls, git commits, file modifications, artifacts

## Architecture

```
Vitest Process
  ├─ Creates fixture repo (local bare git)
  ├─ Starts mock API server
  └─ Spawns runner subprocess
       ├─ Clones fixture repo
       ├─ Runs real `claude` CLI (ANTHROPIC_API_KEY required)
       ├─ Claude calls `agentforge` CLI tools
       ├─ Commits changes to repo
       └─ Reports progress to mock server
```

## Running Tests

### Prerequisites

- `ANTHROPIC_API_KEY` environment variable (tests skip gracefully if not set)
- `claude` CLI installed globally (`npm install -g @anthropic-ai/claude-code`)
- Git installed and configured

### Run Integration Tests

```bash
cd runner
export ANTHROPIC_API_KEY=sk-ant-...
yarn test:integration
```

**Expected duration:** 2-5 minutes (depends on Claude API latency)

### Run All Tests (Unit + Integration)

```bash
yarn test          # Unit tests only (fast, ~3s)
yarn test:integration  # Integration tests (slow, ~2-5min with API)
```

## Test Cases

### 1. Full Pipeline Test

**Task:** "Add a line 'Test: Integration' to README.md"

**Validates:**
- Runner completes all 8 stages (clone, load, execute, capture, commit)
- File is modified correctly
- Commit is created with proper message format
- Exit code is 0 (success)

### 2. Tool Call Validation

**Task:** "Work on task AF-1: update the README with the task title"

**Validates:**
- Claude calls `agentforge task get AF-1`
- API receives GET/PATCH requests to `/api/tasks`
- Tool usage matches expected patterns

### 3. Artifact Capture

**Task:** "Add a comment to README.md"

**Validates:**
- Session transcript (`.jsonl`) is captured
- Sessions directory structure is created
- Artifacts are in the correct location

## Evaluation Workflow

To compare agent behavior across prompt changes:

```bash
# Run with baseline prompt
ANTHROPIC_API_KEY=... yarn test:integration > baseline.txt

# Edit fixture repo's agent prompt (see fixture-repo.ts)
# Or modify the task prompt in the test file

# Run again
ANTHROPIC_API_KEY=... yarn test:integration > modified.txt

# Compare
diff baseline.txt modified.txt
```

Or programmatically — save `apiServer.getCalls()` to JSON and compare tool sequences.

## Cost Considerations

Each integration test run costs ~$0.01-0.05 depending on:
- Model used (Haiku is cheapest, configured in fixture)
- Task complexity
- Number of tests

**Tip:** Use Haiku for integration tests (fast + cheap). The fixture repo is configured to use Haiku by default.

## Fixture Repo Structure

The test creates a minimal project:

```
.agentforge/
  agents/engineer/
    config.json      # model: haiku, maxTokens: 10000
    prompt.md        # Simple task-focused instructions
  PROJECT.md         # Test project description
tasks.json           # Fixture task data (for mock server)
README.md            # Target file for tests
```

## Mock API Server

The server records all runner → server HTTP calls:

- **Progress updates:** `PATCH /api/agentSessions/:id/progress`
- **Logs:** `POST /api/agentSessions/:id/logs`
- **Tasks:** `GET/POST/PATCH /api/tasks`
- **Comments:** `GET/POST/DELETE /api/taskComments`
- **Messages:** `POST /api/projects/:id/messages`

Use `apiServer.getCalls()` in assertions to verify the runner made the right API calls.

## Troubleshooting

### Tests skip with "ANTHROPIC_API_KEY not set"

Set the environment variable:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### "claude: command not found"

Install Claude Code CLI:
```bash
npm install -g @anthropic-ai/claude-code
```

### Tests timeout after 5 minutes

Claude API calls can be slow. Increase timeout in test:
```typescript
await runSession({
  // ...
  timeoutMs: 600000, // 10 minutes
})
```

### Git errors during fixture setup

Ensure git is installed and configured:
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## File Structure

| File | Purpose |
|------|---------|
| `fixture-repo.ts` | Creates local bare git repo with test project |
| `mock-api-server.ts` | HTTP server that records API calls |
| `runner-harness.ts` | Spawns runner process, waits for completion |
| `assertions.ts` | Helper assertions for tool calls, commits, files |
| `runner.integration.test.ts` | Test cases |

## Extending Tests

To add a new test case:

```typescript
it('validates new behavior', async () => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return  // Skip if no key

  const result = await runSession({
    fixtureRepoPath,
    taskPrompt: 'Your task here',
    apiServerUrl: apiServer.url,
    anthropicApiKey: apiKey,
  })

  expect(result.success).toBe(true)
  // Your assertions here
}, 300000)  // 5-minute timeout
```

## CI/CD Integration

Integration tests are **optional** in CI (require API key). Recommended approach:

```yaml
# GitHub Actions example
- name: Run unit tests
  run: cd runner && yarn test

- name: Run integration tests
  if: env.ANTHROPIC_API_KEY != ''
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: cd runner && yarn test:integration
```

This way, unit tests always run, but integration tests only run when the secret is configured.
