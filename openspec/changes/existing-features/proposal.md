## Why

AgentForge has several core features already implemented and working, but they lack formal specifications. This creates risks:

**Without specs:**
- ❌ No systematic testing (relying on manual QA)
- ❌ Unclear what "correct behavior" is when bugs appear
- ❌ New contributors don't know how features should work
- ❌ Refactoring is risky (might break undocumented behavior)
- ❌ Feature regressions go unnoticed

**With specs:**
- ✅ Generate automated tests from WHEN/THEN scenarios
- ✅ Living documentation of how features work
- ✅ Catch regressions before they ship
- ✅ Onboard contributors faster
- ✅ Refactor with confidence

## What Changes

Document existing features using OpenSpec methodology:

### 1. File Tree & File Viewing
The file tree is AgentForge's primary navigation. Users:
- Browse project files in hierarchical tree
- Expand/collapse folders
- Click files to open in tabs
- See file categories (config, source, session transcripts, etc.)
- Navigate between open files via tabs
- Close tabs

**Currently implemented, needs specs for:**
- Tree navigation and folder expansion
- File opening and tab management
- File categorization logic
- Simple vs detailed view modes
- File icons based on type/category

### 2. Agent Session Progress Panel
The session panel shows real-time agent work. Users:
- View session metadata (agent, phase, status)
- See progress through task steps
- Read session logs/transcripts
- Track session duration
- See session completion summary

**Currently implemented, needs specs for:**
- Progress indicator updates
- Log/transcript display
- Session status badges (running, completed, failed)
- Session metadata display
- Session completion summary

## Capabilities

### Modified Capabilities (documenting existing)
- `file-tree`: Hierarchical file browser with expand/collapse
- `file-viewing`: Open files in tabs, syntax highlighting (read-only)
- `agent-session-panel`: Display session progress and logs

### No New Capabilities
This is purely documentation and test generation for existing features.

## Impact

**No Code Changes:**
- These specs document what already exists
- No implementation work needed

**Testing Changes:**
- Generate Playwright tests from scenarios
- Add to CI/CD pipeline
- Catch regressions automatically

**Documentation Changes:**
- Specs become canonical reference for features
- Easy to onboard new contributors
- Clear expected behavior for bug reports

## Success Criteria

**Each spec should:**
1. Cover all major user interactions
2. Include edge cases and error states
3. Be comprehensive enough to generate tests
4. Serve as complete feature documentation

**Outcome:**
- 80%+ test coverage for file tree and session panel
- Zero ambiguity about expected behavior
- Tests catch regressions before merge
