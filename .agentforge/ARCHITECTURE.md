# AgentForge Architecture

## System Overview

AgentForge is a monorepo containing multiple services that work together to provide an AI agent development platform.

## Architecture Layers

### 1. Frontend Layer

**Services:**
- `agentforge-ui` - Main UI for project and agent management (Vite + React, port 5173)
- `demo-ui` - Component showcase and demos (Vite + React, port 5174)

**Shared:**
- `@agentforge/ui-components` - Reusable UI component library

### 2. Backend Layer

**API Server:**
- `@agentforge/server` - Hono-based API server (port 3000)
- RESTful API with OpenAPI documentation
- Service discovery and registration

**Data Objects:**
- `agent-session-dataobject` - Agent session management
- `agent-status-dataobject` - Agent status tracking
- `project-dataobject` - Project metadata
- `task-dataobject` - Task management
- And more...

**Integrations:**
- `agent-session-integration` - Agent session orchestration
- `github-integration` - GitHub OAuth and API integration
- `claude-auth-integration` - Claude authentication

### 3. Runtime Layer

**Agent Runner:**
- `runner/` - Agent execution engine
- Git workspace management
- Claude API integration
- Session tracking and logging

**Shared Libraries:**
- `@agentforge/dataobject` - Data persistence framework
- `@agentforge/logger` - Logging utilities
- `@agentforge/runtime` - Runtime utilities

### 4. Testing Layer

**Testing Service:**
- `@agentforge/testing` - Structure validation and UI tests
- Playwright-based E2E tests
- Project structure validators

## Key Design Decisions

### Service-Oriented Architecture

Each service is self-contained with its own:
- Configuration files
- Dependencies
- Build process
- Tests

Benefits:
- Clear separation of concerns
- Independent deployment
- Easier testing and maintenance

### Agent Workspace Structure

All agent-related files live in `.agentforge/`:
```
.agentforge/
├── agents/           # Agent configurations
│   ├── {agent-id}/
│   │   ├── config.json
│   │   ├── prompt.md
│   │   └── sessions/
├── PROJECT.md        # Project documentation
├── ARCHITECTURE.md   # This file
└── TESTING.md       # Testing guide
```

### Git Submodules for Examples

Example projects are separate repositories added as git submodules. This allows:
- Independent versioning
- Cleaner main repo
- Reusable examples
- Easy updates

### Backward Compatibility

During migration from legacy structure, the system supports:
- Legacy `agents.yaml` format
- Root-level `prompts/`, `sessions/` directories
- Automatic fallback when new structure not found

## Data Flow

```
User → UI (Vite) → API Server (Hono) → Data Objects → SQLite
                                     ↓
                                  Runner
                                     ↓
                              Git Workspaces
                                     ↓
                              Claude API
```

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Node.js, Hono, TypeScript
- **Database:** SQLite (via @agentforge/dataobject)
- **Runtime:** Node.js with tsx for TypeScript execution
- **Testing:** Playwright, Vitest
- **Build:** Vite, TypeScript compiler
- **Package Management:** Yarn Workspaces
- **Git:** Git submodules for examples

## Development Workflow

1. **Local Development:**
   ```bash
   yarn dev  # Starts all services concurrently
   ```

2. **Testing:**
   ```bash
   yarn test:structure  # Validate .agentforge structure
   yarn test:ui        # UI integration tests
   yarn test           # Server unit tests
   ```

3. **Building:**
   ```bash
   yarn build:all  # Build UI and server
   ```

## Deployment Considerations

- **UI Services:** Static builds can be deployed to CDN/Vercel
- **API Server:** Node.js server deployment
- **Database:** SQLite for local development, upgradable to PostgreSQL
- **Runner:** Separate process/container for agent execution

## Future Enhancements

- [ ] Publish `@agentforge/testing` as npm package
- [ ] UI integration for running tests
- [ ] Multi-user support with authentication
- [ ] Cloud workspace management
- [ ] Agent marketplace/templates
- [ ] Real-time collaboration features
