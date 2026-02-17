# URL Routing Implementation

**Date:** 2026-02-16

## What Was Built

GitHub-style URL routing for the AgentForge SPA using the native History API (no React Router dependency).

## URL Format

```text
/{owner}/{repo}/tree/{branch}/{filePath}                                   # file/service
/{owner}/{repo}/tree/{branch}/.agentforge/agents/{id}                     # agent panel
/{owner}/{repo}/tree/{branch}/.agentforge/agents/{id}/sessions/{sessionId} # agent session
/{owner}/{repo}/{tableName}                                                # DB table
/{owner}/{repo}/{tableName}/{recordKey}                                    # DB record
```

Panel sub-tabs use `#hash` (e.g., `#overview`, `#sessions`, `#stages`).

## Key Files

- `src/services/agentforge-ui/routing.ts` — `ParsedUrl` discriminated union, `parseUrl()`, `tabToUrl()`, `findProjectByRepoUrl()`
- `src/services/agentforge-ui/hooks/useAppRouter.ts` — History API hook
- `src/services/agentforge-ui/index.tsx` — project resolution, auth redirect, passes `activateUrl` to `ProjectViewer`
- `src/services/agentforge-ui/ProjectViewer.tsx` — `applyUrlToTab()`, URL sync effect, `activePanelHash` state

## Critical Pattern: Avoiding URL Feedback Loops

**Problem:** URL sync effect fires on tab change → calls `navigate()` → updates `pathname` state → back/forward effect fires → sets `activateUrl` → opens/activates tab → URL sync fires again → infinite loop.

**Solution:** `useAppRouter` exposes two separate signals:
- `pathname`/`hash` — updates on both programmatic `navigate()` and `popstate`
- `popLocation` — **only updates on `popstate`** (browser back/forward), never on `navigate()`

The back/forward effect in `index.tsx` watches `popLocation`, so it only fires on actual user navigation:

```typescript
// CORRECT — watches popLocation, not pathname
useEffect(() => {
  const parsed = parseUrl(popLocation.pathname, popLocation.hash)
  // ...
}, [popLocation])

// WRONG — would create a feedback loop
useEffect(() => {
  const parsed = parseUrl(pathname, hash)
  // ...
}, [pathname, hash])
```

## File Loading Race Condition Fix

When a file URL is deep-linked, `files` may be `{}` before the project's file listing has loaded. The `renderTabContent` check was showing "File not found" prematurely.

**Fix:** Only show "File not found" when the file listing has actually loaded:

```typescript
const filesLoaded = Object.keys(files).length > 0
if (cachedContent === undefined && filesLoaded) {
  return <div>File not found</div>
}
// Otherwise render FileContentLoader — it will fetch on demand
```

## `applyUrlToTab` Dependencies

`applyUrlToTab` is a `useCallback` with `files` in its dep array (for service detection). The activateUrl effect uses `lastActivateUrlRef` to avoid double-applying. If files change after the initial activation, the effect won't re-run because the ref already holds the same URL object — this is intentional since file content loads lazily via `FileContentLoader`.

## Auth Flow

- Not logged in: save `window.location.href` to `sessionStorage` as `agentforge:returnTo`, redirect to login
- On mount after login: read `returnTo` from sessionStorage, call `navigate(returnTo, '', true)`, clear it
- Project not found for URL owner/repo: show "no access" error with logout button

## `agentId` on agentSession Tabs

Agent session URLs need `agentId` for the path structure (`.agentforge/agents/{id}/sessions/{sessionId}`). Since sessions only store `sessionId` natively, `agentId` is passed through `openAgentSession(sessionId, agentId)` and persisted in `SerializedTab.agentId`. Without it, `tabToUrl` returns `null` for agentSession tabs.
