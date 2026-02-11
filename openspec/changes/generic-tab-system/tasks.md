# Implementation Tasks

## 1. Create New Type Definitions

- [ ] 1.1 Create `src/services/agentforge-ui/types/tabs.ts` file
- [ ] 1.2 Define `Tab` interface with id, label, icon, pane, component, componentProps, menuOptions, metadata
- [ ] 1.3 Define `TabMenuOption` interface with id, label, icon, active, onClick
- [ ] 1.4 Define `OpenTabConfig` type for openTab() function parameter
- [ ] 1.5 Define `SerializedTab` interface for localStorage persistence (id, label, pane, metadata)
- [ ] 1.6 Export all types from tabs.ts

## 2. Add Generic Tab Management Functions

- [ ] 2.1 Import new Tab types in ProjectViewer.tsx
- [ ] 2.2 Update `openTabs` state type from `OpenTab[]` to `Tab[]`
- [ ] 2.3 Implement `openTab(config: OpenTabConfig)` function that creates/activates tabs
- [ ] 2.4 Add tab deduplication logic in openTab (check for existing ID in target pane)
- [ ] 2.5 Implement `openTabAdjacent(config)` that determines opposite pane and calls openTab
- [ ] 2.6 Handle right pane creation when calling openTabAdjacent from left pane
- [ ] 2.7 Update `closeTab()` to work with new Tab type
- [ ] 2.8 Update `selectTab()` to work with new Tab type
- [ ] 2.9 Update `moveTabToPane()` to work with new Tab type
- [ ] 2.10 Update `reorderTab()` to work with new Tab type

## 3. Update Tab Rendering

- [ ] 3.1 Simplify `renderTabContent()` to: `const Component = tab.component; return <Component {...tab.componentProps} />`
- [ ] 3.2 Remove all type-checking logic from renderTabContent (if statements for tab.type)
- [ ] 3.3 Verify tab switching still unmounts/remounts components correctly
- [ ] 3.4 Test that componentProps are passed correctly to all tab components

## 4. Update TabbedPane Integration

- [ ] 4.1 Update `toTabs()` function to handle new Tab interface
- [ ] 4.2 Map `tab.menuOptions` to TabbedPane's `menuContent` prop
- [ ] 4.3 Render menu options as buttons with click handlers
- [ ] 4.4 Apply active styling to menu options where `active: true`
- [ ] 4.5 Render menu option icons if provided
- [ ] 4.6 Verify tab icon click opens menu dropdown correctly

## 5. Implement Category-Based Persistence

- [ ] 5.1 Create `serializeTabs()` function that strips component/props/icon/menuOptions
- [ ] 5.2 Add `version: 1` field to serialized format
- [ ] 5.3 Create `reconstructTab()` function with category-based logic
- [ ] 5.4 Implement file category reconstruction (FileViewer + path from metadata)
- [ ] 5.5 Implement database category reconstruction (DatabaseTableView + table name + menu options)
- [ ] 5.6 Implement record category reconstruction (detail view component + fetch record data)
- [ ] 5.7 Implement service category reconstruction (ServiceView + load service.json)
- [ ] 5.8 Implement agent-session category reconstruction (AgentSessionProgressPanel + session ID)
- [ ] 5.9 Implement agent category reconstruction (AgentPage + agent ID)
- [ ] 5.10 Return null for unknown categories and log warning
- [ ] 5.11 Update persistence save logic to use serializeTabs()
- [ ] 5.12 Update persistence load logic to use reconstructTab() for each serialized tab
- [ ] 5.13 Filter out null results from reconstruction

## 6. Migrate Existing Tab Openers

- [ ] 6.1 Find all calls to `openFile()` and replace with openTab() calls
- [ ] 6.2 Find all calls to `openTable()` and replace with openTab() calls
- [ ] 6.3 Find all calls to `openRecord()` and replace with openTabAdjacent() calls
- [ ] 6.4 Find all calls to `openService()` and replace with openTab() calls
- [ ] 6.5 Find all calls to `openAgentSession()` and replace with openTabAdjacent() calls
- [ ] 6.6 Find all calls to `openAgent()` and replace with openTab() calls
- [ ] 6.7 Migrate file tabs: add component: FileViewer, componentProps: { path, files }, metadata: { category: 'file', path }
- [ ] 6.8 Migrate table tabs: add component: DatabaseTableView, menuOptions for view mode, metadata: { category: 'database', tableName }
- [ ] 6.9 Migrate record tabs: add appropriate detail component, metadata: { category: 'record', tableName }
- [ ] 6.10 Migrate service tabs: add component: ServiceView, metadata: { category: 'service' }
- [ ] 6.11 Migrate agent session tabs: add component: AgentSessionProgressPanel, metadata: { category: 'agent-session' }
- [ ] 6.12 Migrate agent tabs: add component: AgentPage, metadata: { category: 'agent' }

