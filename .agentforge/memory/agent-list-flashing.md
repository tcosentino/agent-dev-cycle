# Agent List Flashing Fix

**Date:** 2026-02-11

## Issue

Agent list would flash - showing 1, 2, 3, then all 4 agents, then disappear completely, leaving an empty agent list.

## Root Causes

Multiple compounding issues caused this behavior:

### 1. React StrictMode Double-Mount (Primary Issue)

**Location:** [index.tsx:45-113](../src/services/agentforge-ui/index.tsx#L45-L113)

React StrictMode in development causes effects with empty dependencies to run twice:
1. Mount → effect runs → state updates
2. Unmount (cleanup)
3. **Remount → effect runs AGAIN → state resets**

The `loadData` effect was calling `setProjectFiles(files)` which **replaced** the entire state:

```typescript
// ❌ Before: Replaced entire state, losing loaded content
setProjectFiles(files)  // files has empty strings for all paths
```

This wiped out content that had been loaded via `handleLoadFileContent` during the first mount.

**Fix:** Merge with existing state to preserve loaded content:

```typescript
// ✅ After: Merge with existing state
setProjectFiles(prev => {
  const merged: ProjectData = { ...prev }
  for (const [projectId, projectFiles] of Object.entries(files)) {
    merged[projectId] = { ...prev[projectId], ...projectFiles }
    // Keep loaded content if it exists
    for (const [filePath, content] of Object.entries(prev[projectId] || {})) {
      if (content && content !== '' && (!projectFiles[filePath] || projectFiles[filePath] === '')) {
        merged[projectId][filePath] = content
      }
    }
  }
  return merged
})
```

### 2. Snapshot Sync Causing Unnecessary Re-renders

**Location:** [ProjectViewer.tsx:392-418](../src/services/agentforge-ui/ProjectViewer.tsx#L392-L418)

The snapshot sync effect was updating `openTabs` even when record data hadn't changed:

```typescript
// ❌ Before: Always created new tab objects
setOpenTabs(prev => prev.map(tab => {
  return { ...tab, record: freshRecord }  // New object every time!
}))
```

**Fix:** Only update when data actually changes:

```typescript
// ✅ After: Compare and only update if different
setOpenTabs(prev => {
  let hasChanges = false
  const updated = prev.map(tab => {
    if (freshRecord && JSON.stringify(tab.record) !== JSON.stringify(freshRecord)) {
      hasChanges = true
      return { ...tab, record: freshRecord }
    }
    return tab
  })
  return hasChanges ? updated : prev  // Keep reference if no changes
})
```

### 3. Incremental Agent Loading Causing Flashing

**Location:** [ProjectViewer.tsx:461-499](../src/services/agentforge-ui/ProjectViewer.tsx#L461-L499)

The agents memo was recalculating every time a single config file loaded, showing 1 agent, then 2, then 3, then 4.

**Initial approach (too restrictive):** Wait for ALL configs to load before showing any.

**Final approach (resilient):** Show agents as they load, but ensure the list doesn't disappear once loaded.

```typescript
// Parse agents from loaded configs (filters out empty files)
const loadedConfigPaths = agentConfigPaths.filter(p => files[p] && files[p] !== '')
```

This works because once files are loaded, they stay loaded (thanks to the StrictMode fix).

## Timeline of Fixes

1. **Fixed nested button** - Changed inner button to div to prevent validation error
2. **Fixed snapshot sync** - Only update tabs when record data actually changes
3. **Fixed agent loading** - Wait for all configs OR parse loaded ones (tried both)
4. **Fixed StrictMode** - **THIS WAS THE KEY** - Preserve loaded content during remount

## Key Learnings

### React StrictMode in Development

- Effects with `[]` dependencies run **twice** in development
- First mount → unmount → second mount
- State updates during first mount can be wiped by second mount
- **Always merge with existing state** when replacing large objects

### State Update Patterns

```typescript
// ❌ BAD: Replaces entire state
setState(newValue)

// ✅ GOOD: Merges with existing state
setState(prev => ({ ...prev, ...newValue }))

// ✅ BETTER: Preserves nested content
setState(prev => {
  const merged = { ...prev }
  // Carefully merge, preserving loaded content
  return merged
})
```

### Debugging Techniques

1. Add console logs to track state changes
2. Check if issue only happens in development (StrictMode)
3. Look for effects that replace entire state objects
4. Compare before/after values to see what's changing

## Related Files

- [index.tsx](../src/services/agentforge-ui/index.tsx) - Parent component with StrictMode issue
- [ProjectViewer.tsx](../src/services/agentforge-ui/ProjectViewer.tsx) - Child component with agents memo
- [DeploymentViews.tsx](../src/services/agentforge-ui/components/DeploymentViews.tsx) - Nested button fix

## Prevention

When working with effects that load data:

1. ✅ Use merge pattern: `setState(prev => ({ ...prev, ...updates }))`
2. ✅ Test in StrictMode (default in dev)
3. ✅ Check if effect runs multiple times
4. ✅ Preserve loaded content when resetting structure
5. ✅ Only trigger re-renders when data actually changes
