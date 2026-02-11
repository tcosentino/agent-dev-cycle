# AgentForge - Agent Development Cycle

AI-powered custom software development service built with React, TypeScript, and Vite.

## Overview

AgentForge is a monorepo project demonstrating autonomous agent-driven software development. It includes:

- Interactive UI for project management and agent sessions
- Backend API server for agent orchestration
- Runtime engine for agent execution
- Shared component library and data object framework
- **Test-Spec Linkage System** - Machine-readable connection between OpenSpec scenarios and test code

## Quick Start

### Clone with Examples

Clone including example project submodules:

```bash
git clone --recursive https://github.com/your-org/agent-dev-cycle
# or after cloning:
git submodule update --init --recursive
```

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
yarn test             # Run server tests
yarn test:e2e         # Run all E2E tests
yarn test:structure   # Validate .agentforge structure
yarn test:ui          # UI integration tests
yarn coverage:spec    # Generate test-spec coverage reports
```

## Project Structure

- `/src/services/` - Modular service components (UI services, data objects, integrations)
- `/packages/` - Shared libraries (dataobject, logger, runtime, server)
- `/runner/` - Agent orchestration engine
- `/examples/` - Example AgentForge projects (git submodules)
- `/docs/` - Architecture and technical documentation
- `/.agentforge/` - AgentForge configuration for this project

## Documentation

See [/docs/](docs/) for detailed documentation:

- [Architecture Overview](docs/ARCHITECTURE.md) - System design and components
- [Test-Spec Linkage Guide](docs/test-spec-linkage.md) - **NEW!** Connect specs to tests
- [Application Architecture](docs/application-architecture.md)
- [UI System](docs/ui-system.md)
- [Agent Runtime](docs/runner.md)
- [Product Development Flow](docs/product-development-flow.md)

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, TypeScript
- **Testing**: Vitest, Playwright
- **Package Manager**: Yarn Workspaces
