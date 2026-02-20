# Agent Task CLI - Design

## Architecture

### CLI Location
- **Package**: `runner/src/cli/`
- **Binary**: `/usr/local/bin/agentforge` (symlinked in Docker container)
- **Entry point**: `runner/src/cli/index.ts`

### Command Structure

```bash
agentforge task list [--status <status>] [--assignee <agent>]
agentforge task get <key>
agentforge task create "<title>" [--description <text>] [--type <type>] [--priority <priority>] [--assignee <agent>]
agentforge task update <key> [--status <status>] [--title <title>] [--description <text>] [--assignee <agent>] [--priority <priority>] [--type <type>]
agentforge task delete <key>
agentforge task comment list <key>
agentforge task comment add <key> "<comment text>"
agentforge task comment delete <comment-id>
```

## Implementation Details

### Key Resolution
Tasks use human-readable keys (e.g., `AF-12`) in the CLI but UUIDs in the REST API. The CLI includes a `findTaskByKey()` helper that:
1. Fetches all tasks for the project: `GET /api/tasks?projectId=...`
2. Finds the task with matching `key` field
3. Uses the task's UUID `id` for subsequent API calls

### Environment Variables
- `AGENTFORGE_SERVER_URL` - API server URL (set to `http://host.docker.internal:3000` for Docker)
- `AGENTFORGE_PROJECT_ID` - Current project UUID
- `AGENTFORGE_RUN_ID` - Current run/session ID
- `AGENTFORGE_SESSION_ID` - Current session UUID
- `AGENTFORGE_AGENT_ROLE` - Agent role (pm, engineer, qa, lead)

### Agent Context Integration
CLI documentation is automatically injected into every agent's context via `runner/src/context.ts`:

```markdown
## AgentForge CLI Tools

You have access to the `agentforge` CLI to manage project tasks...

### Task Management
[command examples]
```

### Comment Attribution
When agents create comments:
- `userId` field is **optional** (agents have no user UUID)
- `authorName` field is set to agent role (e.g., "pm", "engineer")
- DataObject schema updated to make `userId` optional and add `authorName` to createFields

### Transcript Parsing
The session Results tab parses agent transcript for CLI usage:
- Detects `agentforge task create/update/delete/comment` commands in Bash tool calls
- Extracts task keys, statuses, and content
- Displays as "AgentForge Actions" with meaningful labels:
  - Create: task title
  - Update: `AF-12 → done`
  - Comment: `AF-12: comment preview...`

## API Integration

### Endpoints Used
- `GET /api/tasks?projectId={id}` - List all project tasks
- `GET /api/tasks/{uuid}` - Get single task
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/{uuid}` - Update task
- `DELETE /api/tasks/{uuid}` - Delete task
- `GET /api/taskComments?taskId={uuid}` - List comments
- `POST /api/taskComments` - Create comment
- `DELETE /api/taskComments/{uuid}` - Delete comment

### Error Handling
- Task not found by key: throws error with message `Task not found: <key>`
- API errors: thrown with message `API request failed: <status> <response>`
- Missing env vars: throws `AGENTFORGE_SERVER_URL not set`, etc.

## Docker Container Integration

### Image Build
- Server startup (`packages/server/src/cli.ts`) builds `agentforge-runner:latest` if `RUNNER_MODE !== 'local'`
- Build runs `yarn build` in runner directory (compiles TypeScript)
- CLI binary installed via symlink: `/usr/local/bin/agentforge` → `/runner/dist/src/cli/index.js`

### Runtime Environment
- Session start route (`agent-session-integration/routes.ts`) passes env vars to Docker container
- Claude subprocess receives `AGENTFORGE_SESSION_ID` and `AGENTFORGE_AGENT_ROLE` for CLI access
- Git token now sourced from user's GitHub OAuth token (not `process.env.GIT_TOKEN`)

## Changes to Existing Systems

### Runner
- `runner/src/cli/commands/task.ts` - Complete rewrite with correct API endpoints
- `runner/src/cli/index.ts` - Added all task/comment commands and filtering
- `runner/src/cli/api.ts` - Added `agentRole` field
- `runner/src/claude.ts` - Pass `AGENTFORGE_SESSION_ID` and `AGENTFORGE_AGENT_ROLE` to Claude subprocess
- `runner/src/context.ts` - Inject CLI docs into agent context; fix TypeScript error (cast `config.id as AgentRole`)
- `runner/src/index.ts` - Remove invalid `maxTurns` log line
- `runner/package.json` - Remove unused `@agentforge/logger` dependency

### Server
- `packages/server/src/cli.ts` - Build runner Docker image at startup (if not local mode)

### Session Integration
- `src/services/agent-session-integration/routes.ts`:
  - Use `host.docker.internal` for Docker `serverUrl` instead of `localhost`
  - Retrieve user's GitHub token from DB and pass as `GIT_TOKEN` to container
  - Move `useDocker` declaration before `sessionConfig` (variable ordering fix)

### DataObjects
- `src/services/task-comment-dataobject/index.ts` - Make `userId` optional, add `authorName` to createFields
- `src/services/task-comment-dataobject/schema.ts` - Same changes for browser schema

### UI
- `src/services/agentforge-ui/components/AgentSessionPanel/AgentSessionProgressPanel.tsx`:
  - `parseTranscriptForActions()` - Parse `agentforge task` CLI commands from transcript
  - `getActionLabel()` - Display meaningful labels for task actions
