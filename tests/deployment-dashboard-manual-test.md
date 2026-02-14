# Deployment Dashboard Manual Testing Guide

This guide covers manual testing scenarios for the Deployment Dashboard MVP.

## Test Setup

1. Start the AgentForge UI dev server:
   ```bash
   cd src/services/agentforge-ui
   npm run dev
   ```

2. Ensure you have a project with deployment data in the database

3. Open the UI in your browser (usually http://localhost:3000)

## Test 8.1: Deployment List Rendering

### Scenario 1: View deployments with data
**Steps:**
1. Select a project with existing deployments
2. Click "Deployments" in the Database sidebar
3. Verify dashboard opens in "view" mode by default

**Expected Results:**
- ✓ Deployment cards are displayed in a clean grid layout
- ✓ Each card shows:
  - Service name
  - Status icon (clock, play, checkmark, or alert)
  - Health badge (green, red, or gray)
  - Trigger info (agent name, branch, or "manual")
  - Created timestamp
  - Description (if present)
- ✓ Workloads are nested under each deployment
- ✓ No layout issues or overlapping elements

### Scenario 2: Empty state
**Steps:**
1. Select a project with no deployments (or create a new project)
2. Click "Deployments" in the Database sidebar

**Expected Results:**
- ✓ Empty state message appears:
  - Rocket icon
  - "No deployments yet" heading
  - Helpful message about when deployments will appear
- ✓ No errors in browser console

### Scenario 3: Loading state
**Steps:**
1. Open browser DevTools Network tab
2. Throttle network to "Slow 3G"
3. Select a project and click "Deployments"

**Expected Results:**
- ✓ Loading spinner appears with "Loading deployments..." message
- ✓ Dashboard appears after data loads
- ✓ No flash of empty state before data loads

### Scenario 4: Toggle between view modes
**Steps:**
1. Open deployments in view mode (default)
2. Click the table icon in the tab header to switch to table mode
3. Click the view icon to switch back

**Expected Results:**
- ✓ View mode shows rich deployment cards
- ✓ Table mode shows raw database table
- ✓ Toggle works smoothly without errors
- ✓ Selection persists when switching back and forth

## Test 8.2: Log Viewer with Various Log Formats

### Scenario 1: View logs for successful workload
**Steps:**
1. Find a workload with status "success"
2. Click the "Logs" button on the workload card

**Expected Results:**
- ✓ Log Viewer modal opens
- ✓ Modal header shows workload name and ID
- ✓ Logs are displayed with stage prefixes (e.g., `[build]`, `[deploy]`)
- ✓ Logs are readable and properly formatted
- ✓ No weird characters or encoding issues

### Scenario 2: View logs with errors
**Steps:**
1. Find a workload with status "failed"
2. Click the "Logs" button

**Expected Results:**
- ✓ Error logs are highlighted in red
- ✓ Error messages are clearly visible
- ✓ Stage that failed is obvious from log context
- ✓ Stack traces (if present) are readable

### Scenario 3: Search logs
**Steps:**
1. Open log viewer for any workload
2. Type "error" in the search box
3. Clear search and try "build"
4. Try searching for a string that doesn't exist

**Expected Results:**
- ✓ Logs filter in real-time as you type
- ✓ Only matching log lines are shown
- ✓ Search is case-insensitive
- ✓ "No logs match your filters" message appears when no matches
- ✓ Log count updates (e.g., "5 / 47 logs")

### Scenario 4: Filter by log level
**Steps:**
1. Open log viewer
2. Select "Error" from the Level dropdown
3. Try "Warn" level
4. Try "Info" level
5. Switch back to "All"

**Expected Results:**
- ✓ Only logs matching the selected level are shown
- ✓ Error filter shows logs containing "error" or with error property
- ✓ Warn filter shows logs containing "warn"
- ✓ Info filter shows logs without error/warn keywords
- ✓ All filter shows everything

### Scenario 5: Download logs
**Steps:**
1. Open log viewer for any workload
2. Click the "Download" button

**Expected Results:**
- ✓ File downloads automatically
- ✓ Filename format: `{workloadId}-{timestamp}.log`
- ✓ File contains all logs (not just filtered ones)
- ✓ Each line has stage prefix: `[stage] log message`
- ✓ File is plain text and readable in any text editor

### Scenario 6: Stage context in logs
**Steps:**
1. Open log viewer for a workload that completed multiple stages
2. Scroll through the logs

**Expected Results:**
- ✓ Each log line shows stage in square brackets: `[validate]`, `[build]`, etc.
- ✓ Stage names are color-coded (blue accent color)
- ✓ Logs from different stages are visually distinguishable
- ✓ Stage order matches pipeline: validate → build → deploy → healthcheck → test

### Scenario 7: Long log lines and special characters
**Steps:**
1. Find a workload with long log lines (100+ chars)
2. Look for logs with special characters (quotes, brackets, etc.)

**Expected Results:**
- ✓ Long lines wrap properly
- ✓ No horizontal scrolling within modal
- ✓ Special characters display correctly
- ✓ JSON or code snippets in logs are readable

### Scenario 8: Close log viewer
**Steps:**
1. Open log viewer
2. Try closing via:
   - X button in header
   - Clicking outside the modal
   - Pressing Escape key (if implemented)

**Expected Results:**
- ✓ Modal closes smoothly
- ✓ Returns to deployment dashboard
- ✓ No errors in console

## Test 8.3: Empty States

### Scenario 1: No deployments (covered in 8.1 Scenario 2)
**Steps:**
1. Navigate to project with zero deployments

**Expected Results:**
- ✓ Friendly empty state with icon and message
- ✓ No confusing error messages

### Scenario 2: No logs available
**Steps:**
1. Find a workload with status "pending" (or manually create one with no stages)
2. Try to view logs (if "Logs" button doesn't appear, this is correct)
3. If logs can be opened, verify empty state

**Expected Results:**
- ✓ "Logs" button only appears if workload has logs
- ✓ OR "No logs available" message displays if log viewer opens
- ✓ No errors in console

### Scenario 3: No logs match filters
**Steps:**
1. Open log viewer with many logs
2. Search for a string that doesn't exist (e.g., "xyzabc123")

**Expected Results:**
- ✓ "No logs match your filters" message appears
- ✓ Log count shows "0 / X logs"
- ✓ Clear or change filter to see logs again

### Scenario 4: Error loading logs
**Steps:**
1. Open DevTools and go to Network tab
2. Block API requests to `/api/workloads/{id}`
3. Try to view logs for a workload

**Expected Results:**
- ✓ Error is caught gracefully (no crash)
- ✓ Log viewer opens with error message in logs
- ✓ User can still close the viewer

## Additional Checks

### Performance
- Dashboard loads within 2 seconds for projects with <50 deployments
- Log viewer opens quickly (<500ms)
- No UI lag when typing in search box
- Smooth scrolling in log viewer with 1000+ log lines

### Accessibility
- All buttons have accessible labels/titles
- Modal can be closed with keyboard (Escape)
- Focus management when opening/closing log viewer
- Color contrast meets WCAG guidelines

### Responsive Design
- Dashboard layout adapts to different screen widths
- Log viewer is readable on smaller screens
- Mobile-friendly (if applicable)

### Browser Compatibility
Test in:
- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest, macOS)

## Known Issues / Future Improvements

- Log streaming not implemented (static logs only)
- No auto-refresh for deployment status
- No start/stop/restart controls
- Health checks based on status field only (no custom endpoints)

## Acceptance Criteria

All tests pass with:
- No critical errors in browser console
- No broken layouts or overlapping elements
- All interactive elements respond correctly
- Empty states are friendly and informative
- Log viewer is fast and usable

---

**Test Date:** _________  
**Tester:** _________  
**Browser/Version:** _________  
**Status:** ☐ PASS  ☐ FAIL (see notes)

**Notes:**
