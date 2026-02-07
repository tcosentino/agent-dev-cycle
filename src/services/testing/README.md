# @agentforge/testing

Testing infrastructure for AgentForge projects.

## Overview

This service provides reusable testing tools for validating AgentForge projects:

- **Structure Validator** - Tests that validate `.agentforge/` directory structure
- **UI Tests** - End-to-end tests for AgentForge UI components

## Structure

```
testing/
├── structure-validator/       # .agentforge structure validation
│   └── agentforge-structure.spec.ts
├── ui-tests/                  # UI integration tests
│   └── vite-build.spec.ts
├── package.json
└── README.md
```

## Running Tests

### All Tests
```bash
yarn test:e2e
```

### Structure Validation Only
```bash
yarn test:structure
```

### UI Tests Only
```bash
yarn test:ui
```

### With UI Mode (Interactive)
```bash
yarn test:e2e:ui
```

## Structure Validator

Validates that AgentForge projects follow the correct directory structure.

### What It Tests

1. **Directory Structure**
   - `.agentforge/` directory exists
   - `.agentforge/agents/` directory exists
   - Each agent has its own folder

2. **Agent Configuration**
   - Each agent has `config.json`, `prompt.md`, and `sessions/` directory
   - Config files are valid JSON
   - Required fields exist: `id`, `model`, `maxTokens`
   - Model is one of: `opus`, `sonnet`, `haiku`
   - Agent ID matches directory name
   - No duplicate agent IDs

3. **Agent Prompts**
   - Prompt files are not empty
   - Content exists in each `prompt.md`

4. **Session Structure**
   - Session names start with agent ID
   - Each session has `transcript.jsonl` or `notepad.md`

5. **Documentation**
   - `README.md` exists in agents directory

6. **Legacy Support**
   - Supports legacy `agents.yaml` format if present

### Usage in CI/CD

```yaml
# GitHub Actions example
- name: Validate AgentForge Structure
  run: yarn test:structure
```

### Example Output

```
✓ .agentforge directory should exist
✓ .agentforge/agents directory should exist
✓ each agent folder should have required files
✓ agent config.json files should be valid JSON
✓ agent prompt.md files should not be empty
✓ agent config.json id should match directory name
✓ session directories should have valid structure
✓ no duplicate agent ids across configs
✓ README.md should exist in agents directory
✓ should support legacy agents.yaml if present

10 passed (816ms)
```

## UI Tests

End-to-end tests for the AgentForge UI.

### What It Tests

1. **Build Validation**
   - No 404 errors when loading UI
   - All resources load successfully

2. **Agent Loading**
   - Agents parse correctly from config files
   - Agent section appears in sidebar
   - Agents are displayed in UI

### Requirements

UI tests require the dev server to be running:

```bash
# Terminal 1: Start dev server
yarn dev

# Terminal 2: Run UI tests
yarn test:ui
```

## Future Plans

### Phase 1: Current State ✅
- Structure validation tests
- Basic UI tests
- CLI test runner

### Phase 2: UI Integration (Planned)
- Add test viewer in agentforge-ui
- Display test results in browser
- Run tests from UI
- Visual test reports

### Phase 3: Publishable Package (Future)
- Publish `@agentforge/testing` to npm
- Reusable across all AgentForge projects
- Importable validation functions
- CLI tool for validation

## Adding New Tests

### Structure Tests

Add new tests to `structure-validator/agentforge-structure.spec.ts`:

```typescript
test('my new validation', () => {
  // Your test here
  expect(something).toBe(true)
})
```

### UI Tests

Add new test files to `ui-tests/`:

```typescript
// ui-tests/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test('my feature works', async ({ page }) => {
  await page.goto('http://localhost:5173')
  // Your test here
})
```

## Common Issues

### Tests Can't Find .agentforge Directory

Run tests from the project root:
```bash
cd /path/to/your/project
yarn test:structure
```

### UI Tests Fail with Connection Errors

Ensure dev server is running:
```bash
yarn dev
```

Then run tests in another terminal.

### Tests Pass Locally But Fail in CI

Ensure CI environment has:
- Node.js installed
- Dependencies installed (`yarn install`)
- Playwright browsers installed (`npx playwright install`)

## Contributing

When adding tests:
1. Follow existing test patterns
2. Add descriptive test names
3. Update this README if adding new test categories
4. Ensure tests can run in CI/CD environments
