# Agent Runner

The Agent Runner is the execution engine that runs AgentForge agents in isolated Docker containers. It handles the complete lifecycle of an agent run: loading configuration, cloning the project repository, assembling context, executing Claude Code, capturing transcripts, and committing results.

## Quick Start

```bash
# First time: login to Claude (creates ~/.claude/.credentials.json)
cd runner && ./scripts/dev.sh --login

# Run an agent in Docker (sandboxed)
cd runner && ./scripts/dev.sh --docker

# Or run locally without Docker (uses your shell environment)
cd runner && ./scripts/dev.sh
```

## Architecture

```
                                   ┌─────────────────────────────┐
                                   │      Session Config         │
                                   │   (session.local.json)      │
                                   └──────────────┬──────────────┘
                                                  │
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Docker Container                                    │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │  Git Clone  │───▶│  Load Agent │───▶│  Assemble   │───▶│ Claude Code │   │
│  │   (repo)    │    │   Config    │    │   Context   │    │    CLI      │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘   │
│                                                                   │          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │          │
│  │  Git Push   │◀───│   Commit    │◀───│  Capture    │◀──────────┘          │
│  │  (results)  │    │   Changes   │    │  Transcript │                      │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Session Configuration

Agent runs are defined by a JSON configuration file:

```json
{
  "runId": "run-001",
  "projectId": "shoe-inventory",
  "agent": "engineer",
  "phase": "building",
  "repoUrl": "https://github.com/your-org/your-project.git",
  "branch": "main",
  "taskPrompt": "Review the codebase and implement the stock transfer feature",
  "assignedTasks": ["ST-5", "ST-6"],
  "serverUrl": "http://localhost:3001"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `runId` | Yes | Unique identifier for this run |
| `projectId` | Yes | Project identifier |
| `agent` | Yes | Agent role: `pm`, `engineer`, `qa`, or `lead` |
| `phase` | Yes | Project phase: `discovery`, `shaping`, `building`, or `delivery` |
| `repoUrl` | Yes | Git repository URL (HTTPS or SSH) |
| `branch` | No | Branch to clone (default: `main`) |
| `taskPrompt` | Yes | The task for the agent to complete |
| `assignedTasks` | No | List of task IDs assigned to this run |
| `serverUrl` | No | AgentForge server URL for callbacks |

## Context Assembly

The runner assembles context for Claude Code from files in the project repository:

```
/workspace
├── prompts/
│   └── {agent}.md          # Agent-specific system prompt
├── agents.yaml             # Agent configurations (model, maxTokens)
├── PROJECT.md              # Project overview
├── ARCHITECTURE.md         # Technical architecture
├── state/
│   └── progress.yaml       # Current phase, milestones, next actions
└── memory/
    └── daily-log.md        # Recent daily log entries
```

The assembled context is passed to Claude Code via `--append-system-prompt-file`.

### Agent Configuration (agents.yaml)

```yaml
pm:
  model: sonnet
  maxTokens: 32000

engineer:
  model: sonnet
  maxTokens: 64000

qa:
  model: haiku
  maxTokens: 32000

lead:
  model: opus
  maxTokens: 64000
  orchestrator: true
```

Model tiers map to actual Claude models:
- `opus` → `claude-opus-4-5-20251101`
- `sonnet` → `claude-sonnet-4-20250514`
- `haiku` → `claude-haiku-4-20250414`

## Authentication

### Claude Subscription Auth

The runner uses your Claude subscription (Pro/Max) for authentication, not API credits. On first run, authenticate inside Docker:

```bash
./scripts/dev.sh --login
```

This saves credentials to `~/.claude/.credentials.json`, which is mounted into the container on subsequent runs.

### GitHub Auth

The runner uses your `gh` CLI token for Git operations. Ensure you're authenticated:

```bash
gh auth status
```

The token is automatically extracted and passed to the container.

## Dev Script Options

```bash
./scripts/dev.sh [options] [session-config.json]

Options:
  --docker    Run in Docker container (sandboxed, recommended)
  --build     Force rebuild the Docker image
  --login     Interactive login to Claude (run once)

Examples:
  ./scripts/dev.sh --docker                    # Use session.local.json in Docker
  ./scripts/dev.sh --docker my-session.json   # Use custom config
  ./scripts/dev.sh                             # Run locally (no Docker)
```

## AgentForge CLI

Agents can interact with the AgentForge server during execution using the `agentforge` CLI:

```bash
# Get assigned tasks
agentforge task list

# Update task status
agentforge task update ST-5 --status in-progress

# Post a chat message
agentforge chat post "Starting work on the transfer feature"

# Set agent status
agentforge status set working
```

Environment variables (set automatically by the runner):
- `AGENTFORGE_SERVER_URL` - Server base URL
- `AGENTFORGE_PROJECT_ID` - Current project ID
- `AGENTFORGE_RUN_ID` - Current run ID

## Transcript Capture

After Claude Code completes, the runner captures the session transcript from:

```
~/.claude/projects/{workspace-hash}/{session-id}.jsonl
```

This JSONL file contains every message, tool call, and result from the session. It's copied to the project repository at:

```
sessions/{agent}/{runId}/transcript.jsonl
```

## Output

A successful run produces:

```json
{
  "success": true,
  "runId": "run-001",
  "agent": "engineer",
  "startedAt": "2026-02-06T02:16:12.737Z",
  "completedAt": "2026-02-06T02:17:38.413Z",
  "summary": "Completed session",
  "commitSha": "e7295dd0ecf2341f2b5653ed045d0a51b0e4df3a"
}
```

All changes made by the agent are committed and pushed to the repository.

## Directory Structure

```
runner/
├── scripts/
│   ├── dev.sh                 # Development runner script
│   └── setup-example-repos.sh # Set up example project repos
├── src/
│   ├── index.ts              # Main entrypoint
│   ├── types.ts              # Type definitions and constants
│   ├── config.ts             # Configuration loading
│   ├── git.ts                # Git operations (clone, commit, push)
│   ├── context.ts            # Context assembly
│   ├── claude.ts             # Claude Code CLI execution
│   ├── transcript.ts         # Transcript capture
│   ├── state.ts              # State file updates
│   └── cli/                  # AgentForge CLI
│       ├── index.ts          # CLI entrypoint
│       ├── api.ts            # HTTP client
│       └── commands/         # CLI commands
│           ├── task.ts
│           ├── chat.ts
│           └── status.ts
├── Dockerfile                # Container image definition
├── session.local.json        # Local development session config
└── example-session.json      # Example session config
```

## Docker Container

The runner container includes:

- Node.js 22
- Git and SSH client
- Claude Code CLI (`@anthropic-ai/claude-code`)
- AgentForge CLI (`agentforge`)
- Non-root `agent` user (required for `--dangerously-skip-permissions`)

Build manually:
```bash
cd runner && docker build -t agentforge-runner:dev .
```

## Troubleshooting

### "No Claude credentials found"

Run `./scripts/dev.sh --login` to authenticate.

### "Permission denied (publickey)"

Your GitHub token may be missing. Check `gh auth status` and ensure you're authenticated.

### Claude Code stuck / 0% CPU

This was caused by stdin being piped. The fix is in `claude.ts`:
```typescript
stdio: ['ignore', 'pipe', 'pipe']  // ignore stdin
```

### Rate limiting

Claude subscription has usage limits. The runner respects rate limits automatically, but heavy usage may require waiting.

## Future Enhancements

- [ ] Parallel agent execution
- [ ] Agent handoff protocols (phase transitions)
- [ ] Semantic memory search across sessions
- [ ] Real-time progress streaming to server
- [ ] Automatic retry on transient failures
- [ ] Cost tracking per run