## 7. Update Menu Option Creation

- [ ] 7.1 Extract view mode menu creation logic from toTabs()
- [ ] 7.2 Create menuOptions for table tabs with TABLES_WITH_VIEW during openTab call
- [ ] 7.3 Add Table/Board/Pipeline menu options with current viewMode state
- [ ] 7.4 Add onClick handlers that call setViewMode()
- [ ] 7.5 Create menuOptions for record tabs with TABLES_WITH_DETAIL_VIEW during openTab call
- [ ] 7.6 Add Formatted/Raw menu options with current recordViewMode state
- [ ] 7.7 Add onClick handlers that call setRecordViewMode()
- [ ] 7.8 Verify menu options update when view mode state changes

## 8. Remove Old Code

- [ ] 8.1 Delete `openFile()` function from ProjectViewer.tsx
- [ ] 8.2 Delete `openTable()` function from ProjectViewer.tsx
- [ ] 8.3 Delete `openRecord()` function from ProjectViewer.tsx
- [ ] 8.4 Delete `openService()` function from ProjectViewer.tsx
- [ ] 8.5 Delete `openAgentSession()` function from ProjectViewer.tsx
- [ ] 8.6 Delete `openAgent()` function from ProjectViewer.tsx
- [ ] 8.7 Remove `TabType` union type from constants.ts
- [ ] 8.8 Remove `OpenTab` interface from constants.ts
- [ ] 8.9 Remove `SerializedTab` interface if it used TabType
- [ ] 8.10 Update imports - remove TabType, OpenTab references
- [ ] 8.11 Keep `PaneId` type in constants.ts

## 9. Testing and Verification

- [ ] 9.1 Test opening file tabs - verify FileViewer renders with correct path
- [ ] 9.2 Test opening table tabs - verify DatabaseTableView renders with correct table
- [ ] 9.3 Test table view mode switching via menu - verify Board/Pipeline/Table views work
- [ ] 9.4 Test opening record tabs - verify detail view opens in right pane
- [ ] 9.5 Test record view mode switching via menu - verify Formatted/Raw views work
- [ ] 9.6 Test opening service tabs - verify ServiceView renders with metadata
- [ ] 9.7 Test opening agent session tabs - verify AgentSessionProgressPanel renders
- [ ] 9.8 Test opening agent tabs - verify AgentPage renders
- [ ] 9.9 Test tab deduplication - verify opening same file twice activates existing tab
- [ ] 9.10 Test openTabAdjacent() - verify tabs open in opposite pane
- [ ] 9.11 Test right pane creation - verify dragging or openTabAdjacent creates right pane
- [ ] 9.12 Test tab closing - verify close button removes tabs
- [ ] 9.13 Test closing last tab in right pane - verify right pane is removed
- [ ] 9.14 Test tab reordering - verify drag/drop within pane works
- [ ] 9.15 Test tab movement between panes - verify drag/drop between panes works
- [ ] 9.16 Test persistence - reload page and verify tabs restore correctly
- [ ] 9.17 Test persistence with unknown category - verify graceful skip
- [ ] 9.18 Test view mode persistence - verify table/record view modes restore
- [ ] 9.19 Test active tab persistence - verify correct tab is active after reload
- [ ] 9.20 Test active pane persistence - verify correct pane is active after reload
- [ ] 9.21 Run TypeScript compiler - verify no type errors
- [ ] 9.22 Test custom tab creation - verify arbitrary component can be opened as tab

## 10. Documentation and Cleanup

- [ ] 10.1 Add JSDoc comments to openTab() and openTabAdjacent() functions
- [ ] 10.2 Document category values in metadata (file, database, record, service, agent-session, agent)
- [ ] 10.3 Add code example of creating custom tab to component documentation
- [ ] 10.4 Update CLAUDE.md with new tab system architecture if applicable
- [ ] 10.5 Remove any unused imports from refactored files
- [ ] 10.6 Clean up any console.log statements used during development
