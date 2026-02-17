# Agent Memory Index

This directory contains memories of bugs fixed, patterns learned, and decisions made while working on this codebase.

## Bug Fixes

- [render-loop-audit.md](render-loop-audit.md) - Systematic audit of React components for render loop issues (2026-02-11)
- [duplicate-file-loads.md](duplicate-file-loads.md) - Fixed agent files loading 6+ times due to parent component recreating objects (2026-02-11)
- [agent-list-flashing.md](agent-list-flashing.md) - Fixed agent list flashing/disappearing due to StrictMode double-mount wiping state (2026-02-11)
- [deployment-context-state-management.md](deployment-context-state-management.md) - Fixed UI not updating on deployment deletion using centralized React Context (2026-02-11)
- [deployment-cascade-delete.md](deployment-cascade-delete.md) - Fixed orphaned Docker containers/images when deployments deleted (2026-02-11)

## Feature Enhancements

- [agent-session-logging-enhancement.md](agent-session-logging-enhancement.md) - Enhanced agent session logs with git output, context files, and Claude streaming (2026-02-16)
- [agent-session-ux-improvements.md](agent-session-ux-improvements.md) - Markdown summary rendering, elapsed timer, notepad markdown, extractSummary fix (2026-02-16)
- [url-routing.md](url-routing.md) - GitHub-style URL routing with History API; popLocation pattern to prevent feedback loops (2026-02-16)

## Patterns Learned

### React Performance
- Memo dependencies should be stable references, not recreated objects
- Use `useRef` to track state across renders without triggering re-renders
- Effects should depend on primitive values (IDs, strings) not objects when possible
- Always merge with existing state when replacing large objects (StrictMode double-mount issue)
- Only trigger re-renders when data actually changes (use JSON comparison or reference equality)

### SSE & Real-time Updates
- SSE streams keep multiple clients synchronized
- Emit events for all state-changing operations
- Never use `window.location.reload()` when SSE can handle updates

### State Management
- Use React Context for centralized state with SSE streams
- One provider per data domain (deployments, tasks, etc.)
- Provide helper functions for common queries (getById, etc.)
- Components should consume context, not manage SSE connections directly
- Fresh data from context prevents stale state in detail views

### URL Routing

- Use `popLocation` (only updates on `popstate`) vs `pathname` (updates on all navigates) to prevent URL sync feedback loops
- Back/forward effects must watch `popLocation`, not `pathname`/`hash`
- Show "File not found" only when `Object.keys(files).length > 0` — empty files object means not yet loaded

### Developer Experience

- Use git's actual output format - developers know these messages
- Show raw stdout/stderr from git commands instead of custom messages
- Metadata (context files) belongs in UI sections, not buried in logs
- Real-time streaming > progress percentages for visibility

---

*Last updated: 2026-02-16*
