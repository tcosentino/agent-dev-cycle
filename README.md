# AgentForge

> **Development platform for autonomous AI agents**  
> Framework + Infrastructure for agents that build, test, and deploy software

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

---

## The Problem

Current AI coding tools give agents **text editors** (Cursor), **code suggestions** (Copilot), or **promise autonomy** without delivering infrastructure (Devin).

**What's missing:**
- Conventions and patterns (agents reinvent the wheel every time)
- Development infrastructure (memory, task management, testing, deployment)
- Business operations (how do agents maintain projects over time?)

## The Solution

AgentForge gives AI agents both **framework** (standardized building blocks) and **infrastructure** (full development environment) to build software like a professional team.

### Three Layers

```
┌─────────────────────────────────────────────────┐
│  Agent Experience Layer                          │
│  Natural language requirements → Working software│
│  Iterative development with human approval gates │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Infrastructure Layer                            │
│  • Orchestration & state management              │
│  • Memory & documentation                        │
│  • Task & project management                     │
│  • Runtime + testing harness                     │
│  • Deployment pipelines                          │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Framework Layer (Open Source)                   │
│  • dataobjects: Type-safe data models            │
│  • Standardized patterns & libraries             │
│  • Portable: works standalone or in AgentForge  │
└─────────────────────────────────────────────────┘
```

### Key Innovation: Framework + Infrastructure

**Most tools:** Give agents a blank canvas, hope for the best  
**AgentForge:** Give agents proven patterns + full dev environment

**Analogy:**
- Rails = conventions + gems for developers
- Next.js = framework + deployment for web apps
- **AgentForge = framework + infrastructure for AI agents**

---

## How It Works

### 1. Agent Gets Business Infrastructure

Like an enterprise's internal tooling:
- **Memory:** Documentation, shared state, project history
- **Coordination:** Task management, approval workflows
- **Execution:** Runtime environment to run and test code
- **Deployment:** Production pipelines with human checkpoints

### 2. Agent Uses Standardized Framework

Instead of generating ad-hoc code, agents build with:
- **dataobjects:** Type-safe data models with built-in validation
- **Proven patterns:** API design, state management, error handling
- **Open source libraries:** Usable outside AgentForge (no lock-in)

### 3. Resulting Code is Portable

Projects built with AgentForge:
- ✅ Run standalone (`git clone` + `npm start`)
- ✅ Use standard tools (Node.js, TypeScript, React)
- ✅ No vendor lock-in
- ✅ But get full dev environment inside AgentForge

---

## Architecture Highlights

### Monorepo Structure

```
agent-dev-cycle/
├── packages/          # Shared libraries
│   ├── dataobject/   # Type-safe data models (open source)
│   ├── logger/       # Structured logging
│   ├── runtime/      # Execution engine
│   └── server/       # API orchestration
├── runner/           # Agent orchestration engine
├── src/              # UI & core services
├── docs/             # Architecture & design docs
└── prompts/          # AI system prompts
```

### Core Components

**Agent Orchestration Engine** (`/runner`)
- State management for multi-agent workflows
- Context tracking & memory
- Git integration for version control
- Claude API integration

**Development Infrastructure** (`/packages`)
- Runtime environment for executing code
- Testing harness with isolated environments
- Deployment pipeline management
- Structured logging & monitoring

**Framework Library** (open source)
- `dataobject`: Type-safe models with validation
- Reusable patterns for common dev tasks
- Standalone usage or AgentForge integration

**Interactive UI** (`/src`)
- Project management & visualization
- Real-time agent session monitoring
- Approval workflows & human-in-the-loop
- Infrastructure visualization

---

## Vision

### Short-Term: Developer Tool
AI assistant that helps developers build faster with:
- Iterative development with approval gates
- Standardized patterns (less cleanup)
- Built-in testing & deployment

### Long-Term: Dev-Shop-as-a-Service
"Hire" an AI dev team:
- Natural language requirements
- Agent plans & builds autonomously
- Regular check-ins & approval points
- Maintains documentation & project state
- Ships to production with oversight

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Backend** | Node.js, TypeScript |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Package Management** | Yarn Workspaces (monorepo) |
| **AI Integration** | Claude API (Anthropic) |
| **Version Control** | Git (automated commits) |

---

## Project Status

🚧 **Active Development** - Approaching v1 Demo

**Current Milestone:** Full development cycle demonstration
- Agent receives feature request
- Creates project tasks & documentation
- Builds using standardized framework (dataobjects)
- Runs & tests the application
- Deploys with approval workflow

**Example:** Agent autonomously adding priority field to Todo app, end-to-end.

---

## Quick Start

### Development

```bash
# Install dependencies
yarn install

# Start UI (port 5173) and API server (port 3000)
yarn dev

# Or run separately
yarn dev:ui       # UI only
yarn dev:server   # API only
```

### Building

```bash
yarn build        # Build UI
yarn build:server # Build API server
yarn build:all    # Build everything
```

### Testing

```bash
yarn test         # Run server tests
yarn test:e2e     # Run Playwright E2E tests
```

---

## Documentation

- [**Application Architecture**](docs/application-architecture.md) - Infrastructure visualization & building blocks
- [**UI System**](docs/ui-system.md) - Component architecture & design system
- [**Agent Runtime**](docs/runner.md) - Orchestration engine details
- [**Product Development Flow**](docs/product-development-flow.md) - How agents build software

---

## Why This Matters

### For Developers
- **Better code quality:** Agents use proven patterns, not ad-hoc generation
- **Faster iteration:** Full dev cycle automation with human checkpoints
- **No lock-in:** Framework is open source, projects run standalone

### For Agentic Systems
- **Infrastructure blueprint:** Shows what agents need to be productive
- **Framework approach:** Solves the "consistent code" problem
- **Human-in-the-loop:** Demonstrates safe autonomous development

### For the Industry
- **New paradigm:** Not copilot, not fully autonomous - structured collaboration
- **Open source foundation:** Framework layer is freely available
- **Production-ready thinking:** Built for real software development, not demos

---

## Differentiation

| Tool | Approach | Autonomy | Infrastructure |
|------|----------|----------|----------------|
| **GitHub Copilot** | Code suggestions | Low | None |
| **Cursor** | AI pair programming | Medium | Editor only |
| **Devin** | Full autonomy | High (claimed) | Black box |
| **AgentForge** | Structured collaboration | Iterative + approval gates | Full dev environment + framework |

---

## Author

**Troy Cosentino** - [GitHub](https://github.com/tcosentino) | [LinkedIn](https://linkedin.com/in/troycosentino)

Experienced distributed systems engineer (7 years) building the infrastructure and framework for autonomous software development. Interested in agentic systems, AI orchestration, and production-ready AI tooling.

---

## License

MIT License - See [LICENSE.md](LICENSE.md)

---

## Contact

Questions? Ideas? Want to collaborate?
- Open an issue
- Email: [your-email] (Troy: add your contact)
- Twitter: [your-handle] (Troy: add if you want)

---

**Built with:** TypeScript, React, Node.js, Claude AI  
**Status:** Active development, approaching v1 demo  
**Goal:** Give AI agents the infrastructure they need to ship real software
