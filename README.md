# AgentForge - Agent Development Cycle

AI-powered custom software development service built with React, TypeScript, and Vite.

## Overview

AgentForge is a monorepo project demonstrating autonomous agent-driven software development. It includes:

- Interactive UI for project management and agent sessions
- Backend API server for agent orchestration
- Runtime engine for agent execution
- Shared component library and data object framework

## Quick Start

### Development

```bash
yarn install
yarn dev          # Starts UI (port 5173) and API server (port 3000)
yarn dev:ui       # UI only
yarn dev:server   # API only
```

### Building

```bash
yarn build        # Build UI
yarn build:server # Build API
yarn build:all    # Build everything
```

### Testing

```bash
yarn test         # Run server tests
yarn test:e2e     # Run Playwright E2E tests
```

## Project Structure

- `/src/services/` - Modular service components (UI services, data objects, integrations)
- `/packages/` - Shared libraries (dataobject, logger, runtime, server)
- `/runner/` - Agent orchestration engine
- `/docs/` - Architecture and technical documentation
- `/prompts/` - AI system prompts

## Documentation

See [/docs/](docs/) for detailed documentation:

- [Application Architecture](docs/application-architecture.md)
- [UI System](docs/ui-system.md)
- [Agent Runtime](docs/runner.md)
- [Product Development Flow](docs/product-development-flow.md)

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, TypeScript
- **Testing**: Vitest, Playwright
- **Package Manager**: Yarn Workspaces
