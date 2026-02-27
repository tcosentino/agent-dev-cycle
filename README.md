<div align="center">

# 🤖 AgentForge

**AI-Powered Autonomous Software Development Platform**

[![Build Status](https://img.shields.io/github/actions/workflow/status/tcosentino/agent-dev-cycle/test.yml?branch=main)](https://github.com/tcosentino/agent-dev-cycle/actions)
[![Test Coverage](https://img.shields.io/codecov/c/github/tcosentino/agent-dev-cycle)](https://codecov.io/gh/tcosentino/agent-dev-cycle)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[Why AgentForge?](./docs/why-agentforge.md) | [Quick Start](#quick-start) | [Documentation](./docs/) | [Contributing](CONTRIBUTING.md)

</div>

---

## What is AgentForge?

**AgentForge** is a platform for building software with autonomous AI agents. Think of it as your AI development team - agents that can:

- 📝 **Write code** based on requirements
- 🧪 **Write tests** to verify functionality  
- 🏗️ **Deploy services** automatically
- 🔍 **Review code** and suggest improvements
- 📊 **Track progress** and report status

### Key Features

- **🤖 Multi-Agent Orchestration** - Coordinate teams of specialized AI agents
- **📋 Task Management** - Create, assign, and track tasks with built-in workflows
- **🚀 Automated Deployment** - Build and deploy services with workload orchestration
- **🔗 Git Integration** - Agents commit code to your repository with clear commit messages
- **🎯 OpenSpec Framework** - Define requirements with executable specifications
- **🧪 Test-Spec Linkage** - Connect specs → tests → code for full traceability
- **📊 Real-Time Dashboard** - Monitor agents, tasks, and deployments in one view

### Who Is This For?

- **Developers** building agentic systems and AI orchestration tools
- **Teams** exploring autonomous software development
- **Researchers** experimenting with multi-agent workflows
- **Companies** looking to accelerate development with AI

## Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Yarn** v1.22+ (`npm install -g yarn`)
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# Clone the repository
git clone --recursive https://github.com/tcosentino/agent-dev-cycle.git
cd agent-dev-cycle

# Install dependencies
yarn install

# Build packages
yarn build

# Start the development server
yarn dev
```

🎉 **Open http://localhost:3000** to see AgentForge in action!

### What You'll See

- **Dashboard** - Overview of projects, tasks, and deployments
- **Tasks Page** - Task board with Kanban-style workflow
- **Agents Page** - View and configure your AI agents
- **Deployments** - Monitor running services and workloads

### Next Steps

📖 **New to AgentForge?** Start with our [Getting Started Guide](./docs/user-guide/getting-started/installation.md)

🛠️ **Want to contribute?** Read the [Contributing Guide](CONTRIBUTING.md)

🏗️ **Building your own project?** See [First Project Tutorial](./docs/user-guide/getting-started/first-project.md)

## Project Structure

AgentForge is organized as a **TypeScript monorepo**:

```
agent-dev-cycle/
├── packages/              # Shared libraries
│   ├── dataobject/        # Resource abstraction framework
│   ├── server/            # HTTP server utilities
│   ├── runtime/           # Agent runtime engine
│   └── ui-components/     # Reusable React components
│
├── src/services/          # Application services
│   ├── agentforge-ui/     # Main web UI (React)
│   ├── task-dataobject/   # Task management API
│   ├── deployment-dataobject/ # Deployment tracking
│   ├── workload-orchestrator/ # Service deployment engine
│   └── */                 # Other dataobjects & integrations
│
├── runner/                # Agent orchestration engine
├── docs/                  # Documentation
├── openspec/              # Requirements & specifications
└── .agentforge/           # AgentForge project metadata
```

See [Monorepo Structure](./docs/developer-guide/architecture/monorepo-structure.md) for details.

## Documentation

### Positioning

- [Why AgentForge?](./docs/why-agentforge.md) - vs. Claude Code directly, vs. traditional dev — for individuals and enterprise

### For Users

- **Getting Started**
  - [Installation](./docs/user-guide/getting-started/installation.md)
  - [First Project](./docs/user-guide/getting-started/first-project.md)
  - [Core Concepts](./docs/user-guide/getting-started/core-concepts.md)
- **How-To Guides**
  - [Git Workflow](./docs/user-guide/how-to/git-workflow.md) - How AgentForge works with your repository

### For Contributors

- **Developer Guide**
  - [Development Setup](./docs/developer-guide/development-setup.md) - Set up your local environment
  - [Testing Guide](./docs/developer-guide/testing-guide.md) - How to write tests
  - [Architecture Overview](./docs/developer-guide/architecture/overview.md) - System architecture
  - [Workload Lifecycle](./docs/developer-guide/architecture/workload-lifecycle.md) - How deployments work
  - [Monorepo Structure](./docs/developer-guide/architecture/monorepo-structure.md) - Code organization
- **Contributing**
  - [Contributing Guide](CONTRIBUTING.md) - How to contribute
  
### Specifications

- **OpenSpec** - Requirements and design documents in `openspec/changes/`
  - [New Agent Button](openspec/changes/new-agent-button/)
  - [Agent Marketplace](openspec/changes/agent-marketplace/)
  - [Project Settings](openspec/changes/project-settings/)
  - [Documentation System](openspec/changes/documentation-system/)
  - [Task Management UI](openspec/changes/task-management-ui/)
  - [Deployment Dashboard](openspec/changes/deployment-dashboard/)

## Technology Stack

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- CSS (styling)
- Vitest + Testing Library

**Backend:**
- Node.js + TypeScript
- Better-SQLite3 (database)
- Hono (HTTP server)
- Zod (validation)

**Infrastructure:**
- Docker (deployments)
- Yarn Workspaces (monorepo)
- OpenSpec (requirements)

## Development

### Common Commands

```bash
# Development
yarn dev              # Start UI + API server
yarn dev:agentforge   # AgentForge UI only
yarn dev:server       # API only

# Building
yarn build            # Build all UIs (agentforge + demo)
yarn build:agentforge # Build AgentForge UI only
yarn build:server     # Build server

# Testing
yarn test             # Run all tests
yarn test --watch     # Watch mode
yarn test --coverage  # With coverage report

# Database
yarn seed             # Seed with sample data
```

See [Development Setup](./docs/developer-guide/development-setup.md) for more.

## Contributing

We welcome contributions! Here's how to get started:

1. **Read the [Contributing Guide](CONTRIBUTING.md)**
2. **Find an issue** - Look for [`good first issue`](https://github.com/tcosentino/agent-dev-cycle/labels/good-first-issue) or [`help wanted`](https://github.com/tcosentino/agent-dev-cycle/labels/help-wanted)
3. **Fork the repo** and create a branch
4. **Make your changes** with tests
5. **Submit a PR** with clear description

### Before Submitting a PR

- Tests pass (`yarn test`)
- Build succeeds (`yarn build`)
- ✅ Documentation updated (if needed)

See the [Contributing Guide](CONTRIBUTING.md) for detailed instructions.

## Community

- [Issues](https://github.com/tcosentino/agent-dev-cycle/issues) - Report bugs, request features

## Acknowledgments

Built with:
- [Anthropic Claude](https://www.anthropic.com/) - AI agents
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

