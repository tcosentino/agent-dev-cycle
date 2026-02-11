## Why

The current tab system in the AgentForge UI uses a type-driven architecture with hardcoded tab types (`'file'`, `'table'`, `'record'`, etc.) and a large switch statement to map types to React components. This creates tight coupling between tab definitions, rendering logic, and creation functions, making it difficult to add new tab types or create one-off custom tabs without modifying core ProjectViewer code. A generic, component-based tab system would enable any React component to be displayed as a tab without requiring type definitions or modifications to the tab management infrastructure.

## What Changes

- **Refactor tab data model** from type-driven (`TabType` union) to component-driven (generic `Tab` interface with `component` and `componentProps` fields)
- **Replace specialized tab opener functions** (`openFile()`, `openTable()`, `openRecord()`, etc.) with unified `openTab()` and `openTabAdjacent()` APIs
- **Remove switch statement in `renderTabContent()`** - tabs render their own components directly
- **Move tab menu options to tab creation** - components provide their own menu options instead of `toTabs()` computing them based on type
- **Update persistence layer** to use category-based reconstruction instead of type-based serialization
- **Remove `TabType` union and `OpenTab` interface** from codebase
- **Add new generic types**: `Tab`, `TabMenuOption`, `OpenTabConfig` interfaces
- Enable **any React component to become a tab** without modifying ProjectViewer

## Capabilities

### New Capabilities

- `generic-tab-management`: Generic tab system that accepts any React component as tab content, with unified creation API and component-provided menu options

### Modified Capabilities

- `tab-persistence`: Update localStorage persistence to use category-based reconstruction instead of type-based serialization, allowing tabs to be restored after page reload without hardcoded type mappings

## Impact

### Code Changes

**New Files:**
- `src/services/agentforge-ui/types/tabs.ts` - Generic tab type definitions

**Modified Files:**
- `src/services/agentforge-ui/ProjectViewer.tsx` - Major refactor:
  - Remove 6 specialized opener functions (~100 lines)
  - Replace `renderTabContent()` switch statement (~200 lines) with generic component rendering (~5 lines)
  - Add `openTab()` and `openTabAdjacent()` functions
  - Update persistence serialization and reconstruction logic
  - Update all internal call sites (~15 locations) to use new API
- `src/services/agentforge-ui/components/constants.ts` - Remove old types (`TabType`, `OpenTab`)

**Unchanged Files:**
- `packages/ui-components/src/components/TabbedPane/TabbedPane.tsx` - Already generic
- All tab content components (FileViewer, DatabaseTableView, TaskDetailView, etc.) - Just passed as props

### Breaking Changes

**BREAKING**: All code calling tab opener functions must migrate to new API:

**Before:**
```typescript
openFile('/src/main.ts')
openRecord('tasks', record, '123')
```

**After:**
```typescript
openTab({
  id: 'file:/src/main.ts',
  label: 'main.ts',
  component: FileViewer,
  componentProps: { path: '/src/main.ts', files },
  icon: <FileIcon />,
  metadata: { category: 'file', path: '/src/main.ts' }
})

openTabAdjacent({
  id: 'record:tasks:123',
  label: 'Task Detail',
  component: TaskDetailView,
  componentProps: { taskId: '123', record },
  icon: <TaskIcon />,
  metadata: { category: 'record', tableName: 'tasks' }
})
```

### Benefits

1. **Extensibility** - Add new tab types by calling `openTab()` with any component, no code changes to ProjectViewer
2. **Decoupling** - Tab content rendering logic stays with components, not centralized in ProjectViewer
3. **Flexibility** - One-off custom tabs don't need type definitions or registration
4. **Simplicity** - Eliminates switch statements and type guards
5. **Explicitness** - Tab configuration is clear and visible at call site

### Risks

1. **Type Safety Loss** - TypeScript can't guarantee tab-specific properties exist (mitigated by component prop types)
2. **Verbosity** - More code required at call sites (mitigated by allowing local helper functions)
3. **Persistence Complexity** - Category-based reconstruction requires maintaining reconstruction logic for each category
4. **Migration Effort** - All call sites must be updated to new API

### Dependencies

- No new external dependencies
- Requires TypeScript 4.5+ for existing project
- React 18+ (already in use)

### Testing Impact

- All existing tab-related tests need updates for new API
- Persistence tests need updates for category-based reconstruction
- Need new tests for generic tab creation (arbitrary components)

### Performance

- Minimal impact: same render cycle, just different data structure
- Slightly less memory per tab (no type-specific optional fields)
- No impact on TabbedPane component (already generic)
