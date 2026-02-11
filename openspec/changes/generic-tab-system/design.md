## Context

The AgentForge UI features a dual-pane tabbed editor (similar to VS Code) that currently uses a type-driven architecture. The system has:

**Current Architecture:**
- `TabType` union type with 6 hardcoded values: `'file' | 'table' | 'record' | 'service' | 'agentSession' | 'agent'`
- `OpenTab` interface with type-specific optional fields mixed together
- 6 specialized opener functions (openFile, openTable, openRecord, etc.)
- 200-line `renderTabContent()` switch statement mapping types to components
- `toTabs()` function that computes menu options based on tab type
- Persistence layer that serializes/deserializes based on type

**Constraints:**
- Cannot break existing tab functionality during migration
- Must maintain persistence across page reloads
- React components cannot be serialized to localStorage
- TabbedPane component (shared UI library) should remain unchanged
- Must support existing patterns: file tabs, table tabs, detail views, agent sessions

**Stakeholders:**
- Developers adding new tab types (simplified workflow)
- Users relying on tab persistence (no data loss)
- Codebase maintainers (reduced complexity)

## Goals / Non-Goals

**Goals:**
1. Enable any React component to become a tab without modifying ProjectViewer
2. Eliminate type-driven coupling (switch statements, type guards, optional fields)
3. Provide unified API: `openTab()` and `openTabAdjacent()`
4. Maintain all existing tab functionality (persistence, menus, drag/drop)
5. Make tab configuration explicit and visible at call sites

**Non-Goals:**
1. Changing TabbedPane component UI or behavior
2. Modifying tab content components (FileViewer, DatabaseTableView, etc.)
3. Adding new tab features beyond what exists today
4. Optimizing tab rendering performance (already adequate)
5. Supporting server-side rendering or cross-window tab sharing

## Decisions

### Decision 1: Component-Based Tab Model

**Choice:** Store React component and props directly in tab data structure

**Alternatives Considered:**
1. **Type registry pattern** - Map string types to components via registry
   - Pro: Maintains type system, easier to serialize
   - Con: Still requires registration, doesn't enable arbitrary components
2. **Component name strings** - Store component names as strings, look up via registry
   - Pro: Serializable to localStorage
   - Con: Requires maintaining global component registry, fragile with refactoring
3. **Component + props model (chosen)**
   - Pro: Maximum flexibility, no registry needed, components are self-describing
   - Con: Cannot serialize components directly, requires reconstruction logic

**Rationale:** Maximum flexibility is the primary goal. We accept the complexity of reconstruction logic in exchange for enabling any component to become a tab without registration or type definitions.

### Decision 2: Category-Based Persistence

**Choice:** Use `metadata.category` string to reconstruct tabs from localStorage

**Alternatives Considered:**
1. **Type-based serialization** - Keep TabType for persistence only
   - Pro: Simpler reconstruction, type-safe
   - Con: Defeats purpose of removing types, still requires type definitions
2. **Full state hydration** - Store all component props, recreate from props alone
   - Pro: No reconstruction logic needed
   - Con: Props may reference non-serializable data (functions, React nodes)
3. **Category-based reconstruction (chosen)**
   - Pro: Flexible, supports arbitrary categories, reconstruction logic centralized
   - Con: Must maintain reconstruction logic for each category

**Rationale:** Categories provide organizational grouping without enforcing a closed type system. Reconstruction logic is acceptable complexity to enable extensibility.

### Decision 3: Two-Function API

**Choice:** Provide `openTab()` and `openTabAdjacent()` instead of just `openTab()` with pane selection

**Alternatives Considered:**
1. **Single function with pane parameter** - `openTab({ pane: 'right' })`
   - Pro: Single API surface
   - Con: Doesn't capture the "detail view" pattern semantically
2. **Three functions** - openTab, openTabInLeft, openTabInRight
   - Pro: Very explicit
   - Con: Over-specified, more API surface
3. **Two functions (chosen)** - openTab (active pane) + openTabAdjacent (opposite pane)
   - Pro: Captures primary use cases clearly, "adjacent" implies relationship
   - Con: Slightly more API surface than single function

**Rationale:** The "detail view" pattern (open detail in opposite pane) is common and semantically distinct. `openTabAdjacent()` makes this pattern explicit and self-documenting.

### Decision 4: Remove All Specialized Openers

**Choice:** Delete openFile(), openTable(), etc. entirely, require direct `openTab()` calls

**Alternatives Considered:**
1. **Keep as convenience wrappers** - Maintain openFile() but call openTab() internally
   - Pro: Less verbose for common cases, backward compatible
   - Con: Adds maintenance burden, obscures what's happening
2. **Mark as deprecated** - Keep functions, add deprecation warnings
   - Pro: Gradual migration path
   - Con: Keeps complexity around longer, unclear when to remove
3. **Remove entirely (chosen)**
   - Pro: Forces explicit configuration, removes intermediate layer
   - Con: More verbose at call sites

**Rationale:** The verbosity of `openTab()` is intentional. Tab configuration should be explicit and visible. This prevents "magic" and makes the codebase more understandable, especially for one-off custom tabs.

### Decision 5: Component-Provided Menu Options

