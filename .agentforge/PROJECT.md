# AgentForge - Agent Development Platform

## Project Overview

AgentForge is an AI-powered software development platform that enables autonomous agent-driven development workflows.

## Customer

Internal tool and platform for AgentForge users and developers.

## Problem

Building software with AI agents requires:
- Structured agent configurations and roles
- Session management and tracking
- Project organization and workspace management
- Integration between UI, API, and runtime components
- Testing and validation infrastructure

## Solution

A comprehensive platform providing:
- **Interactive UI** - Project management, agent sessions, real-time monitoring
- **Backend API** - Agent orchestration, data persistence, integrations
- **Runtime Engine** - Agent execution, workspace management, Git operations
- **Testing Framework** - Structure validation, UI tests, integration tests
- **Component Library** - Reusable UI components and data object framework

## Success Metrics

- Agents can execute tasks successfully with proper workspace isolation
- Users can monitor agent sessions in real-time
- Project structure validates automatically
- UI provides clear visibility into agent operations
- Example projects demonstrate best practices

## Constraints

- Monorepo architecture with yarn workspaces
- Service-oriented architecture for modularity
- Git submodules for example projects
- Backward compatibility with legacy structure during migration
- Testing infrastructure integrated into development workflow

## Additional Documentation

See also:
- `.agentforge/ARCHITECTURE.md` - Technical architecture and design decisions
- `.agentforge/agents/` - Agent configurations for this project
- `docs/` - Comprehensive technical documentation
- `examples/` - Example AgentForge projects
