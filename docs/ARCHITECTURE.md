# AgentForge Architecture

> **A development environment for AI agents to build software iteratively.**

## Overview

AgentForge is a meta-development system where AI agents build and evolve software through structured specifications, tests, and runtime feedback.

## Core Principles

1. **Specs First** - Requirements drive implementation
2. **Test-Driven** - Tests verify specs are met
3. **Iterative** - Build → Test → Reflect → Improve
4. **Traceable** - Track requirements → specs → tests → code
5. **AI-Native** - Designed for agent collaboration

## System Components

### 1. OpenSpec System

**Purpose:** Human-readable, AI-parseable requirements

**Structure:**
```
openspec/
├── changes/{feature}/
│   ├── proposal.md        # Why build this?
│   ├── design.md          # How to build it?
│   ├── specs/{spec-name}/
│   │   └── spec.md        # WHEN/THEN scenarios
│   ├── tasks.md           # Implementation checklist
│   └── coverage.json      # Test coverage manifest
```

**Spec Format:**
- WHEN/THEN scenarios (BDD-style)
- Scenario IDs for traceability
- Priority levels
- Test status tracking

**Learn more:** [OpenSpec Guide](./openspec-guide.md)

### 2. Test-Spec Linkage System

**Purpose:** Machine-readable connection between specs and tests

**Components:**

#### `@agentforge/testing-framework`
TypeScript package providing:
- `describeSpec()` - Links test suites to spec scenarios
- Coverage registry - Tracks test-spec mappings
- Manifest generation - Creates coverage reports

**Example:**
```typescript
describeSpec({
  spec: 'openspec/specs/task-crud/spec.md',
  scenario: 'task-crud-001',
  requirement: 'Create task',
  title: 'User creates task with minimal fields',
  priority: 'high'
}, () => {
  it('should show form', () => { ... })
  it('should create task', () => { ... })
})
```

#### Coverage Manifests
JSON files showing which scenarios have tests:

```json
{
  "summary": {
    "totalScenarios": 69,
    "coveredScenarios": 5,
    "coveragePercent": 7
  },
  "specs": [...]
}
```

**Benefits:**
- ✅ Track requirements → tests mapping
- 📊 Visualize coverage gaps
- 🤖 Enable AI test generation
- 🔍 Maintain traceability

**Learn more:** [Test-Spec Linkage Guide](./test-spec-linkage.md)

### 3. DataObject System

**Purpose:** Type-safe, validated data layer with auto-generated APIs

**Features:**
- Schema definition with Zod
- Automatic CRUD endpoints
- React hooks generation
- OpenAPI documentation

**Example:**
```typescript
const taskResource = createResource({
  name: 'task',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    status: z.enum(['todo', 'done'])
  })
})

// Auto-generated:
// - POST   /api/tasks
// - GET    /api/tasks
// - GET    /api/tasks/:id
// - PUT    /api/tasks/:id
// - DELETE /api/tasks/:id
```

**Learn more:** `packages/dataobject/README.md`

### 4. UI Components

**Purpose:** Reusable, tested React components

**Packages:**
- `@agentforge/ui-components` - Core UI library
- `@agentforge/dataobject-react` - React Query hooks for DataObjects

**Architecture:**
```
Component
  ↓ (uses)
DataObject React Hooks
  ↓ (wraps)
React Query
  ↓ (calls)
DataObject API
  ↓ (validates)
Zod Schema
```

**Benefits:**
- Centralized state via React Query
- Automatic cache invalidation
- Optimistic updates
- Type safety end-to-end

### 5. Agent Runtime

**Purpose:** Environment for agents to execute code and access tools

**Capabilities:**
- File system access
- Shell command execution
- API requests
- Database queries
- Browser automation

**Safety:**
- Sandboxed execution
- Permission-based access
- Audit logging
- Rollback on errors

**Learn more:** `packages/runtime/README.md`

## Data Flow

### Development Cycle

```
1. Write Spec (OpenSpec)
   ↓
2. Add Scenario IDs & Priorities
   ↓
3. Generate Test Stubs (describeSpec)
   ↓
4. Implement Tests
   ↓
5. Implement Feature
   ↓
6. Run Tests
   ↓
7. Generate Coverage Report
   ↓
8. Identify Gaps → Repeat
```

### Request Flow (Runtime)

```
User Action
  ↓
React Component
  ↓
DataObject Hook (useCreateTask, useUpdateTask, etc.)
  ↓
React Query (caching, optimistic updates)
  ↓
HTTP Request
  ↓
DataObject API (validation, business logic)
  ↓
Database (SQLite)
  ↓
Response
  ↓
React Query Cache Update
  ↓
All Subscribed Components Re-render
```

### Spec-to-Code Traceability

```
Requirement (Proposal)
  ↓
Spec Scenarios (spec.md)
  ↓ (linked by scenario ID)
Test Suites (describeSpec)
  ↓ (referenced by)
Coverage Manifest (coverage.json)
  ↓ (visualized in)
UI Coverage Dashboard (future)
```

