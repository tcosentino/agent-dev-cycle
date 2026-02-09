## UI Tests

End-to-end tests for AgentForge UI components based on OpenSpec specifications.

### Test Suites

#### File Tree Tests (`file-tree/`)
Tests for file tree navigation and file viewing functionality.

**Coverage:**
- Folder expand/collapse with chevron icons
- File selection and highlighting
- Tab management (open, close, activate)
- Service folder behavior (badges, icons)
- Nested folder indentation
- File categorization and icons

**Scenarios Tested:** 15+ core navigation scenarios

**Run:**
```bash
yarn playwright test src/services/testing/ui-tests/file-tree/
```

#### Session Panel Tests (`session-panel/`)
Tests for agent session progress monitoring.

**Coverage:**
- Session metadata display (status badges, duration)
- Stage progression (Clone → Load → Execute → Capture → Commit)
- Stage-specific log viewing
- Log display with timestamps and levels
- Copy logs to clipboard
- Retry failed sessions
- Status-specific styling (running=blue, completed=green, failed=red)

**Scenarios Tested:** 12+ session monitoring scenarios

**Run:**
```bash
yarn playwright test src/services/testing/ui-tests/session-panel/
```

### Test Helpers

Located in `../fixtures/test-helpers.ts`:

- **FileTreeHelper** - Navigate folders, click files, check expansion state
- **TabHelper** - Manage tabs, check open tabs, close tabs
- **SessionPanelHelper** - Interact with session panel, stages, logs

### Running Tests

**All UI tests:**
```bash
yarn test:ui
```

**Specific suite:**
```bash
yarn playwright test src/services/testing/ui-tests/file-tree/
```

**With UI mode (interactive):**
```bash
yarn playwright test src/services/testing/ui-tests/ --ui
```

**Debug mode:**
```bash
yarn playwright test src/services/testing/ui-tests/ --debug
```

### Writing New Tests

1. **Use OpenSpec scenarios** - Each WHEN/THEN scenario should become a test
2. **Use test helpers** - Don't duplicate selector logic
3. **Handle skip conditions** - Use `test.skip()` when preconditions aren't met
4. **Wait appropriately** - Use `waitForSelector` or `waitForTimeout` as needed
5. **Check visibility first** - Always verify elements exist before interacting

**Example:**
```typescript
test('click folder to expand', async ({ page }) => {
  const folder = fileTree.getFolder('src');
  
  if (!(await folder.isVisible())) {
    test.skip(); // Folder doesn't exist in test project
  }

  await fileTree.expandFolder('src');
  
  // Verify expansion
  const isExpanded = await fileTree.isFolderExpanded('src');
  expect(isExpanded).toBeTruthy();
});
```

### Test Coverage Goals

- **File Tree:** 90%+ of user interactions
- **Session Panel:** 85%+ of user interactions

### Future Test Suites

Based on OpenSpec specifications:

- Database table views
- Project CRUD operations
- Task management UI (when implemented)
- Agent session controls (when implemented)
- Deployment dashboard (when implemented)

### CI/CD Integration

Tests run automatically on:
- Every pull request
- Merge to main
- Nightly builds

**Status:** Tests must pass for PR to merge.

### Troubleshooting

**Tests fail locally but pass in CI:**
- Check browser version (use `npx playwright install`)
- Clear browser cache
- Check for localhost conflicts (port 5173)

**Timeout errors:**
- Increase timeout in test: `{ timeout: 30000 }`
- Check if dev server is running
- Verify network speed

**Element not found:**
- Check if test data/fixtures exist
- Verify selector syntax
- Use Playwright Inspector: `--debug`

**Flaky tests:**
- Add explicit waits before assertions
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded timeouts when possible
