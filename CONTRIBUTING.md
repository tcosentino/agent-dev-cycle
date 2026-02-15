# Contributing to AgentForge

Thank you for your interest in contributing to AgentForge! This document will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Finding Issues to Work On](#finding-issues-to-work-on)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Style](#code-style)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Review Process](#review-process)
- [Getting Help](#getting-help)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **Yarn** v1.22+
- **Git**
- **A code editor** (VS Code recommended)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR-USERNAME/agent-dev-cycle.git
   cd agent-dev-cycle
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/agentforge/agent-dev-cycle.git
   ```

### Set Up Your Environment

Follow the complete setup guide in our [Development Setup](./docs/developer-guide/development-setup.md) documentation.

**Quick version:**

```bash
# Install dependencies
yarn install

# Build packages
yarn build

# Set up database
yarn db:migrate
yarn db:seed

# Start the development server
yarn dev
```

Open http://localhost:3000 to verify it works!

## Development Workflow

### 1. Stay in Sync

Before starting work, pull the latest changes:

```bash
git checkout main
git pull upstream main
git push origin main  # Update your fork
```

### 2. Create a Branch

Create a feature branch for your work:

```bash
# Use a descriptive name
git checkout -b feat/add-agent-timeout
git checkout -b fix/workload-deployment-bug
git checkout -b docs/improve-setup-guide
```

**Branch naming convention:**
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 3. Make Your Changes

- Write code following our [Code Style](#code-style)
- Add tests for new functionality
- Update documentation as needed
- Keep commits focused and atomic

### 4. Test Your Changes

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run specific test
yarn test TaskCard

# Check test coverage
yarn test --coverage
```

All tests must pass before submitting a PR.

### 5. Commit Your Changes

Follow our [Commit Message Guidelines](#commit-message-guidelines):

```bash
git add .
git commit -m "feat(dataobject): add custom actions API"
```

### 6. Push to Your Fork

```bash
git push origin feat/add-agent-timeout
```

### 7. Open a Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Fill out the PR template
4. Link related issues
5. Submit!

## Finding Issues to Work On

### Good First Issues

New to the project? Look for issues labeled [`good first issue`](https://github.com/agentforge/agent-dev-cycle/labels/good-first-issue).

These are specifically chosen for newcomers and include extra guidance.

### Help Wanted

Issues labeled [`help wanted`](https://github.com/agentforge/agent-dev-cycle/labels/help-wanted) are ready for community contribution.

### Check the Roadmap

See our [project roadmap](https://github.com/agentforge/agent-dev-cycle/projects) for larger initiatives.

### Ask Before Starting Large Work

For significant changes:
1. Check if an issue exists
2. If not, create an issue to discuss your approach
3. Wait for maintainer feedback
4. Then start coding

This prevents wasted effort on changes that might not be accepted.

## Making Changes

### What to Change

**We welcome:**
- Bug fixes
- Performance improvements
- Documentation improvements
- Test coverage increases
- Accessibility improvements
- New features (discuss first!)

**Please don't:**
- Refactor large sections without discussion
- Change code style across the codebase
- Add dependencies without justification
- Submit AI-generated PRs without review and modification

### Code Organization

AgentForge uses a monorepo structure. See [Monorepo Structure](./docs/developer-guide/architecture/monorepo-structure.md) for details.

**Key directories:**
- `packages/` - Shared libraries (@agentforge/*)
- `src/services/` - Application services
- `runner/` - Agent orchestrator
- `docs/` - Documentation
- `tests/` - Integration and E2E tests

### Adding New Files

**New Package:**
```bash
mkdir packages/my-package
cd packages/my-package
yarn init
# Update name to "@agentforge/my-package"
```

**New Service:**
```bash
mkdir src/services/my-service
cd src/services/my-service
touch index.ts service.json README.md
```

**New Test:**
```bash
# Co-locate tests with code
touch src/services/my-service/index.test.ts
```

## Testing

### Test Requirements

All PRs must include tests:

- **New features** → Add tests demonstrating functionality
- **Bug fixes** → Add regression test preventing recurrence
- **Refactoring** → Existing tests must still pass

### Writing Tests

AgentForge uses **Vitest** for testing.

**Basic test:**
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './index'

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

**Using `describeSpec` (for test-spec linkage):**
```typescript
import { describeSpec } from '@agentforge/testing-framework'

describeSpec({
  spec: 'openspec/specs/my-feature/spec.md',
  scenario: 'my-feature-001',
  requirement: 'My Feature',
  title: 'User performs action'
}, () => {
  it('should perform action correctly', () => {
    // Test implementation
  })
})
```

See our [Testing Guide](./docs/developer-guide/testing-guide.md) for comprehensive examples.

### Running Tests

```bash
# All tests
yarn test

# Watch mode (re-runs on file change)
yarn test --watch

# Specific file
yarn test TaskCard

# With coverage
yarn test --coverage

# For specific package
cd packages/dataobject
yarn test
```

### Test Coverage

We aim for **80%+ coverage** on new code.

Check coverage:
```bash
yarn test --coverage
```

View detailed report:
```bash
open coverage/index.html
```

## Submitting a Pull Request

### PR Checklist

Before submitting, ensure:

- [ ] Tests pass (`yarn test`)
- [ ] Linting passes (`yarn lint`)
- [ ] Build succeeds (`yarn build`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with `main`
- [ ] PR description explains changes clearly

### PR Template

Fill out all sections of the PR template:

```markdown
## Description
Brief summary of changes

## Related Issues
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Before/after comparison

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Ready for review
```

### PR Size

Keep PRs focused and reasonably sized:
- ✅ **Good:** < 400 lines changed
- ⚠️ **Large:** 400-1000 lines (consider splitting)
- ❌ **Too large:** > 1000 lines (definitely split)

Large PRs take longer to review and are harder to merge.

### Draft PRs

Use draft PRs for work-in-progress:

1. Open a draft PR
2. Get early feedback
3. Mark "Ready for review" when complete

## Code Style

### TypeScript

- **Strict mode** - No `any` types
- **Explicit types** on function parameters and return values
- **Descriptive names** - No abbreviations unless common (e.g., `ctx`, `req`, `res`)

**Good:**
```typescript
function createTask(title: string, projectId: string): Task {
  return { id: generateId(), title, projectId, status: 'todo' }
}
```

**Bad:**
```typescript
function crtTsk(t: any, pid: any): any {
  return { id: genId(), title: t, projectId: pid, status: 'todo' }
}
```

### React

- **Functional components** - No class components
- **Hooks** for state and effects
- **CSS Modules** for styling
- **TypeScript** - Props interfaces defined

**Component structure:**
```typescript
interface MyComponentProps {
  title: string
  onSave: () => void
}

export function MyComponent({ title, onSave }: MyComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <button onClick={onSave}>Save</button>
    </div>
  )
}
```

### Naming Conventions

- **Files:** kebab-case (`task-card.tsx`, `my-util.ts`)
- **Components:** PascalCase (`TaskCard`, `MyComponent`)
- **Functions:** camelCase (`createTask`, `fetchData`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRIES`, `DEFAULT_TIMEOUT`)
- **Types/Interfaces:** PascalCase (`Task`, `MyInterface`)

### Formatting

We use **Prettier** for automatic formatting:

```bash
# Format all files
yarn format

# Check formatting (CI)
yarn format:check
```

VS Code users: Enable "Format on Save" (see [Development Setup](./docs/developer-guide/development-setup.md)).

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring (no behavior change)
- `test` - Adding or fixing tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `style` - Code style/formatting (no logic change)

### Scope

The package or area affected:
- `dataobject` - @agentforge/dataobject
- `ui` - UI components or agentforge-ui
- `runtime` - Agent runtime
- `server` - HTTP server
- `docs` - Documentation

### Examples

```bash
feat(dataobject): add custom actions API

Adds support for defining custom actions on dataobjects beyond
standard CRUD operations.

Closes #45

---

fix(ui): TaskCard priority color not updating

Priority indicator was using stale prop value. Fixed by using
memoized color calculation.

Fixes #123

---

docs(contributing): clarify testing requirements

Added examples of good test coverage and explained when tests
are required.
```

### Tips

- Use imperative mood ("add" not "added")
- Keep subject line < 72 characters
- Body explains **what and why**, not how
- Reference issues/PRs in footer

## Review Process

### What to Expect

1. **Automated checks** run (tests, linting, build)
2. **Maintainer reviews** code (usually within 3-5 days)
3. **Feedback** provided via review comments
4. **You address** feedback and push updates
5. **Maintainer approves** and merges

### Addressing Feedback

When reviewers request changes:

1. **Make the requested changes**
2. **Respond to comments** explaining changes
3. **Push new commits** (don't force push during review)
4. **Request re-review** when ready

Be patient and professional. Reviews help maintain code quality!

### Review Criteria

Maintainers check for:

- ✅ Code works as intended
- ✅ Tests provide adequate coverage
- ✅ Code follows style guidelines
- ✅ Documentation is clear and accurate
- ✅ No breaking changes (or properly documented)
- ✅ Commit messages follow conventions
- ✅ Changes are in scope for the project

## Getting Help

### Where to Ask Questions

- **Discord** - [Join our community](https://discord.gg/agentforge)
- **GitHub Discussions** - [Ask a question](https://github.com/agentforge/agent-dev-cycle/discussions)
- **Issues** - For bug reports or feature requests

### Before Asking

1. Check the [documentation](./docs/)
2. Search [existing issues](https://github.com/agentforge/agent-dev-cycle/issues)
3. Read the [troubleshooting guide](./docs/developer-guide/development-setup.md#troubleshooting)

### When Asking

Include:
- What you're trying to do
- What you've tried
- Error messages (full stack trace)
- Environment (OS, Node version, etc.)

## Recognition

All contributors are recognized in:
- Our [Contributors page](https://github.com/agentforge/agent-dev-cycle/graphs/contributors)
- Release notes for significant contributions
- The community showcase

## Thank You!

Your contributions make AgentForge better for everyone. We appreciate your time and effort! 🚀

---

**Questions?** Join our [Discord](https://discord.gg/agentforge) or open a [GitHub Discussion](https://github.com/agentforge/agent-dev-cycle/discussions).
