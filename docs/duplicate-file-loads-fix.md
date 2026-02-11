# Fix: Duplicate Agent File Loads

## Issue

Agent prompt files were being loaded 6+ times from the API:
```
http://localhost:5173/api/github/repos/.../contents/.agentforge/agents/lead/prompt.md
```

This was causing unnecessary network requests and potential performance issues.

## Root Cause

The issue had **two** contributing factors:

### 1. Parent Component Recreating Objects ([index.tsx:141-148](../src/services/agentforge-ui/index.tsx#L141-L148))

```typescript
// ❌ Before: Created new objects on EVERY render
const projectDisplayNames: Record<string, string> = {}
const projectRepoUrls: Record<string, string> = {}
for (const project of projects) {
  projectDisplayNames[project.id] = `${project.name} (${project.key})`
  if (project.repoUrl) {
    projectRepoUrls[project.id] = project.repoUrl
  }
}
```

**Problem**: These objects had new references on every render, even if `projects` didn't change.

### 2. Callback Depending on Unstable Objects ([index.tsx:161](../src/services/agentforge-ui/index.tsx#L161))

```typescript
// ❌ Callback changed on every render because projectRepoUrls was new
const handleLoadFileContent = useCallback(async (projectId: string, filePath: string) => {
  const repoUrl = projectRepoUrls[projectId]
  // ...
}, [projectRepoUrls]) // 🔴 This changed on every render!
```

### 3. Effect Without Deduplication ([ProjectViewer.tsx:416-441](../src/services/agentforge-ui/ProjectViewer.tsx#L416-L441))

```typescript
// ❌ No tracking to prevent duplicate requests
useEffect(() => {
  for (const filePath of pathsToLoad) {
    if (fileExists && fileContent === '' && onLoadFileContent) {
      onLoadFileContent(activeProject, filePath) // Could run multiple times!
    }
  }
}, [files, activeProject, onLoadFileContent]) // 🔴 onLoadFileContent changed every render
```

## The Cascade

1. **Render 1**: Parent renders, creates `projectRepoUrls` object
2. **Render 1**: `handleLoadFileContent` created with dependency on `projectRepoUrls`
3. **Render 1**: ProjectViewer mounts, effect runs, starts loading files
4. **File loads**: `setProjectFiles` called when content arrives
5. **Render 2**: Parent re-renders (files state changed)
6. **Render 2**: `projectRepoUrls` recreated with **new reference** (but same values)
7. **Render 2**: `handleLoadFileContent` recreated with **new reference**
8. **Render 2**: ProjectViewer effect re-runs (callback changed), loads files **again**
9. **Repeat**: This continued 6+ times as files loaded

## The Fix

### Part 1: Memoize Objects in Parent ([index.tsx](../src/services/agentforge-ui/index.tsx))

```typescript
// ✅ After: Only recreate when projects actually change
const projectDisplayNames = useMemo(() => {
  const names: Record<string, string> = {}
  for (const project of projects) {
    names[project.id] = `${project.name} (${project.key})`
  }
  return names
}, [projects])

const projectRepoUrls = useMemo(() => {
  const urls: Record<string, string> = {}
  for (const project of projects) {
    if (project.repoUrl) {
      urls[project.id] = project.repoUrl
    }
  }
  return urls
}, [projects])
```

**Result**: Objects only change when `projects` actually changes.

### Part 2: Add Deduplication Tracking ([ProjectViewer.tsx](../src/services/agentforge-ui/ProjectViewer.tsx))

```typescript
// ✅ Track which files have been requested
const loadingFilesRef = useRef<Set<string>>(new Set())

useEffect(() => {
  for (const filePath of pathsToLoad) {
    const loadKey = `${activeProject}:${filePath}`

    // Only load if not already requested
    if (fileExists && fileContent === '' && !loadingFilesRef.current.has(loadKey)) {
      loadingFilesRef.current.add(loadKey)
      onLoadFileContent(activeProject, filePath).catch((err) => {
        // Remove on error so it can be retried
        loadingFilesRef.current.delete(loadKey)
      })
    }
  }
}, [files, activeProject, onLoadFileContent])
```

**Result**: Even if the effect runs multiple times, each file is only loaded once.

## Why I Missed This Initially

When I audited for render loop issues, I:
- ✅ Found the infinite loop in ProjectViewer's refresh effect
- ✅ Checked components for effect dependency issues
- ❌ **Didn't trace back to parent components** creating unstable objects
- ❌ **Didn't look at the root `index.tsx`** that passes props down

The lesson: When auditing for render issues, always check:
1. The component with the effect
2. The parent components passing props
3. Any callbacks being passed down
4. Any objects/arrays being created inline

## Test Results

**Before**: Agent prompt files loaded 6+ times
**After**: Agent prompt files loaded exactly once

Check network tab in browser devtools to verify:
```
http://localhost:5173/api/github/repos/.../contents/.agentforge/agents/lead/prompt.md
```

Should appear only **once** per file, not multiple times.

## Related Fixes

This is similar to the infinite loop fix we made earlier:
- That one: Effect depended on derived **tab objects** that changed frequently
- This one: Effect depended on **callback** that changed because parent recreated objects

Both required:
1. Using stable references (tab IDs, memoized objects)
2. Preventing unnecessary effect re-runs
