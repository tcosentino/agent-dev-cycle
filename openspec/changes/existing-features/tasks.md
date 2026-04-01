## 1. Test Infrastructure Setup

- [ ] 1.1 Create Playwright test fixtures for file tree scenarios
- [ ] 1.2 Create mock project structure with known files/folders
- [ ] 1.3 Create test project with service folders (*-dataobject, *-integration)
- [ ] 1.4 Set up test data for different file categories (config, source, session, etc.)
- [ ] 1.5 Create helper functions for common test actions (expandFolder, selectFile, openTab)

## 2. File Tree: Basic Navigation Tests

- [ ] 2.1 Test folder expand/collapse with chevron click
- [ ] 2.2 Test folder expand/collapse with folder name click
- [ ] 2.3 Test nested folder indentation is correct
- [ ] 2.4 Test collapsed folder shows right chevron (▶)
- [ ] 2.5 Test expanded folder shows down chevron (▼)
- [ ] 2.6 Test clicking file selects and highlights it
- [ ] 2.7 Test clicking different file changes selection
- [ ] 2.8 Test folders cannot be selected (only files)

## 3. File Tree: File Categorization Tests

- [ ] 3.1 Test config files show settings icon (package.json, tsconfig.json)
- [ ] 3.2 Test briefing files show book icon
- [ ] 3.3 Test session transcripts (.jsonl) show clock icon
- [ ] 3.4 Test source code files show code icon (.ts, .tsx, .js, .py)
- [ ] 3.5 Test prompt files are categorized correctly
- [ ] 3.6 Test file category color styling is applied

## 4. File Tree: Service Folder Tests

- [ ] 4.1 Test service folders show "service" badge
- [ ] 4.2 Test service folders show box icon (not folder icon)
- [ ] 4.3 Test clicking service folder chevron expands/collapses folder
- [ ] 4.4 Test clicking service folder name opens service view
- [ ] 4.5 Test service folder expansion state is independent of service view

## 5. File Tree: Tab Management Tests

- [ ] 5.1 Test clicking file opens new tab
- [ ] 5.2 Test tab label matches file name
- [ ] 5.3 Test clicking already-open file activates existing tab (no duplicate)
- [ ] 5.4 Test multiple files can be open in tabs simultaneously
- [ ] 5.5 Test closing tab removes it from tab bar
- [ ] 5.6 Test closing tab activates nearest remaining tab
- [ ] 5.7 Test closing last tab shows empty state

## 6. File Tree: File Content Display Tests

- [ ] 6.1 Test text files display with syntax highlighting
- [ ] 6.2 Test markdown files render with formatting
- [ ] 6.3 Test JSON files are pretty-printed
- [ ] 6.4 Test session transcripts (.jsonl) show as formatted logs
- [ ] 6.5 Test binary files show "Cannot preview" message
- [ ] 6.6 Test line numbers appear for code files

## 7. File Tree: View Mode Toggle Tests

- [ ] 7.1 Test simple mode hides .agentforge/ folder
- [ ] 7.2 Test simple mode hides node_modules/, .git/, dist/
- [ ] 7.3 Test detailed mode shows all files
- [ ] 7.4 Test view mode preference persists in localStorage
- [ ] 7.5 Test view mode is restored on page refresh

## 8. File Tree: Persistence Tests

- [ ] 8.1 Test expanded folders persist across page refresh
- [ ] 8.2 Test selected file is restored on refresh
- [ ] 8.3 Test open tabs are restored on refresh
- [ ] 8.4 Test active tab is restored on refresh
- [ ] 8.5 Test persistence data is stored in localStorage
- [ ] 8.6 Test localStorage key format and structure

## 9. File Tree: Keyboard Navigation Tests

- [ ] 9.1 Test Down arrow moves selection to next node
- [ ] 9.2 Test Up arrow moves selection to previous node
- [ ] 9.3 Test Right arrow expands collapsed folder
- [ ] 9.4 Test Left arrow collapses expanded folder
- [ ] 9.5 Test Enter opens selected file
- [ ] 9.6 Test focus is visible on selected node

## 10. File Tree: Accessibility Tests

- [ ] 10.1 Test screen reader announces folder/file type
- [ ] 10.2 Test screen reader announces expanded/collapsed state
- [ ] 10.3 Test all interactions work with keyboard only
- [ ] 10.4 Test focus indicators are clearly visible
- [ ] 10.5 Test color contrast meets WCAG AA standards

## 11. Session Panel: Metadata Display Tests

- [ ] 11.1 Test session header shows agent role
- [ ] 11.2 Test session header shows project phase
- [ ] 11.3 Test session header shows task prompt
- [ ] 11.4 Test running session shows blue "Running" badge
- [ ] 11.5 Test completed session shows green "Completed" badge
- [ ] 11.6 Test failed session shows red "Failed" badge
- [ ] 11.7 Test pending session shows gray "Pending" badge
- [ ] 11.8 Test running session shows live elapsed time
- [ ] 11.9 Test completed session shows total duration

## 12. Session Panel: Stage Progression Tests

