# Bug: Infinite Render Loop in Workload Detail Page

## Summary

Opening a workload detail page causes an infinite render loop, continuously refreshing the snapshot and updating components endlessly.

## Reproduction

Run the test:
```bash
npx vitest run src/services/agentforge-ui/ProjectViewer.test.tsx
```

The test `reproduces the infinite loop when SSE updates trigger snapshot changes` will FAIL, demonstrating the bug.

## Console Logs

The bug manifests with these logs repeating endlessly:

```
[ProjectViewer] Refreshing snapshot for table: deployments
[ProjectViewer] Snapshot changed, syncing tab records
[ProjectViewer] Updated record for tab: workloads 7ee56e00-88e7-46ef-b41f-3fa31e301057
[ProjectViewer] Refresh effect triggered {tabType: 'table', tabPath: 'deployments', ...}
```

## Root Cause

The infinite loop is caused by a circular dependency in [ProjectViewer.tsx](../src/services/agentforge-ui/ProjectViewer.tsx):

1. **Deployments table tab is active** (line 858 effect dependency: `activeLeftTab`)
2. **Effect triggers refresh** when deployments table is active (lines 848-853)
3. **Refresh updates snapshot** via `onRefreshSnapshot` callback
4. **Snapshot update triggers tab sync** (lines 393-413)
5. **Tab sync updates `openTabs` state** with fresh record data (line 408)
6. **New `openTabs` causes `activeLeftTab` to be a new object** (line 465: `useMemo`)
7. **Changed `activeLeftTab` triggers the effect again** (line 858 dependency)
8. **Loop back to step 2** - infinite cycle

### Key Code Locations

- **Effect with problematic dependencies**: [ProjectViewer.tsx:836-858](../src/services/agentforge-ui/ProjectViewer.tsx#L836-L858)
  ```typescript
  useEffect(() => {
    const activeTab = activePane === 'left' ? activeLeftTab : activeRightTab
    if (activeTab?.type === 'table') {
      if (tableName === 'deployments' || tableName === 'workloads') {
        onRefreshSnapshot?.(activeProject)
      }
    }
  }, [activeLeftTab, activeRightTab, activePane, activeProject])
  ```

- **Tab sync that creates new objects**: [ProjectViewer.tsx:393-413](../src/services/agentforge-ui/ProjectViewer.tsx#L393-L413)
  ```typescript
  useEffect(() => {
    if (!snapshot) return
    setOpenTabs(prev => prev.map(tab => {
      if (tab.type !== 'record' || !tab.tableName) return tab
      const freshRecord = tableData?.find(...)
      if (freshRecord) {
        return { ...tab, record: freshRecord } // Creates new object!
      }
      return tab
    }))
  }, [snapshot])
  ```

- **Memo that creates new tab objects**: [ProjectViewer.tsx:465-467](../src/services/agentforge-ui/ProjectViewer.tsx#L465-L467)
  ```typescript
  const leftTabs = useMemo(() => openTabs.filter(t => t.pane === 'left'), [openTabs])
  const rightTabs = useMemo(() => openTabs.filter(t => t.pane === 'right'), [openTabs])
  ```

## Test Results

The failing test shows:
```
🐛 INFINITE LOOP REPRODUCED!
   With 5 SSE updates, we got 7 refresh calls
   This means EACH snapshot update triggers a refresh!
```

## Impact

- UI freezes and becomes unresponsive
- Excessive API calls to refresh snapshot
- High CPU usage from continuous re-renders
- Poor user experience when viewing workload details

## Fix Applied ✅

The bug has been fixed by changing the refresh effect to depend on **tab IDs** instead of **tab objects**.

### Changes Made

[ProjectViewer.tsx:839-858](../src/services/agentforge-ui/ProjectViewer.tsx#L839-L858)

**Before:**
```typescript
useEffect(() => {
  const activeTab = activePane === 'left' ? activeLeftTab : activeRightTab
  // ... refresh logic
}, [activeLeftTab, activeRightTab, activePane, activeProject])
```

**After:**
```typescript
useEffect(() => {
  // Use tab IDs instead of tab objects to avoid re-triggering when tab contents change
  const activeTabId = activePane === 'left' ? activeTabIds.left : activeTabIds.right
  const activeTab = openTabs.find(t => t.id === activeTabId)
  // ... refresh logic
}, [activeTabIds.left, activeTabIds.right, activePane, activeProject])
```

### Why This Works

- Tab **IDs** are strings that don't change when tab contents update
- Tab **objects** are recreated every time `openTabs` changes (e.g., when syncing record data)
- By depending on IDs instead of objects, the effect only triggers when:
  - The active tab changes (user switches tabs)
  - The active pane changes (user switches left/right)
  - The active project changes
- The effect **no longer triggers** when tab sync updates record data in existing tabs

### Test Results

All tests now pass:

```bash
npx vitest run src/services/agentforge-ui/ProjectViewer.test.tsx
```

**Before fix:**
```
With 5 SSE updates, we got 7 refresh calls
🐛 INFINITE LOOP REPRODUCED!
```

**After fix:**
```
SSE Updates: 5
Refresh Calls: 1
Expected: ≤2 refresh calls
✓ All tests passed
```

The fix eliminates the infinite loop while preserving the intended behavior of refreshing when users switch to deployment/workload tabs.
