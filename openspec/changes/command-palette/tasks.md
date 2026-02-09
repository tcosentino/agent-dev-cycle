## 1. Setup and Dependencies

- [ ] 1.1 Add fuse.js dependency to root package.json
- [ ] 1.2 Install dependencies with yarn

## 2. Create CommandPalette Component

- [ ] 2.1 Create CommandPalette.tsx in packages/ui-components/src/components/
- [ ] 2.2 Define CommandPaletteItem interface in component file
- [ ] 2.3 Implement modal overlay with search input
- [ ] 2.4 Add CSS module for CommandPalette styles
- [ ] 2.5 Export CommandPalette from ui-components index

## 3. Implement Fuzzy Search

- [ ] 3.1 Initialize fuse.js instance with items prop
- [ ] 3.2 Configure fuse search options (keys: label, description, type)
- [ ] 3.3 Wire up search input onChange to filter results
- [ ] 3.4 Display filtered results in scrollable list
- [ ] 3.5 Show "No results found" when search returns empty

## 4. Keyboard Navigation

- [ ] 4.1 Track selectedIndex state in CommandPalette
- [ ] 4.2 Handle ArrowDown to increment selectedIndex
- [ ] 4.3 Handle ArrowUp to decrement selectedIndex
- [ ] 4.4 Handle Enter to call onSelect with selected item
- [ ] 4.5 Handle Escape to call onClose
- [ ] 4.6 Auto-scroll selected item into view

## 5. Visual Presentation

- [ ] 5.1 Add item type icons (file, table, agent) to results
- [ ] 5.2 Display item label and description in result rows
- [ ] 5.3 Apply highlight style to selected item
- [ ] 5.4 Style modal with centered positioning and backdrop

## 6. Integrate into ProjectViewer

- [ ] 6.1 Add showCommandPalette state to ProjectViewer
- [ ] 6.2 Create buildCommandPaletteItems function to index files/tables/agents
- [ ] 6.3 Add global keyboard event listener for Cmd+K (Ctrl+K on Windows/Linux)
- [ ] 6.4 Prevent default behavior for Cmd+K
- [ ] 6.5 Ignore Cmd+K when focused on input/textarea elements
- [ ] 6.6 Cleanup event listener on unmount

## 7. Wire Up Item Selection

- [ ] 7.1 Create handleCommandPaletteSelect callback in ProjectViewer
- [ ] 7.2 Parse item metadata to determine type (file, table, agent)
- [ ] 7.3 Call existing openTab function with appropriate parameters
- [ ] 7.4 Close command palette after selection
- [ ] 7.5 Close palette when clicking outside

## 8. Testing and Polish

- [ ] 8.1 Test Cmd+K opens palette on macOS
- [ ] 8.2 Test Ctrl+K opens palette on Windows/Linux
- [ ] 8.3 Test fuzzy search across all item types
- [ ] 8.4 Test keyboard navigation through results
- [ ] 8.5 Test Enter selects and opens item correctly
- [ ] 8.6 Test Escape closes palette
- [ ] 8.7 Test outside click closes palette
- [ ] 8.8 Verify shortcut ignored in text inputs
