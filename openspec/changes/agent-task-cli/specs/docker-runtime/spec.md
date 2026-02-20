# Spec: Docker Runtime Environment for Agents

## Overview

Agent sessions run inside Docker containers with `agentforge-runner:latest` image. The runtime provides CLI tools, environment variables, and network access for agents to interact with the AgentForge API.

## Docker Image Build

### Build Trigger
- Server startup (`packages/server/src/cli.ts`) builds the image if `RUNNER_MODE !== 'local'`
- Runs synchronously before server accepts requests
- Build output streams to console
- Failures log warning but don't crash server

### Build Process
```bash
docker build -t agentforge-runner:latest /path/to/runner
```

**Dockerfile Steps** (from `runner/Dockerfile`):
1. Base image: `node:22-slim`
2. Install system deps: git, openssh-client
3. Install Claude Code CLI globally: `npm install -g @anthropic-ai/claude-code`
4. Create non-root user: `agent`
5. Set up workspace: `/workspace`
6. Copy runner source: `package.json`, `yarn.lock`, source files
7. Install deps: `corepack enable && yarn install --frozen-lockfile`
8. Build TypeScript: `yarn build` → outputs to `dist/`
9. Install CLI: symlink `/usr/local/bin/agentforge` → `/runner/dist/src/cli/index.js`
10. Switch to non-root user
11. Set entrypoint: `node /runner/dist/src/index.js`

### Build Caching
- Docker layer cache speeds up rebuilds
- Only changes to runner source trigger full rebuild
- Typical rebuild time: 5-10s with warm cache, 30-60s cold

## Container Launch

### Docker Run Command
```bash
docker run \
  --rm \
  --name agentforge-session-{sessionId} \
  -v {configPath}:/config/session.json:ro \
  -e ANTHROPIC_API_KEY={apiKey} \
  -e GIT_TOKEN={githubToken} \
  -e SESSION_CONFIG_PATH=/config/session.json \
  -e AGENTFORGE_SERVER_URL=http://host.docker.internal:3000 \
  -e AGENTFORGE_SESSION_ID={sessionId} \
  agentforge-runner:latest
```

### Environment Variables

**Claude Credentials** (from user's settings):
- `ANTHROPIC_API_KEY` - If user configured API key
- `CLAUDE_CODE_OAUTH_TOKEN` - If user configured subscription auth

**Git Credentials**:
- `GIT_TOKEN` - User's GitHub OAuth access token (from database)

**Session Config**:
- `SESSION_CONFIG_PATH` - Path to mounted session config JSON (`/config/session.json`)

**API Access**:
- `AGENTFORGE_SERVER_URL` - Server URL, set to `http://host.docker.internal:3000` for Docker
- `AGENTFORGE_SESSION_ID` - Current session UUID

**Claude Subprocess** (passed to Claude Code):
- `AGENTFORGE_PROJECT_ID` - Project UUID (set by runner, not container)
- `AGENTFORGE_RUN_ID` - Run/session ID (set by runner)
- `AGENTFORGE_AGENT_ROLE` - Agent role (pm, engineer, qa, lead)

### Volume Mounts
- **Session Config**: Host file → `/config/session.json` (read-only)
  - Contains: runId, projectId, agent, phase, repoUrl, branch, taskPrompt, serverUrl

### Network Configuration
- **Container → Host**: Uses `host.docker.internal` hostname
- **API Calls**: `http://host.docker.internal:3000/api/...`
- **Why**: `localhost` inside container refers to container itself, not host machine

## Session Config File

Location: `.data/runner-configs/session-{sessionId}.json`

**Contents**:
```json
{
  "runId": "pm-012",
  "projectId": "uuid-here",
  "agent": "pm",
  "phase": "shaping",
  "repoUrl": "https://github.com/user/repo",
  "branch": "main",
  "taskPrompt": "Build feature X",
  "serverUrl": "http://host.docker.internal:3000"
}
```

## GitHub Token Integration

### Token Source
- User's GitHub OAuth token from `users.githubAccessToken` field
- Retrieved during session start from user database record
- Same token used for GitHub OAuth login

### Token Usage
- Passed to container as `GIT_TOKEN` env var
- Runner uses it for git operations: clone, push, commit
- Format: `https://x-access-token:{token}@github.com/user/repo.git`

### Error Handling
- Missing token → session fails with `GITHUB_AUTH_ERROR`
- Invalid token → git clone fails with authentication error
- User must re-login to refresh token

## CLI Installation

### Binary Location
- **Container path**: `/usr/local/bin/agentforge`
- **Symlink target**: `/runner/dist/src/cli/index.js`
- **Executable**: chmod +x during build

### Usage from Claude
Claude Code can invoke CLI via bash:
```bash
agentforge task list
agentforge task create "New task"
```

Bash tool calls are recorded in transcript and visible in Results tab.

## Container Lifecycle

### Start
1. Routes spawn container with `spawn('docker', dockerArgs)`
2. Container runs entrypoint: `node /runner/dist/src/index.js`
3. Runner loads config from `/config/session.json`
4. Runner executes 8-stage pipeline

### Execution
1. Clone repo (using `GIT_TOKEN`)
2. Load agent config
3. Assemble context (includes CLI docs)
4. Run Claude Code with context
5. Capture transcript
6. Update session state
7. Commit changes
8. Push to repo

### Cleanup
- `--rm` flag auto-removes container on exit
- Exit code 0 → success
- Exit code 1 → failure
- Exit code 125 → Docker error (image not found, etc.)

## Local Mode (Development)

When `RUNNER_MODE=local`:
- No Docker container
- Runner executes via `tsx src/index.ts` directly
- All env vars passed directly to tsx process
- Workspace: `.data/workspaces/{sessionId}`
- Faster iteration, no build step needed

## Troubleshooting

### Image Not Found (Exit 125)
```bash
# Rebuild image manually
docker build -t agentforge-runner:latest runner/

# Or restart server to trigger auto-build
yarn dev
```

### Network Issues
- Verify `AGENTFORGE_SERVER_URL` uses `host.docker.internal` not `localhost`
- Check server is running on expected port (default 3000)

### Git Clone Failures
- Check user has valid GitHub token in database
- Verify token has repo access permissions
- User may need to re-login to refresh token

### Build Failures
- Check runner TypeScript compiles: `cd runner && yarn build`
- Check no missing dependencies in `runner/package.json`
- Verify Docker daemon is running
