## Context

These specs document **existing, implemented features** in AgentForge. No new code is required - this is purely documentation and test generation.

### Features Being Documented

1. **File Tree & File Viewing**
   - Component: `FileTreeNode` in `src/services/agentforge-ui/components/FileTree.tsx`
   - Used in: `ProjectViewer` main navigation
   - Current functionality: Browse files, open in tabs, categorize by type

2. **Agent Session Progress Panel**
   - Component: `AgentSessionProgressPanel` in `src/services/agentforge-ui/components/AgentSessionPanel/`
   - Used in: Session detail view
   - Current functionality: Show session progress, stages, logs, retry failed sessions

## Goals / Non-Goals

**Goals:**
- Document existing behavior as testable specs
- Generate Playwright tests from scenarios
- Create regression prevention suite
- Serve as living documentation for contributors

**Non-Goals:**
- Implement new features (separate PRs)
- Change existing behavior
- Refactor components (separate effort)

## Approach

### 1. Analyze Existing Code
Review actual implementation to understand:
- What interactions are supported
- How state is managed
- What edge cases exist
- What error handling is present

### 2. Write WHEN/THEN Scenarios
Convert behaviors into testable scenarios:
```markdown
#### Scenario: Click folder to expand
- **WHEN** user clicks collapsed folder
- **THEN** folder expands showing children
```

### 3. Generate Playwright Tests
Each scenario becomes a test:
```typescript
test('click folder to expand', async ({ page }) => {
  // GIVEN collapsed folder
  await page.click('[data-folder="src"]');
  
  // THEN folder expands
  await expect(page.locator('[data-folder="src/components"]')).toBeVisible();
});
```

### 4. Run Tests in CI/CD
- Add to GitHub Actions
- Fail PRs if tests fail
- Prevent regressions

## Test Coverage Goals

### File Tree
- ✅ Folder expand/collapse
- ✅ File selection
- ✅ Tab management
- ✅ Service folder behavior
- ✅ File categorization
- ✅ View mode toggle
- ✅ Keyboard navigation
- ✅ Persistence (expanded folders, active file)

**Target:** 90%+ coverage of user interactions

### Agent Session Panel
- ✅ Session metadata display
- ✅ Stage progression
- ✅ Log display and filtering
- ✅ Auto-scroll behavior
- ✅ Copy logs
- ✅ Retry failed sessions
- ✅ Real-time updates (polling)
- ✅ Error states

**Target:** 85%+ coverage of user interactions

## Implementation Plan

### Phase 1: File Tree Tests (Week 1)
1. Set up Playwright test fixtures (project with known file structure)
2. Write tests for folder expansion scenarios
3. Write tests for file selection and tab management
4. Write tests for service folder behavior
5. Write tests for view mode toggle
6. Write tests for persistence

### Phase 2: Session Panel Tests (Week 1-2)
1. Set up fixtures (mock agent sessions with different states)
2. Write tests for session metadata display
3. Write tests for stage progression
4. Write tests for log display
5. Write tests for auto-scroll
6. Write tests for copy logs
7. Write tests for retry functionality

### Phase 3: CI/CD Integration (Week 2)
1. Add Playwright to GitHub Actions
2. Configure test environments
3. Set up test reporting
4. Enable PR checks (tests must pass to merge)

## Test Fixtures

### File Tree Fixtures
```
test-project/
├── src/
│   ├── components/
│   │   └── Button.tsx
│   └── index.ts
├── .agentforge/
│   ├── PROJECT.md
│   └── agents/
│       └── engineer/
├── src/services/
│   ├── user-dataobject/
│   │   └── service.json
│   └── auth-integration/
│       └── service.json
└── package.json
```

### Session Panel Fixtures
```typescript
const mockSessions = {
  running: {
    id: 'session-1',
    status: 'running',
    currentStage: 'executing',
    logs: [...],
  },
  completed: {
    id: 'session-2',
    status: 'completed',
    duration: 312000,
    commits: ['abc1234'],
  },
  failed: {
    id: 'session-3',
    status: 'failed',
    currentStage: 'executing',
    error: 'Task failed: ...',
  },
};
```

## Future Enhancements

After specs and tests are in place, potential improvements:

**File Tree:**
- Search/filter files
- Drag-and-drop file operations
- Context menu (rename, delete, etc.)
- Git status indicators
- Virtual scrolling for large trees

**Session Panel:**
- Real-time WebSocket updates (vs polling)
- File diff viewer inline
- Expandable log details
- Export logs as file
- Session comparison (compare two runs)

These would be separate PRs with their own specs.

## Documentation

Specs serve as documentation in multiple forms:

1. **User Guide:** WHEN/THEN scenarios explain features
2. **Developer Guide:** Design decisions and architecture
3. **Test Suite:** Executable specification
4. **Bug Reports:** Reference for expected behavior

## Risks / Mitigations

**[Risk]** Specs don't match actual implementation
→ **Mitigation:** Review code carefully while writing specs, test specs against real app

**[Risk]** Tests are brittle (break on minor UI changes)
→ **Mitigation:** Use semantic selectors (data-testid, role, label) not brittle CSS selectors

**[Risk]** Test fixtures diverge from reality
→ **Mitigation:** Use real project structure, minimize mocking, update fixtures with app changes
