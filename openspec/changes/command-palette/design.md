## Context

The AgentForge UI (`ProjectViewer.tsx`) is a complex React application with:
- State management using React hooks (useState, useCallback, useMemo)
- LocalStorage-based persistence for UI state
- Tab-based editor with multiple panes
- File tree, database table views, agent browser
- Existing keyboard event handling (likely minimal)
- Component library (`@agentforge/ui-components`) for reusable UI elements

Current navigation is mouse-driven with no global keyboard shortcuts. Users must click through nested trees to access files/pages.

## Goals / Non-Goals

**Goals:**
- Add command palette accessible via Cmd+K that doesn't interfere with existing UI
- Implement fuzzy search across files, database tables, and agent pages
- Provide keyboard navigation (arrow keys, Enter, Escape)
- Reuse or create reusable component in `@agentforge/ui-components`
- Maintain existing tab/pane behavior when opening items

**Non-Goals:**
- Replacing existing navigation methods (file tree, sidebar, tabs)
- Advanced features (recently used items, command execution, frecency ranking)
- Backend API changes (all data already available in ProjectViewer state)
- Mobile/touch optimization (keyboard-first feature)

## Decisions

### Decision 1: Component location and reusability
**Choice:** Create `CommandPalette` in `@agentforge/ui-components` package

**Rationale:**
- Makes component reusable across other UIs (demo-ui could use it too)
- Enforces proper separation of concerns (generic vs app-specific logic)
- Easier to test in isolation

**Alternative considered:** Inline in `ProjectViewer.tsx`
- Faster initial implementation but not reusable
- Would couple generic command palette logic with ProjectViewer state

### Decision 2: Fuzzy search library
**Choice:** Use `fuse.js` for fuzzy matching

**Rationale:**
- Lightweight (~10KB gzipped)
- Good balance of features and performance
- Supports weighted search across multiple fields
- Well-maintained and widely used

**Alternative considered:** Native string matching
- Would require building fuzzy logic ourselves
- Inferior UX compared to established library

### Decision 3: Keyboard shortcut handling approach
**Choice:** Single global event listener at ProjectViewer root with conditional logic

**Rationale:**
- Simplest approach for single shortcut
- Easy to prevent conflicts with text inputs
- Centralized management of keyboard state

**Alternative considered:** Dedicated keyboard shortcut manager
- Overkill for one shortcut
- Can evolve to this if we add more shortcuts later

### Decision 4: Search index structure
**Choice:** Build search index from existing ProjectViewer state on palette open

**Rationale:**
- No additional data fetching needed
- Index is always fresh (built from current state)
- Minimal performance impact (hundreds of items, not thousands)

**Alternative considered:** Pre-built index updated on state changes
- More complex state management
- Premature optimization for current scale

### Decision 5: Opening items from palette
**Choice:** Reuse existing `openTab` function in ProjectViewer

**Rationale:**
- Maintains consistency with existing navigation behavior
- No duplication of tab management logic
- Command palette just triggers existing actions

## Risks / Trade-offs

**[Risk]** Keyboard shortcut conflicts with browser/extensions
→ **Mitigation:** Detect platform (Cmd on Mac, Ctrl elsewhere), call preventDefault(), document the shortcut

**[Risk]** Performance degradation with large projects (1000+ files)
→ **Mitigation:** Initially acceptable (typical projects < 500 items), can add virtualization/pagination later if needed

**[Risk]** Fuzzy search ranking may not match user expectations
→ **Mitigation:** Use weighted search (filename > path > type), iterate based on feedback

**[Trade-off]** Adding fuse.js dependency increases bundle size (~10KB)
→ **Acceptable:** UX improvement justifies small bundle increase

## Architecture

### Component structure
```
CommandPalette (ui-components)
├── Props: items[], onSelect, onClose, open
├── State: searchQuery, selectedIndex
└── Renders: Modal overlay + search input + results list

ProjectViewer
├── State: showCommandPalette (boolean)
├── Handler: handleCommandPaletteSelect(item) → calls openTab()
└── Keyboard: useEffect for Cmd+K listener
```

### Data flow
1. User presses Cmd+K → ProjectViewer sets `showCommandPalette = true`
2. ProjectViewer builds items array from current state (files, tables, agents)
3. CommandPalette receives items, renders search UI
4. User types → fuse.js filters items → results update
5. User selects item → `onSelect` callback → ProjectViewer's `openTab()` → palette closes

### Search item interface
```typescript
interface CommandPaletteItem {
  id: string           // unique identifier
  label: string        // display name
  description?: string // secondary text (path, table name, etc.)
  type: 'file' | 'table' | 'agent' | 'session'
  icon: ReactNode
  metadata: any        // type-specific data for opening (path, tableName, etc.)
}
```

## Migration Plan

This is a purely additive feature with no breaking changes:

1. **Phase 1:** Add fuse.js dependency to project
2. **Phase 2:** Create CommandPalette component in ui-components with basic rendering
3. **Phase 3:** Integrate into ProjectViewer with Cmd+K handler
4. **Phase 4:** Build search index from ProjectViewer state
5. **Phase 5:** Wire up item selection to existing openTab logic

**Rollback:** Feature can be disabled by removing keyboard listener or hiding palette. No data migration required.

## Open Questions

1. Should we persist recently used items for quick access? (Future enhancement, not MVP)
2. Should palette remember search query between opens? (Probably no - fresh start each time)
3. Do we need configurable keyboard shortcuts? (No, Cmd+K is standard)
