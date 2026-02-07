# AgentForge Tests

This directory contains tests for validating AgentForge projects.

## Test Suites

### AgentForge Structure Tests
**File:** `agentforge-structure.spec.ts`

Validates the `.agentforge` directory structure for any AgentForge project. These tests ensure:

1. **Directory Structure**
   - `.agentforge` directory exists
   - `.agentforge/agents` directory exists
   - Each agent has its own folder

2. **Agent Configuration**
   - Each agent folder has `config.json`
   - Each agent folder has `prompt.md`
   - Each agent folder has `sessions/` directory
   - Config files are valid JSON
   - Required fields exist: `id`, `model`, `maxTokens`
   - Model is one of: `opus`, `sonnet`, `haiku`
   - maxTokens is positive number
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

### Running Structure Tests

```bash
# Run all structure tests
npx playwright test tests/agentforge-structure.spec.ts

# Run specific test
npx playwright test tests/agentforge-structure.spec.ts --grep "config.json"

# Run with reporter
npx playwright test tests/agentforge-structure.spec.ts --reporter=list
```

### Vite Build Tests
**File:** `vite-build.spec.ts`

Tests for the Vite build configuration and UI loading:

1. **404 Error Detection**
   - No 404 errors when loading agentforge-ui
   - No 404 errors when loading demo-ui

2. **Agent Loading**
   - Agents load from config files
   - Agent parsing succeeds
   - Agents section appears in sidebar

### Running Build Tests

```bash
# Start dev servers first
yarn dev

# In another terminal, run tests
npx playwright test tests/vite-build.spec.ts
```

## Adding Tests to CI/CD

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Validate AgentForge Structure
  run: npx playwright test tests/agentforge-structure.spec.ts

- name: Run Build Tests
  run: |
    yarn dev &
    sleep 10
    npx playwright test tests/vite-build.spec.ts
```

## Test Coverage

These tests help prevent:
- ❌ Missing agent configuration files
- ❌ Invalid JSON in config files
- ❌ Empty prompt files
- ❌ Duplicate agent IDs
- ❌ Malformed directory structure
- ❌ 404 errors in UI
- ❌ Agent loading failures

## Creating Tests for New Features

When adding new features to `.agentforge` structure:

1. Add validation tests to `agentforge-structure.spec.ts`
2. Update this README with new requirements
3. Run tests locally before committing
4. Ensure tests are deterministic and can run in CI

## Debugging Test Failures

If structure tests fail:

```bash
# Run with verbose output
npx playwright test tests/agentforge-structure.spec.ts --reporter=list

# Check your .agentforge structure
ls -la .agentforge/agents/*/

# Validate JSON manually
cat .agentforge/agents/pm/config.json | jq .
```

## Test Philosophy

These tests follow the principle:
> "Test the structure, not the implementation"

They validate the contract that AgentForge projects must follow, ensuring compatibility across tools and preventing breaking changes.