**Choice:** Pass menu options when creating tab, not computed in `toTabs()`

**Alternatives Considered:**
1. **Type-based menu computation** - Keep current approach with types
   - Pro: Centralized menu logic
   - Con: Requires knowing all tab types, couples menu to type system
2. **Component-level menu API** - Components export `getMenuOptions()` function
   - Pro: Menu logic lives with component
   - Con: Requires components to know about tab system, harder to pass context
3. **Pass at creation time (chosen)**
   - Pro: Explicit, flexible, creator has full context, no coupling to components
   - Con: Menu options scattered across call sites

**Rationale:** Menu options depend on context at creation time (current view mode, available actions). The creator has this context; the component doesn't. Passing at creation keeps components decoupled from tab system.

## Risks / Trade-offs

### Risk 1: Type Safety Loss
**Risk:** TypeScript cannot enforce that tab-specific properties exist in metadata

**Mitigation:**
- Components define strict prop types for `componentProps`
- TypeScript will error if wrong props passed to component
- `metadata` is intentionally loose - used for reconstruction only

**Trade-off Accepted:** Some type safety lost in exchange for extensibility

### Risk 2: Verbosity at Call Sites
**Risk:** `openTab()` calls are 8-10 lines vs 1 line for `openFile()`

**Mitigation:**
- Intentional design decision - explicitness over brevity
- Call sites can create local helper functions if needed
- Most verbose for one-time use; repeated patterns can be abstracted

**Trade-off Accepted:** More code at call sites, but clearer intent

### Risk 3: Reconstruction Logic Maintenance
**Risk:** Adding new categories requires updating `reconstructTab()` function

**Mitigation:**
- All reconstruction logic in one place (easy to find)
- Each category is independent (no cross-dependencies)
- Can add versioning to serialized format if needed

**Trade-off Accepted:** Centralized maintenance burden vs distributed type definitions

### Risk 4: Migration Effort
**Risk:** All ~15 call sites must be updated simultaneously

**Mitigation:**
- Implementation can be atomic (single PR)
- Clear migration examples in proposal
- TypeScript will error on old function calls after removal

**Trade-off Accepted:** One-time migration cost for long-term maintainability

### Risk 5: Persistence Breaking Changes
**Risk:** Users with old localStorage data may lose tabs after update

**Mitigation:**
- Reconstruction logic handles old formats gracefully (returns null for unknown)
- Can add version field to serialized format for future migrations
- Tabs are session-scoped; users expect to reopen files occasionally

**Trade-off Accepted:** Minor UX degradation during transition vs blocking refactor

## Migration Plan

### Phase 1: Add New Types (Non-Breaking)
1. Create `src/services/agentforge-ui/types/tabs.ts` with new interfaces
2. Add alongside existing types (both coexist temporarily)
3. Verify TypeScript compiles

### Phase 2: Add New Functions (Non-Breaking)
1. Implement `openTab()` and `openTabAdjacent()` in ProjectViewer
2. Update `openTabs` state to accept both old and new tab formats
3. Update `renderTabContent()` to handle both formats
4. Test new functions work alongside old ones

### Phase 3: Migrate Call Sites (Breaking)
1. Update all internal call sites to use new API (~15 locations)
2. Update `toTabs()` to handle menuOptions
3. Update persistence to use category-based reconstruction
4. Test all tab types still work

### Phase 4: Remove Old Code (Breaking)
1. Delete old opener functions
2. Delete old types (TabType, OpenTab)
3. Remove old format handling from renderTabContent
4. Clean up imports

### Phase 5: Verify
1. Test all tab types: file, table, record, service, agent, agentSession
2. Test persistence (reload page, tabs restore)
3. Test menu options (view mode switching)
4. Test drag/drop between panes
5. Test custom tab creation

### Rollback Strategy
- If critical issues found, revert single atomic commit
- Old localStorage data is already handled gracefully (skip unknown tabs)
- No database migrations or external dependencies involved

## Open Questions

### Q1: Should we version the serialization format?
**Context:** If we need to change serialized structure later, versioning would help

**Options:**
- Add version field now (defensive)
- Add only when needed (YAGNI)

**Recommendation:** Add `version: 1` to SerializedTab now. Low cost, enables future migrations.

### Q2: Should reconstruction logic be pluggable?
**Context:** Could allow categories to register their own reconstruction functions

**Options:**
- Keep centralized (simpler, easier to find)
- Make pluggable via registry (extensible but adds complexity)

**Recommendation:** Keep centralized for now. Can refactor to registry if we have >10 categories.

### Q3: Should we enforce tab ID conventions?
**Context:** Currently using `type:path` format (e.g., `file:/src/main.ts`)

**Options:**
- Enforce format with validation
- Document as convention, don't enforce
- Remove convention entirely (free-form IDs)

**Recommendation:** Document as convention, don't enforce. Flexibility more important than standardization.

### Q4: Should menuOptions support icons?
**Context:** Current design has icon field but no examples use it

**Options:**
- Keep icon field (future-proofing)
- Remove if unused (YAGNI)

**Recommendation:** Keep icon field. Low cost, useful for visual menu items (e.g., view mode icons).
