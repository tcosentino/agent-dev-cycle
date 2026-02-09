## EXISTING Feature: File Tree & File Viewing

### Requirement: Display project files in hierarchical tree
The system SHALL display all project files in a collapsible tree structure.

#### Scenario: Tree displays folder hierarchy
- **WHEN** user views project
- **THEN** file tree shows folder structure with indentation
- **AND** folders can be expanded/collapsed
- **AND** files are leaf nodes (no children)

#### Scenario: Folders show chevron icon
- **WHEN** folder is collapsed
- **THEN** right-pointing chevron icon (▶) is displayed
- **WHEN** folder is expanded
- **THEN** down-pointing chevron icon (▼) is displayed

#### Scenario: Click folder to toggle expansion
- **GIVEN** folder is collapsed
- **WHEN** user clicks folder name or chevron
- **THEN** folder expands showing children
- **WHEN** user clicks expanded folder
- **THEN** folder collapses hiding children

#### Scenario: Nested folders have increased indentation
- **WHEN** folder is nested 3 levels deep
- **THEN** indentation is 3 × 16px = 48px
- **AND** depth is visually clear from indentation

### Requirement: File categorization and icons
The system SHALL categorize files and display category-specific icons.

#### Scenario: Config files show settings icon
- **WHEN** file matches config pattern (package.json, tsconfig.json, .eslintrc, etc.)
- **THEN** file category is "config"
- **AND** settings gear icon is displayed
- **AND** file has config color styling

#### Scenario: Briefing files show book icon
- **WHEN** file name contains "briefing" or "BRIEFING"
- **THEN** file category is "briefing"
- **AND** book open icon is displayed

#### Scenario: Session transcripts show clock icon
- **WHEN** file extension is .jsonl AND in sessions/ directory
- **THEN** file category is "session"
- **AND** clock icon is displayed

#### Scenario: Source code shows code icon
- **WHEN** file has code extension (.ts, .tsx, .js, .jsx, .py, etc.)
- **THEN** file category is "source"
- **AND** code icon is displayed

#### Scenario: Prompt files show appropriate categorization
- **WHEN** file is prompt.md in agents/ directory
- **THEN** file category is "prompt"

### Requirement: Service folders are specially marked
The system SHALL identify and mark service folders with special styling.

#### Scenario: Service folders show service badge
- **WHEN** folder matches pattern *-dataobject, *-integration, or *-service
- **THEN** folder is marked as service
- **AND** "service" badge is displayed next to folder name
- **AND** box icon is shown instead of folder icon

#### Scenario: Service folders have clickable chevron
- **WHEN** user clicks service folder chevron
- **THEN** folder expands/collapses
- **WHEN** user clicks service folder name (not chevron)
- **THEN** service view opens in main pane
- **AND** folder expansion state does not change

### Requirement: File selection and highlighting
The system SHALL highlight selected files and allow single selection.

#### Scenario: Click file to select
- **WHEN** user clicks file in tree
- **THEN** file is highlighted with selected background
- **AND** file opens in main content area

#### Scenario: Only one file selected at a time
- **GIVEN** file A is selected
- **WHEN** user clicks file B
- **THEN** file B is selected
- **AND** file A is no longer highlighted

#### Scenario: Folders cannot be selected (only opened)
- **WHEN** user clicks folder
- **THEN** folder expands/collapses
- **AND** no selection highlight is applied to folder

### Requirement: Open files in tabbed pane
The system SHALL open clicked files in tabs within the main content area.

#### Scenario: Click file opens new tab
- **WHEN** user clicks file "README.md"
- **THEN** new tab opens with label "README.md"
- **AND** file content is displayed
- **AND** tab becomes active

#### Scenario: Click already-open file activates tab
- **GIVEN** file "package.json" is open in tab
- **WHEN** user clicks "package.json" in tree
- **THEN** existing tab becomes active
- **AND** no duplicate tab is created

#### Scenario: Multiple files can be open in tabs
- **WHEN** user clicks file A
- **AND** then clicks file B
- **THEN** both files are open in separate tabs
- **AND** tab B is active

#### Scenario: Close tab button removes tab
- **GIVEN** file is open in tab
- **WHEN** user clicks tab close button (×)
- **THEN** tab is removed
- **AND** if other tabs exist, nearest tab becomes active
- **AND** if no other tabs, main pane shows empty state

### Requirement: File content display
The system SHALL display file contents with appropriate rendering.

#### Scenario: Text files show content with syntax highlighting
- **WHEN** file is opened (.ts, .json, .md, .yaml, etc.)
- **THEN** file content is displayed in viewer
- **AND** syntax highlighting is applied based on file extension
- **AND** line numbers are shown (for code files)

#### Scenario: Markdown files render as formatted text
- **WHEN** markdown file (.md) is opened
- **THEN** markdown is rendered with formatting
- **AND** headings, lists, code blocks are styled
- **AND** links are clickable

