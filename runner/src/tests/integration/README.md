# Integration Test Suite

End-to-end integration tests for the AgentForge runner that validate the full agent session pipeline with real Claude API calls.

## Overview

These tests create a local git repository fixture, spawn the runner as a subprocess, execute real Claude API calls, and validate the results. Perfect for:

- **Regression testing:** Ensure the pipeline doesn't break after code changes
- **Prompt evaluation:** Compare agent behavior across prompt iterations
- **Infrastructure validation:** Verify tool availability and execution flow

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Vitest Test Process                                 │
│    └─ beforeAll: setup fixture repo + mock server   │
│    └─ test: spawn runner as child process           │
│    └─ afterAll: cleanup                             │
└──────────────────────┬──────────────────────────────┘
                       │ spawns
┌──────────────────────▼──────────────────────────────┐
│  Runner Process (tsx src/index.ts)                   │
│    └─ Clone fixture repo (local bare git)           │
│    └─ Spawn real `claude` CLI (ANTHROPIC_API_KEY)   │
│    └─ agentforge CLI available in PATH              │
│    └─ Commit changes to fixture repo                │
│    └─ Report progress to mock server                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP
┌──────────────────────▼──────────────────────────────┐
│  Mock API Server (node:http)                         │
│    └─ Records all API calls (tasks, progress, logs) │
│    └─ Returns fixture responses                     │
└─────────────────────────────────────────────────────┘
```

## Running Tests

```bash
cd runner

# Run integration tests (requires ANTHROPIC_API_KEY or ANTHROPIC_TOKEN in .env)
yarn test:integration

# Run only unit tests (no Claude API needed)
yarn test

# Watch mode for unit tests
yarn test:watch
```

## Configuration

Tests load credentials from `.env` in the **project root** (two levels up):

```bash
# /Users/you/Projects/agent-dev-cycle/.env
ANTHROPIC_TOKEN=sk-ant-...
# OR
ANTHROPIC_API_KEY=sk-ant-...
```

Tests automatically skip if no API key is found.

## Test Suite

### Test 1: Full Pipeline
Validates the complete cycle: clone → execute → commit

- Creates a local bare git repo with test project
- Asks Claude to modify README.md
- Verifies file was changed
- Confirms commit was created with correct format

### Test 2: CLI Environment
Verifies agentforge CLI is available to Claude during execution

- Asks Claude to run `agentforge task list`
- Validates runner completes successfully
- Infrastructure test - proves CLI is in PATH and accessible

**Note:** Claude's tool calling is non-deterministic - this test validates the environment is set up correctly, not that Claude will always use the CLI.

### Test 3: Artifact Capture
Ensures transcript and notepad are saved correctly

- Validates `sessions/engineer/{runId}/` directory exists
- Confirms session artifacts are captured
- Tests file structure compliance

## Evaluation Workflow

To compare agent behavior across prompt changes:

```bash
# Baseline run
yarn test:integration > baseline-output.txt

# Modify agent prompt in fixture-repo.ts

# Compare run
yarn test:integration > modified-output.txt

# Diff
diff baseline-output.txt modified-output.txt
```

Or programmatically save `apiServer.getCalls()` to JSON and compare tool call patterns.

## Fixture Repository

The test creates a minimal AgentForge project with:

```
.agentforge/
  agents/engineer/
    config.json       # model: sonnet, maxTokens: 10000
    prompt.md         # Simple task-focused prompt
  PROJECT.md          # Test project description
tasks.json            # Fixture task data for mock server
README.md             # Test file to modify
```

The agentforge CLI is made available to Claude via:
- Wrapper script at `runner/bin/agentforge` that executes CLI via tsx
- PATH updated in Claude's environment to include the bin directory

## Files

- `fixture-repo.ts` - Creates local bare git repo with test project
- `mock-api-server.ts` - HTTP server that records API calls
- `runner-harness.ts` - Spawns runner process and captures output
- `assertions.ts` - Helper assertions for common checks
- `runner.integration.test.ts` - Main test suite
- `../../../bin/agentforge` - Wrapper script for CLI execution

## Debugging

Enable verbose output:

```bash
yarn test:integration 2>&1 | tee test-output.log
```

Check workspace directories (temp dirs are cleaned up after tests):

```typescript
// In afterAll(), comment out cleanup to inspect workspaces:
// await rm(tempDir, { recursive: true, force: true })
```

## Known Limitations

- **Claude's tool calling is non-deterministic** - we can't force Claude to use specific bash commands or CLI tools, so Test 2 validates environment setup rather than guaranteed CLI usage
- **Tests require real API key** - can't run in CI without credentials
- **5-minute timeout per test** - Claude API latency varies
- **Uses Sonnet model** - requires access to `claude-sonnet-4-5-20250929`

## CI/CD Integration

Integration tests are **optional** in CI (require API key). Recommended approach:

```yaml
# GitHub Actions example
- name: Run unit tests
  run: cd runner && yarn test

- name: Run integration tests
  if: env.ANTHROPIC_TOKEN != ''
  env:
    ANTHROPIC_TOKEN: ${{ secrets.ANTHROPIC_TOKEN }}
  run: cd runner && yarn test:integration
```

This way, unit tests always run, but integration tests only run when the secret is configured.