## Technology Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Query** - State management
- **Vitest** - Testing framework

### Backend
- **Hono** - Lightweight web framework
- **SQLite** - Database
- **Zod** - Schema validation
- **DataObject** - ORM abstraction

### Testing
- **Vitest** - Unit tests
- **Playwright** - E2E tests
- **@testing-library/react** - Component tests
- **@agentforge/testing-framework** - Spec linkage

### Tooling
- **tsx** - TypeScript execution
- **OpenSpec** - Specification system
- **Coverage manifests** - Test tracking

## File Structure

```
agent-dev-cycle/
├── openspec/                  # Specifications
│   └── changes/{feature}/
│       ├── proposal.md
│       ├── design.md
│       ├── specs/
│       ├── tasks.md
│       └── coverage.json
│
├── packages/                  # Shared libraries
│   ├── dataobject/           # Data layer
│   ├── dataobject-react/     # React hooks
│   ├── testing-framework/    # Test-spec linkage
│   ├── logger/
│   ├── runtime/
│   ├── server/
│   └── ui-components/
│
├── src/                       # Applications
│   ├── services/
│   │   ├── agentforge-ui/    # Main UI
│   │   └── demo-ui/          # Examples
│   └── task-dataobject/      # Task domain logic
│
├── scripts/                   # Build & tooling scripts
│   └── generate-spec-coverage.ts
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md       # This file
│   ├── test-spec-linkage.md
│   └── ...
│
├── examples/                  # Integration examples
│
└── dist/                      # Build output
```

## Design Decisions

### Why Monorepo?
- Shared code between services
- Consistent versioning
- Easier refactoring
- Single CI/CD pipeline

### Why OpenSpec?
- Human-readable requirements
- AI-parseable structure
- Version-controlled specs
- Tight integration with code

### Why Test-Spec Linkage?
- Traceability: requirements → tests
- Coverage visibility
- AI test generation patterns
- Prevent spec drift

### Why DataObject?
- Reduce boilerplate (90% less code for CRUD)
- Type safety from DB to UI
- Auto-generated APIs
- Single source of truth (schema)

### Why React Query?
- Centralized cache
- Automatic refetching
- Optimistic updates
- Deduplication

## Performance Considerations

### Frontend
- React 19 concurrent rendering
- Virtual scrolling for long lists
- Lazy loading for routes
- Bundle splitting by service

### Backend
- SQLite in-memory for tests
- Prepared statements for queries
- Connection pooling
- Response caching (future)

### Testing
- Parallel test execution
- Minimal mocking (integration focus)
- Fast feedback loops (<1s for unit tests)

## Security Model

### Agent Execution
- Sandboxed runtime environment
- Permission-based file access
- Command whitelisting
- Audit logging

### API
- Schema validation (Zod)
- SQL injection prevention (prepared statements)
- CORS configuration
- Rate limiting (future)

### Data
- Input sanitization
- No user authentication yet (single-user dev tool)
- Future: OAuth, RBAC

## Deployment

### Development
```bash
yarn dev          # Start UI + API
yarn test         # Run tests
yarn coverage:spec # Generate coverage reports
```

### Production (Future)
- Docker containerization
- CI/CD via GitHub Actions
- Deployment to cloud (AWS, Vercel, etc.)
- Monitoring and logging

## Extension Points

### Adding New Features
1. Write OpenSpec in `openspec/changes/{feature}/`
2. Create `@agentforge/{package}` if needed
3. Add scenario IDs to specs
4. Generate test stubs with `describeSpec()`
5. Implement tests
6. Implement feature
7. Run `yarn coverage:spec`
8. Update spec with test status

### Adding New DataObjects
1. Define schema with Zod
2. Create resource with `createResource()`
3. Generate hooks with `createResourceHooks()`
4. Use hooks in components
5. Write specs for CRUD operations
6. Write tests with `describeSpec()`

### Adding New UI Components
1. Create component in `packages/ui-components/`
2. Write specs in `openspec/specs/{component}/`
3. Write tests with `describeSpec()`
4. Export from package
5. Use in applications

## Future Directions

### Phase 1: Foundation (Complete)
- ✅ OpenSpec system
- ✅ DataObject framework
- ✅ Test-Spec Linkage
- ✅ Basic UI components

### Phase 2: Enhanced Coverage (Current)
- 🏗️ Comprehensive test coverage
- 🏗️ Coverage visualization in UI
- 🏗️ AI test generation patterns

### Phase 3: Agent Collaboration
- ⏳ Multi-agent workflows
- ⏳ Conflict resolution
- ⏳ Agent performance metrics

### Phase 4: Production Ready
- ⏳ Authentication & authorization
- ⏳ Multi-tenancy
- ⏳ Cloud deployment
- ⏳ Monitoring & alerting

---

**Last Updated:** 2026-02-11  
**Maintainers:** Peggy (Subagent), Troy (Human)