#### Scenario: JSON files are formatted and collapsible
- **WHEN** JSON file is opened
- **THEN** JSON is pretty-printed (indented)
- **AND** syntax highlighting applied
- **AND** (optional) expandable/collapsible object keys

#### Scenario: Session transcripts (.jsonl) show as formatted logs
- **WHEN** .jsonl session file is opened
- **THEN** each line is parsed as JSON
- **AND** displayed as formatted log entries
- **AND** timestamps and event types are highlighted

#### Scenario: Binary/image files show placeholder
- **WHEN** binary file or image is opened
- **THEN** placeholder message shows "Cannot preview this file type"
- **OR** image files show image preview

### Requirement: View mode toggle (simple vs detailed)
The system SHALL support toggling between simple and detailed tree views.

#### Scenario: Simple mode hides agentforge internal files
- **WHEN** "Simple Mode" is enabled
- **THEN** .agentforge/ folder is hidden
- **AND** node_modules/ is hidden
- **AND** .git/ is hidden
- **AND** dist/ build folders are hidden
- **AND** only relevant project files are shown

#### Scenario: Detailed mode shows all files
- **WHEN** "Detailed Mode" (or "Show All") is enabled
- **THEN** all files and folders are visible
- **AND** .agentforge/ internal files are shown

#### Scenario: View mode preference persists
- **WHEN** user toggles to Simple Mode
- **AND** refreshes page
- **THEN** Simple Mode is still active
- **AND** preference is stored in localStorage

### Requirement: Folder expansion state persistence
The system SHALL remember which folders are expanded across sessions.

#### Scenario: Expanded folders persist on refresh
- **GIVEN** user expands folders src/ and src/components/
- **WHEN** page refreshes
- **THEN** src/ and src/components/ are still expanded
- **AND** expansion state is restored from localStorage

#### Scenario: Default expansion for new projects
- **WHEN** project is first opened
- **THEN** root-level folders are collapsed by default
- **OR** .agentforge/ is auto-expanded (if in detailed mode)

### Requirement: Keyboard navigation
The system SHALL support keyboard navigation through the file tree.

#### Scenario: Arrow keys navigate tree
- **WHEN** file tree has focus
- **AND** user presses Down arrow
- **THEN** selection moves to next visible node
- **WHEN** user presses Up arrow
- **THEN** selection moves to previous visible node

#### Scenario: Right arrow expands folder
- **GIVEN** collapsed folder is focused
- **WHEN** user presses Right arrow
- **THEN** folder expands

#### Scenario: Left arrow collapses folder
- **GIVEN** expanded folder is focused
- **WHEN** user presses Left arrow
- **THEN** folder collapses

#### Scenario: Enter opens file
- **GIVEN** file is focused
- **WHEN** user presses Enter
- **THEN** file opens in tab
- **AND** focus moves to file content

### Requirement: Search/filter files (future enhancement)
The system SHOULD support filtering visible files by name.

#### Scenario: Search box filters tree
- **WHEN** user types "component" in search box
- **THEN** only files/folders matching "component" are visible
- **AND** matching nodes are highlighted

**Note:** Search is not yet implemented, marked as future enhancement.

### Requirement: File tree performance with large projects
The system SHALL handle large file trees efficiently.

#### Scenario: Virtual scrolling for 1000+ files
- **GIVEN** project has 1000+ files
- **WHEN** tree is rendered
- **THEN** only visible nodes are rendered (virtual scrolling)
- **AND** scrolling is smooth (60fps)

#### Scenario: Lazy loading of folder contents
- **WHEN** folder with 100+ children is expanded
- **THEN** children load progressively (not all at once)

**Note:** Current implementation loads full tree; virtual scrolling is future optimization.

### Requirement: Error handling
The system SHALL gracefully handle file access errors.

#### Scenario: File not found
- **WHEN** file is clicked but no longer exists
- **THEN** error message shows "File not found"
- **AND** file is removed from tree on next refresh

#### Scenario: Permission denied
- **WHEN** file cannot be read due to permissions
- **THEN** error message shows "Permission denied"
- **AND** file remains in tree but shows error icon

### Requirement: Accessibility
The system SHALL ensure file tree is accessible to all users.

#### Scenario: Screen reader announces tree structure
- **WHEN** screen reader navigates tree
- **THEN** folder/file type is announced
- **AND** nesting level is conveyed
- **AND** expanded/collapsed state is announced

#### Scenario: Keyboard-only navigation works
- **WHEN** user uses only keyboard (no mouse)
- **THEN** all tree interactions are possible
- **AND** focus is clearly visible

#### Scenario: Color contrast meets WCAG AA
- **WHEN** tree is viewed
- **THEN** text and icons have sufficient contrast
- **AND** selection highlight is clearly visible
