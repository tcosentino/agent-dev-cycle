# Proposal: Test-Spec Linkage System

## Problem Statement

Currently, there is no machine-readable connection between:
- **OpenSpec scenarios** (WHEN/THEN requirements)
- **Test code** (vitest test suites)
- **Coverage reporting** (which scenarios have tests)

This creates several problems:
1. **No traceability** - Can't track which specs have tests
2. **Manual verification** - Must manually check if requirements are tested
3. **No visibility** - Can't visualize coverage in the UI
4. **Hard for AI agents** - No clear pattern for generating tests from specs

## Proposed Solution

Create a **Test-Spec Linkage System** that:

1. **Extends testing framework** - Add `describeSpec()` wrapper for vitest
2. **Enhances spec format** - Add scenario IDs, priorities, and test status to specs
3. **Generates coverage manifests** - Automatic JSON reports showing spec coverage
4. **Enables visualization** - Structured data for UI display (future)
5. **Teaches AI agents** - Clear pattern for test generation

## Value Proposition

### For Developers
- ✅ Know exactly which specs need tests
- 📊 Track coverage trends over time
- 🔍 Find missing test coverage quickly
- 📝 Better documentation linkage

### For AI Agents
- 🤖 Clear pattern: Spec scenario → `describeSpec()` → Tests
- 📋 Machine-readable scenario IDs
- ✨ Can generate test stubs from specs
- 🎯 Know which scenarios to prioritize

### For Project Management
- 📈 Measure implementation completeness
- ⚠️ Identify high-priority gaps
- 📊 Report on requirement coverage
- ✅ Verify all critical paths tested

## Implementation Overview

### 1. New Package: `@agentforge/testing-framework`

```typescript
import { describeSpec } from '@agentforge/testing-framework'

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

### 2. Enhanced Spec Format

```markdown
#### Scenario: User creates task
**ID:** `task-crud-001`
**Priority:** high
**Test Status:** ✅ covered

- **WHEN** user clicks "New Task"
- **THEN** form appears

**Test Coverage:**
- `TaskForm.test.tsx` → "should show form"
```

### 3. Coverage Manifest Generation

```bash
yarn coverage:spec
```

Generates `coverage.json`:
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

### 4. Future: UI Visualization

Display coverage in AgentForge UI:
- Spec files show coverage badges
- Click scenario to see tests
- Filter by coverage status
- Highlight critical gaps

## Success Criteria

✅ **Technical**
- `@agentforge/testing-framework` package working
- All task-management-ui specs have scenario IDs
- Coverage script generates valid manifests
- Zero breaking changes to existing tests

✅ **Usability**
- Developers can easily adopt `describeSpec()`
- Coverage reports are readable
- Clear documentation and examples

✅ **Completeness**
- Comprehensive OpenSpec for the system itself
- Integration examples
- AI agent integration patterns documented

## Alternatives Considered

### Alternative 1: Manual Coverage Tracking
**Rejected** - Too error-prone, doesn't scale, no automation

### Alternative 2: Code Comments with Tags
```typescript
// @spec task-crud-001
describe('TaskForm', () => { ... })
```
**Rejected** - Less type-safe, harder to parse, not first-class

### Alternative 3: Separate Coverage Config File
```yaml
scenarios:
  task-crud-001:
    tests:
      - TaskForm.test.tsx
```
**Rejected** - Gets out of sync, extra maintenance burden

## Risks and Mitigation

### Risk: Adoption Overhead
**Mitigation**: Make it optional, zero breaking changes, show value immediately

### Risk: Maintenance Burden
**Mitigation**: Simple abstraction, automated scripts, clear docs

### Risk: False Sense of Coverage
**Mitigation**: Clarify that this tracks spec→test linkage, not code coverage

## Timeline

- **Phase 1** (Week 1): Package + Spec IDs + Retrofitting ✅ **COMPLETE**
- **Phase 2** (Week 2): Coverage script + OpenSpec + Docs 🏗️ **IN PROGRESS**
- **Phase 3** (Week 3): UI visualization (future)
- **Phase 4** (Week 4): AI agent integration patterns (future)

## Open Questions

1. **Should we track partial coverage?**
   - Yes - Mark scenarios as ⏳ partial if only some WHEN/THEN steps tested

2. **How to handle E2E tests vs unit tests?**
   - Both use `describeSpec()`, coverage script treats them equally

3. **Should coverage be enforced in CI?**
   - Not initially - informational only, can add threshold later

## Stakeholder Sign-Off

- [x] Engineering Lead - Approved
- [ ] Product Owner - Review pending
- [ ] QA Lead - Review pending

---

**Status**: ✅ Approved  
**Owner**: Subagent (Peggy)  
**Date**: 2026-02-11
