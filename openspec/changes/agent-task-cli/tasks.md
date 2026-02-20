# Agent Task CLI - Implementation Tasks

## Status: ✅ Complete

All tasks have been implemented and the feature is functional.

## Completed Tasks

### 1. CLI Implementation ✅
- [x] Rewrite `runner/src/cli/commands/task.ts` with correct API endpoints
- [x] Add `findTaskByKey()` helper for key→UUID resolution
- [x] Implement all task commands (list, get, create, update, delete)
- [x] Implement all comment commands (list, add, delete)
- [x] Add filtering to task list (--status, --assignee)
- [x] Update `runner/src/cli/index.ts` with full command parsing

### 2. Agent Context Integration ✅
- [x] Add CLI documentation to agent context in `runner/src/context.ts`
- [x] Pass `AGENTFORGE_SESSION_ID` to Claude subprocess
- [x] Pass `AGENTFORGE_AGENT_ROLE` to Claude subprocess
- [x] Add `agentRole` field to `runner/src/cli/api.ts`

### 3. DataObject Schema Updates ✅
- [x] Make `userId` optional in task-comment-dataobject
- [x] Add `authorName` to createFields for agent attribution
- [x] Update both index.ts and schema.ts

### 4. Docker & Runner Infrastructure ✅
- [x] Add runner image build to server startup (`packages/server/src/cli.ts`)
- [x] Fix Docker network issue (use `host.docker.internal` instead of `localhost`)
- [x] Remove unused `@agentforge/logger` dependency from runner
- [x] Fix TypeScript errors blocking runner build
- [x] Build `agentforge-runner:latest` image successfully

### 5. GitHub Token Integration ✅
- [x] Retrieve user's GitHub token from database
- [x] Pass GitHub token as `GIT_TOKEN` to Docker container
- [x] Pass GitHub token to local tsx runner
- [x] Remove dependency on `process.env.GIT_TOKEN`

### 6. UI Integration ✅
- [x] Update `parseTranscriptForActions()` to detect `agentforge task` commands
- [x] Update `getActionLabel()` to show meaningful labels for actions
- [x] Display task operations in session Results tab

### 7. Bug Fixes ✅
- [x] Fix variable ordering issue (`useDocker` before `sessionConfig`)
- [x] Fix `context.ts:33` TypeScript error (cast to `AgentRole`)
- [x] Fix `index.ts:44` TypeScript error (remove `maxTurns` reference)
- [x] Update yarn.lock after removing `@agentforge/logger`

## Testing

To test the implementation:

1. Start the server: `yarn dev`
2. Start a new agent session through the UI
3. Check session logs for CLI usage (e.g., `agentforge task list`)
4. Verify tasks created by agents appear in Results tab
5. Verify agent comments show `authorName` instead of `userId`

## Known Issues

- None currently identified

## Future Enhancements

- Add `agentforge chat` commands for inter-agent messaging
- Add task filtering by multiple criteria
- Add task search by text content
- Consider adding batch operations (e.g., update multiple tasks)
