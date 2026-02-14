# Tab Persistence

## MODIFIED Requirements

### Requirement: Tab state persists across page reloads

The system SHALL save tab state to localStorage and restore it on page reload, using category-based reconstruction instead of type-based serialization.

#### Scenario: Save tabs to localStorage
- **WHEN** user opens tabs and navigates between them
- **THEN** system continuously saves tab state to localStorage with minimal serialized format

#### Scenario: Restore tabs on page reload
- **WHEN** user reloads the page
- **THEN** system reads localStorage and reconstructs all tabs that have valid categories

#### Scenario: Handle unknown categories gracefully
- **WHEN** localStorage contains tabs with unknown categories
- **THEN** system skips those tabs without error and restores remaining tabs

#### Scenario: Preserve tab order
- **WHEN** tabs are restored from localStorage
- **THEN** tabs appear in same order as before reload

#### Scenario: Preserve active tab
- **WHEN** tabs are restored from localStorage
- **THEN** previously active tab becomes active again

#### Scenario: Preserve active pane
- **WHEN** tabs are restored from localStorage
- **THEN** previously active pane (left/right) is active again

## ADDED Requirements

### Requirement: Category-based reconstruction

The system SHALL use metadata.category field to determine how to reconstruct each tab from localStorage.

#### Scenario: Reconstruct file tab
- **WHEN** serialized tab has `category: 'file'`
- **THEN** system creates tab with FileViewer component and path from metadata

#### Scenario: Reconstruct database tab
- **WHEN** serialized tab has `category: 'database'`
- **THEN** system creates tab with DatabaseTableView component and table name from metadata

#### Scenario: Reconstruct record tab
- **WHEN** serialized tab has `category: 'record'`
- **THEN** system creates tab with appropriate detail view component and fetches fresh record data

#### Scenario: Reconstruct service tab
- **WHEN** serialized tab has `category: 'service'`
- **THEN** system creates tab with ServiceView component and loads service metadata

#### Scenario: Reconstruct agent session tab
- **WHEN** serialized tab has `category: 'agent-session'`
- **THEN** system creates tab with AgentSessionProgressPanel component and session ID

#### Scenario: Reconstruct agent tab
- **WHEN** serialized tab has `category: 'agent'`
- **THEN** system creates tab with AgentPage component and agent ID

#### Scenario: Skip tabs with no category
- **WHEN** serialized tab has no category field
- **THEN** system skips reconstruction and logs warning

### Requirement: Minimal serialization format

The system SHALL serialize only essential data (id, label, pane, metadata) and omit non-serializable fields (component, componentProps, icon, menuOptions).

#### Scenario: Serialize tab to localStorage
- **WHEN** system saves tab state
- **THEN** serialized format contains only: id, label, pane, metadata

#### Scenario: Component not serialized
- **WHEN** system saves tab state
- **THEN** component field is excluded from serialized data

#### Scenario: ComponentProps not serialized
- **WHEN** system saves tab state
- **THEN** componentProps field is excluded from serialized data

#### Scenario: Icon not serialized
- **WHEN** system saves tab state
- **THEN** icon field (ReactNode) is excluded from serialized data

#### Scenario: MenuOptions not serialized
- **WHEN** system saves tab state
- **THEN** menuOptions field is excluded from serialized data

### Requirement: Reconstruction logic centralization

All category-based reconstruction logic SHALL be centralized in a single `reconstructTab()` function.

#### Scenario: Single source of truth for reconstruction
- **WHEN** adding support for new category
- **THEN** developer updates only `reconstructTab()` function

#### Scenario: Reconstruction failure returns null
- **WHEN** `reconstructTab()` cannot reconstruct a tab (invalid category, missing data, etc.)
- **THEN** function returns null and system skips that tab

#### Scenario: Reconstruction preserves metadata
- **WHEN** tab is reconstructed
- **THEN** all metadata fields from serialized format are preserved in new tab

### Requirement: Menu options reconstruction

The system SHALL reconstruct menu options during tab restoration based on category and current state.

#### Scenario: Reconstruct table view mode menu
- **WHEN** restoring table tab
- **THEN** system creates menu options for view mode switching (Table/Board/Pipeline)

#### Scenario: Reconstruct record view mode menu
- **WHEN** restoring record tab
- **THEN** system creates menu options for view mode switching (Formatted/Raw)

#### Scenario: Menu option handlers reference current state
- **WHEN** menu options are reconstructed
- **THEN** onClick handlers can access and modify current view mode state

### Requirement: Forward compatibility with versioning

The serialization format SHALL support version field for future migrations without breaking current implementation.

#### Scenario: Serialize with version field
- **WHEN** system saves tab state
- **THEN** serialized format includes `version: 1`

#### Scenario: Read tabs without version field
- **WHEN** localStorage contains tabs without version field (legacy)
- **THEN** system treats as version 0 and attempts reconstruction

#### Scenario: Future version migration
- **WHEN** localStorage contains tabs with `version: 2` (future)
- **THEN** system can implement migration logic without breaking existing tabs

### Requirement: View mode state persistence

The system SHALL persist view mode preferences (table/board, formatted/raw) separately from tab data.

#### Scenario: Save view mode for table
- **WHEN** user switches table view mode
- **THEN** system saves preference keyed by table name

#### Scenario: Restore view mode for table
- **WHEN** table tab is reconstructed
- **THEN** system applies saved view mode preference

#### Scenario: Save view mode for record
- **WHEN** user switches record view mode
- **THEN** system saves preference keyed by tab ID

#### Scenario: Restore view mode for record
- **WHEN** record tab is reconstructed
- **THEN** system applies saved view mode preference

### Requirement: Persistence key namespacing

The system SHALL namespace localStorage keys to prevent conflicts with other application data.

#### Scenario: Tabs stored under namespaced key
- **WHEN** system saves tab state
- **THEN** localStorage key is `projectViewer:state` or similar namespaced format

#### Scenario: Multiple projects do not conflict
- **WHEN** user switches between projects
- **THEN** each project's tab state is stored separately by project ID
