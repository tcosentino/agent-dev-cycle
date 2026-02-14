# Generic Tab Management

## ADDED Requirements

### Requirement: Tab accepts any React component

The tab system SHALL accept any React component as tab content without requiring type definitions or registration.

#### Scenario: Open tab with custom component
- **WHEN** developer calls `openTab()` with a React component and props
- **THEN** system creates a tab that renders the component with provided props

#### Scenario: Open tab with inline component
- **WHEN** developer calls `openTab()` with an inline arrow function component
- **THEN** system creates a tab that renders the inline component

#### Scenario: Tab renders with component props
- **WHEN** tab is active
- **THEN** system passes `componentProps` to the component via spread operator

### Requirement: Unified tab creation API

The system SHALL provide a unified `openTab()` function that accepts configuration for any tab type.

#### Scenario: Create tab with minimal config
- **WHEN** developer calls `openTab()` with id, label, and component
- **THEN** system creates tab in active pane with default settings

#### Scenario: Create tab with full config
- **WHEN** developer calls `openTab()` with all optional fields (icon, pane, menuOptions, metadata)
- **THEN** system creates tab with all specified configuration

#### Scenario: Create tab in specific pane
- **WHEN** developer calls `openTab()` with `pane: 'left'`
- **THEN** system creates tab in left pane regardless of active pane

#### Scenario: Create tab in active pane
- **WHEN** developer calls `openTab()` with `pane: 'active'` or omits pane field
- **THEN** system creates tab in currently active pane

### Requirement: Adjacent pane tab creation

The system SHALL provide `openTabAdjacent()` function that opens tabs in the opposite pane from currently active.

#### Scenario: Open adjacent when left pane active
- **WHEN** left pane is active and developer calls `openTabAdjacent()`
- **THEN** system creates tab in right pane

#### Scenario: Open adjacent when right pane active
- **WHEN** right pane is active and developer calls `openTabAdjacent()`
- **THEN** system creates tab in left pane

#### Scenario: Open adjacent when right pane does not exist
- **WHEN** only left pane exists and developer calls `openTabAdjacent()`
- **THEN** system creates right pane and opens tab in it

#### Scenario: Open adjacent with full config
- **WHEN** developer calls `openTabAdjacent()` with icon, menuOptions, and metadata
- **THEN** system creates tab in opposite pane with all specified configuration

### Requirement: Component-provided menu options

Tabs SHALL support custom menu options provided at creation time that render in the tab icon dropdown.

#### Scenario: Tab with no menu options
- **WHEN** tab is created without menuOptions field
- **THEN** tab icon has no dropdown menu

#### Scenario: Tab with menu options
- **WHEN** tab is created with menuOptions array
- **THEN** clicking tab icon shows dropdown with all menu items

#### Scenario: Menu option click handler
- **WHEN** user clicks a menu option
- **THEN** system executes the menu option's onClick handler

#### Scenario: Menu option active state
- **WHEN** menu option has `active: true`
- **THEN** menu item renders with active visual styling

#### Scenario: Menu option with icon
- **WHEN** menu option includes icon field
- **THEN** menu item renders icon alongside label

### Requirement: Tab metadata for organization

Tabs SHALL support arbitrary metadata for categorization and reconstruction without enforcing schema.

#### Scenario: Tab with category metadata
- **WHEN** tab is created with `metadata: { category: 'file' }`
- **THEN** tab stores metadata and makes it available for filtering or reconstruction

#### Scenario: Tab with custom metadata
- **WHEN** tab is created with custom metadata fields (e.g., `{ category: 'custom', myField: 'value' }`)
- **THEN** system stores all metadata fields without validation

#### Scenario: Tab without metadata
- **WHEN** tab is created without metadata field
- **THEN** system creates tab with empty metadata object

### Requirement: Tab deduplication by ID

The system SHALL prevent duplicate tabs with the same ID from being created in the same pane.

#### Scenario: Create tab with existing ID in same pane
- **WHEN** tab with ID "file:/src/main.ts" exists in left pane
- **AND** developer calls `openTab()` with same ID targeting left pane
- **THEN** system activates existing tab instead of creating duplicate

#### Scenario: Create tab with existing ID in different pane
- **WHEN** tab with ID "file:/src/main.ts" exists in left pane
- **AND** developer calls `openTab()` with same ID targeting right pane
- **THEN** system creates new tab in right pane (same ID in different panes allowed)

#### Scenario: Tab ID uniqueness per pane
- **WHEN** checking for duplicate tabs
- **THEN** system only compares IDs within the same pane

### Requirement: Generic tab rendering

The system SHALL render tabs by invoking their component with componentProps without type-specific logic.

#### Scenario: Render active tab
- **WHEN** tab becomes active
- **THEN** system renders: `<Component {...componentProps} />`

#### Scenario: Switch between tabs
- **WHEN** user switches from one tab to another
- **THEN** system unmounts previous component and mounts new component with fresh props

#### Scenario: Tab content updates
- **WHEN** componentProps change while tab is active
- **THEN** component re-renders with updated props

### Requirement: Tab closure

The system SHALL allow tabs to be closed via close button or programmatic API.

#### Scenario: Close tab via UI
- **WHEN** user clicks tab close button
- **THEN** system removes tab from pane and activates adjacent tab

#### Scenario: Close tab programmatically
- **WHEN** developer calls `closeTab(tabId, pane)`
- **THEN** system removes tab from specified pane

#### Scenario: Close last tab in pane
- **WHEN** user closes the only tab in right pane
- **THEN** system removes right pane entirely and expands left pane

#### Scenario: Cannot close last tab in left pane
- **WHEN** user attempts to close the only tab in left pane
- **THEN** left pane remains (at least one pane must exist)

### Requirement: Tab reordering and movement

The system SHALL support dragging tabs to reorder within pane or move between panes.

#### Scenario: Reorder tabs within pane
- **WHEN** user drags tab to different position in same pane
- **THEN** system reorders tabs and maintains selection

#### Scenario: Move tab to other pane
- **WHEN** user drags tab from left to right pane
- **THEN** system moves tab to right pane and updates pane reference

#### Scenario: Move tab to empty right pane area
- **WHEN** right pane doesn't exist and user drags tab to right side drop zone
- **THEN** system creates right pane and moves tab into it

### Requirement: Tab icon customization

Tabs SHALL support optional custom icons displayed in the tab header.

#### Scenario: Tab with custom icon
- **WHEN** tab is created with icon field (ReactNode)
- **THEN** tab displays custom icon in header

#### Scenario: Tab without icon
- **WHEN** tab is created without icon field
- **THEN** tab displays no icon in header

#### Scenario: Icon with menu
- **WHEN** tab has both icon and menuOptions
- **THEN** clicking icon shows menu dropdown

### Requirement: No type system coupling

The tab system SHALL NOT require TypeScript union types or type guards for operation.

#### Scenario: Tab creation without types
- **WHEN** developer creates tab
- **THEN** no TabType value is required or checked

#### Scenario: Tab rendering without type checks
- **WHEN** system renders tab content
- **THEN** no `if (tab.type === ...)` checks occur

#### Scenario: Tab persistence without types
- **WHEN** system serializes tabs
- **THEN** no TabType field is written to storage