- [ ] 12.1 Test five stages are displayed (Clone, Load, Execute, Capture, Commit)
- [ ] 12.2 Test pending stages show gray/inactive styling
- [ ] 12.3 Test active stage shows blue styling with animation
- [ ] 12.4 Test completed stages show green styling with checkmark
- [ ] 12.5 Test failed stage shows red styling with error icon
- [ ] 12.6 Test stage duration is displayed after completion (e.g., "1.2s")
- [ ] 12.7 Test stage status updates in real-time as session progresses

## 13. Session Panel: Stage-Specific Logs Tests

- [ ] 13.1 Test clicking stage with logs displays those logs
- [ ] 13.2 Test selected stage is highlighted
- [ ] 13.3 Test stages without logs are not clickable
- [ ] 13.4 Test switching between stages updates log display
- [ ] 13.5 Test selected stage persists as new logs arrive

## 14. Session Panel: Log Display Tests

- [ ] 14.1 Test log entries show timestamp in HH:MM:SS format
- [ ] 14.2 Test log entries show level ([INFO], [WARN], [ERROR], [DEBUG])
- [ ] 14.3 Test log entries show message
- [ ] 14.4 Test ERROR logs are styled in red
- [ ] 14.5 Test WARN logs are styled in yellow/orange
- [ ] 14.6 Test INFO logs are styled in default/blue
- [ ] 14.7 Test DEBUG logs are styled in gray
- [ ] 14.8 Test long log messages wrap correctly

## 15. Session Panel: Auto-Scroll Tests

- [ ] 15.1 Test logs auto-scroll to bottom when at bottom
- [ ] 15.2 Test new logs trigger smooth scroll animation
- [ ] 15.3 Test scrolling up disables auto-scroll
- [ ] 15.4 Test auto-scroll re-enables when manually scrolling to bottom
- [ ] 15.5 Test auto-scroll state persists while viewing session

## 16. Session Panel: Copy Logs Tests

- [ ] 16.1 Test "Copy Logs" button copies all logs to clipboard
- [ ] 16.2 Test copied logs format: `[timestamp] [LEVEL] message`
- [ ] 16.3 Test success toast shows "Logs copied!"
- [ ] 16.4 Test button text changes to "Copied!" briefly
- [ ] 16.5 Test clipboard permission error shows error toast

## 17. Session Panel: Completion Summary Tests

- [ ] 17.1 Test completed session shows success summary
- [ ] 17.2 Test summary includes total duration
- [ ] 17.3 Test summary includes files created/modified count
- [ ] 17.4 Test summary includes commit count and SHA
- [ ] 17.5 Test commit SHA is clickable link (if GitHub configured)
- [ ] 17.6 Test failed session shows error summary
- [ ] 17.7 Test error summary shows stage where failure occurred
- [ ] 17.8 Test error summary shows simplified error message

## 18. Session Panel: Retry Failed Session Tests

- [ ] 18.1 Test "Retry" button appears for failed sessions
- [ ] 18.2 Test "Retry" button does not appear for completed sessions
- [ ] 18.3 Test clicking "Retry" shows loading indicator
- [ ] 18.4 Test retry creates new session with same config
- [ ] 18.5 Test retry navigates to new session view
- [ ] 18.6 Test new session shows relationship to original (if implemented)

## 19. Session Panel: Loading and Error States Tests

- [ ] 19.1 Test loading spinner shows while fetching session
- [ ] 19.2 Test error message shows if session fetch fails
- [ ] 19.3 Test "Retry" button appears on error
- [ ] 19.4 Test "Session not found" message for invalid ID
- [ ] 19.5 Test return to session list option on error

## 20. Session Panel: Real-time Update Tests

- [ ] 20.1 Test session polls for updates every N seconds
- [ ] 20.2 Test stage status updates without manual refresh
- [ ] 20.3 Test new logs appear automatically
- [ ] 20.4 Test polling stops when session reaches terminal state
- [ ] 20.5 Test polling resumes if session restarts

## 21. Session Panel: Accessibility Tests

- [ ] 21.1 Test screen reader announces status changes
- [ ] 21.2 Test ARIA live region updates for progress
- [ ] 21.3 Test keyboard navigation through stages (Tab, Enter)
- [ ] 21.4 Test focus management when panel opens
- [ ] 21.5 Test Escape key closes panel

## 22. Session Panel: Responsive Layout Tests

- [ ] 22.1 Test desktop shows vertical stage list on left
- [ ] 22.2 Test logs display on right side (desktop)
- [ ] 22.3 Test mobile stacks stages above logs
- [ ] 22.4 Test panel is full-width on mobile
- [ ] 22.5 Test stage list remains fixed when logs scroll

## 23. Session Panel: Close Panel Tests

- [ ] 23.1 Test close button (X) closes panel
- [ ] 23.2 Test Escape key closes panel
- [ ] 23.3 Test closing panel returns to previous view

## 24. CI/CD Integration

- [ ] 24.1 Add Playwright to GitHub Actions workflow
- [ ] 24.2 Configure test environment (seed data, mock APIs)
- [ ] 24.3 Run tests on every PR
- [ ] 24.4 Fail PR if tests fail
- [ ] 24.5 Generate test coverage report
- [ ] 24.6 Add test status badge to README

## 25. Test Documentation

- [ ] 25.1 Document how to run tests locally
- [ ] 25.2 Document test fixtures and data setup
- [ ] 25.3 Document common test helpers
- [ ] 25.4 Add troubleshooting guide for failing tests
- [ ] 25.5 Document how to add new test scenarios
