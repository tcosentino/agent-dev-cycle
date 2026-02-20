import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ProjectViewer } from './ProjectViewer'
import type { ProjectData, ProjectDbData, Workload } from './types'

// Mock the API module
vi.mock('./api', () => ({
  api: {
    tasks: {
      delete: vi.fn().mockResolvedValue({}),
    },
  },
  getWorkloadLogs: vi.fn().mockResolvedValue([]),
}))

// Mock UI components
vi.mock('@agentforge/ui-components', () => ({
  FileDocumentIcon: () => null,
  SettingsIcon: () => null,
  BookOpenIcon: () => null,
  ClockIcon: () => null,
  CodeIcon: () => null,
  DatabaseIcon: () => null,
  TableIcon: () => null,
  KanbanIcon: () => null,
  MessageSquareIcon: () => null,
  RocketIcon: () => null,
  BoxIcon: () => null,
  PlayIcon: () => null,
  TabbedPane: ({ children }: any) => <div>{children}</div>,
}))

// Mock component imports
vi.mock('./components', () => ({
  categorizeFile: vi.fn(() => 'source'),
  buildFileTree: vi.fn(() => []),
  filterTreeForSimpleMode: vi.fn(() => []),
  TABLE_NAMES: ['deployments', 'workloads'],
  TABLE_LABELS: { deployments: 'Deployments', workloads: 'Workloads' },
  TABLES_WITH_VIEW: ['deployments'],
  TABLES_WITH_DETAIL_VIEW: ['workloads'],
  FileTreeNode: () => null,
  ContentPreview: () => null,
  DatabaseTableView: () => null,
  RecordDetailView: () => null,
  ServicePanel: () => null,
  AgentBrowser: () => null,
  AgentPanel: () => null,
  parseAgentsYaml: vi.fn(() => []),
  parseAgentConfigs: vi.fn(() => []),
}))

vi.mock('./components/AgentSessionPanel', () => ({
  AgentSessionProgressPanel: () => null,
  StartAgentSessionModal: () => null,
}))

describe('ProjectViewer - Infinite Render Loop Bug', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('reproduces the infinite loop when SSE updates trigger snapshot changes', async () => {
    // This test simulates the real-world scenario where SSE updates continuously
    // update the snapshot, which triggers the infinite loop
    const workload: Workload = {
      id: '7ee56e00-88e7-46ef-b41f-3fa31e301057',
      deploymentId: 'dep-123',
      moduleId: 'mod-123',
      moduleName: 'test-service',
      moduleType: 'service',
      status: 'running',
      currentStage: 'running',
      stages: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const projects: ProjectData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {},
    }

    let refreshCount = 0
    let updateCount = 0
    const MAX_UPDATES = 5 // Simulate 5 SSE updates
    const MAX_REFRESH_EXPECTED = 2 // Should only refresh once initially

    const onRefreshSnapshot = vi.fn(async () => {
      refreshCount++
    })

    const initialDbData: ProjectDbData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {
        projects: [],
        tasks: [],
        channels: [],
        messages: [],
        agentStatus: [],
        sessions: [],
        deployments: [
          {
            id: 'dep-123',
            projectId: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
            name: 'Test Deployment',
            status: 'running',
            workloadIds: [workload.id],
            trigger: { type: 'manual' },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [workload],
      },
    }

    const persistedState = {
      activeProject: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
      tabs: [
        {
          id: 'table:deployments',
          type: 'table' as const,
          path: 'deployments',
          label: 'Deployments',
          pane: 'left' as const,
        },
        {
          id: `record:workloads:${workload.id}`,
          type: 'record' as const,
          path: `workloads:${workload.id}`,
          label: 'Test Workload',
          pane: 'right' as const,
          tableName: 'workloads' as const,
        },
      ],
      activeTabIds: {
        left: 'table:deployments',
        right: `record:workloads:${workload.id}`,
      },
      activePane: 'left' as const,
      expandedFolders: [],
      viewModes: {},
      recordViewModes: {},
      simpleMode: true,
      leftPaneWidth: 50,
      sidebarWidth: 260,
      selectedAgent: null,
    }

    localStorage.setItem('projectViewer:state', JSON.stringify(persistedState))

    const { rerender } = render(
      <ProjectViewer
        projects={projects}
        dbData={initialDbData}
        selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
        onRefreshSnapshot={onRefreshSnapshot}
      />
    )

    // Wait for initial render
    await new Promise(resolve => setTimeout(resolve, 50))

    // Simulate SSE updates that continuously update the snapshot
    // This is what happens in the real app
    const simulateSSEUpdates = async () => {
      while (updateCount < MAX_UPDATES) {
        await new Promise(resolve => setTimeout(resolve, 50))
        updateCount++

        const updatedDbData: ProjectDbData = {
          '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {
            projects: [],
            tasks: [],
            channels: [],
            messages: [],
            agentStatus: [],
            sessions: [],
            deployments: [
              {
                id: 'dep-123',
                projectId: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
                name: 'Test Deployment',
                status: 'running',
                workloadIds: [workload.id],
                trigger: { type: 'manual' },
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: new Date().toISOString(),
              },
            ],
            workloads: [
              {
                ...workload,
                updatedAt: new Date().toISOString(),
              },
            ],
          },
        }

        // Rerender with updated snapshot (simulates SSE update)
        rerender(
          <ProjectViewer
            projects={projects}
            dbData={updatedDbData}
            selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
            onRefreshSnapshot={onRefreshSnapshot}
          />
        )
      }
    }

    await simulateSSEUpdates()

    // Wait for effects to settle
    await new Promise(resolve => setTimeout(resolve, 100))

    console.log(`\n🔍 Test Results:`)
    console.log(`   SSE Updates: ${updateCount}`)
    console.log(`   Refresh Calls: ${refreshCount}`)
    console.log(`   Expected: ≤${MAX_REFRESH_EXPECTED} refresh calls`)

    if (refreshCount > MAX_UPDATES) {
      console.error(`\n🐛 INFINITE LOOP REPRODUCED!`)
      console.error(`   With ${updateCount} SSE updates, we got ${refreshCount} refresh calls`)
      console.error(`   This means EACH snapshot update triggers a refresh!`)
      console.error(`\n   Root cause:`)
      console.error(`   1. Deployments table tab is active`)
      console.error(`   2. SSE update changes snapshot`)
      console.error(`   3. Snapshot change syncs tab records (line 393-413)`)
      console.error(`   4. Tab sync updates openTabs state with new record data`)
      console.error(`   5. New openTabs causes activeLeftTab to be a new object (line 465)`)
      console.error(`   6. Changed activeLeftTab triggers refresh effect (line 858)`)
      console.error(`   7. Refresh calls onRefreshSnapshot which updates snapshot`)
      console.error(`   8. Back to step 2 - infinite loop`)
    }

    // This should fail if the bug exists
    expect(refreshCount).toBeLessThanOrEqual(MAX_UPDATES)
  })

  it('reproduces the infinite loop from the console logs', async () => {
    // This test reproduces the exact scenario from the user's logs:
    // 1. Deployments table tab is open (active left pane)
    // 2. Workload record tab is open (active right pane)
    // 3. The refresh effect continuously triggers because:
    //    - Deployments table triggers refresh
    //    - Refresh updates snapshot
    //    - Snapshot update syncs tab records (line 393-413 in ProjectViewer.tsx)
    //    - Tab sync creates new tab objects with updated record data
    //    - New tab objects cause activeLeftTab/activeRightTab to change
    //    - Changed tabs trigger refresh effect again
    //    - Loop continues forever

    const workload: Workload = {
      id: '7ee56e00-88e7-46ef-b41f-3fa31e301057',
      deploymentId: 'dep-123',
      moduleId: 'mod-123',
      moduleName: 'test-service',
      moduleType: 'service',
      status: 'running',
      currentStage: 'running',
      stages: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const projects: ProjectData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {},
    }

    let refreshCount = 0
    const MAX_REFRESH_ALLOWED = 2

    // This callback simulates what happens in the real app
    const onRefreshSnapshot = vi.fn(async (projectId: string) => {
      refreshCount++

      // Simulate the snapshot being updated with fresh data
      // In real app, this comes from the backend via SSE or API call
      const updatedSnapshot = {
        projects: [],
        tasks: [],
        channels: [],
        messages: [],
        agentStatus: [],
        sessions: [],
        deployments: [
          {
            id: 'dep-123',
            projectId: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
            name: 'Test Deployment',
            status: 'running',
            workloadIds: [workload.id],
            trigger: { type: 'manual' as const },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(), // Timestamp changes
          },
        ],
        workloads: [
          {
            ...workload,
            updatedAt: new Date().toISOString(), // Timestamp changes
          },
        ],
      }

      // Update the dbData with fresh snapshot
      const updatedDbData: ProjectDbData = {
        [projectId]: updatedSnapshot,
      }

      // Rerender with the updated snapshot
      // This simulates the state update that happens in the real app
      rerender(
        <ProjectViewer
          projects={projects}
          dbData={updatedDbData}
          selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
          onRefreshSnapshot={onRefreshSnapshot}
        />
      )
    })

    const initialDbData: ProjectDbData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {
        projects: [],
        tasks: [],
        channels: [],
        messages: [],
        agentStatus: [],
        sessions: [],
        deployments: [
          {
            id: 'dep-123',
            projectId: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
            name: 'Test Deployment',
            status: 'running',
            workloadIds: [workload.id],
            trigger: { type: 'manual' },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [workload],
      },
    }

    // Set up persisted state matching the user's scenario
    const persistedState = {
      activeProject: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
      tabs: [
        {
          id: 'table:deployments',
          type: 'table' as const,
          path: 'deployments',
          label: 'Deployments',
          pane: 'left' as const,
        },
        {
          id: `record:workloads:${workload.id}`,
          type: 'record' as const,
          path: `workloads:${workload.id}`,
          label: 'Test Workload',
          pane: 'right' as const,
          tableName: 'workloads' as const,
        },
      ],
      activeTabIds: {
        left: 'table:deployments',
        right: `record:workloads:${workload.id}`,
      },
      activePane: 'left' as const, // Deployments table is active
      expandedFolders: [],
      viewModes: {},
      recordViewModes: {},
      simpleMode: true,
      leftPaneWidth: 50,
      sidebarWidth: 260,
      selectedAgent: null,
    }

    localStorage.setItem('projectViewer:state', JSON.stringify(persistedState))

    // Render the component
    const { rerender } = render(
      <ProjectViewer
        projects={projects}
        dbData={initialDbData}
        selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
        onRefreshSnapshot={onRefreshSnapshot}
      />
    )

    // Wait for the loop to run for a bit
    await new Promise(resolve => setTimeout(resolve, 300))

    console.log(`\n🔍 Test Results:`)
    console.log(`   Expected: ≤${MAX_REFRESH_ALLOWED} refresh calls`)
    console.log(`   Actual: ${refreshCount} refresh calls`)

    if (refreshCount > MAX_REFRESH_ALLOWED) {
      console.error(`\n🐛 INFINITE LOOP REPRODUCED!`)
      console.error(`   The bug causes ${refreshCount} refresh calls instead of ${MAX_REFRESH_ALLOWED}`)
      console.error(`\n   Root cause:`)
      console.error(`   1. Deployments table tab triggers refresh (line 848-853)`)
      console.error(`   2. Refresh updates snapshot`)
      console.error(`   3. Snapshot update syncs tabs with fresh record data (line 393-413)`)
      console.error(`   4. Tab sync creates new tab objects via setOpenTabs`)
      console.error(`   5. New tab objects cause activeLeftTab/activeRightTab to change (line 465-467)`)
      console.error(`   6. Changed tabs trigger refresh effect again (line 858 dependencies)`)
      console.error(`   7. Loop repeats forever`)
      console.error(`\n   This matches the logs from the user showing endless:`)
      console.error(`   "[ProjectViewer] Refresh effect triggered"`)
      console.error(`   "[ProjectViewer] Refreshing snapshot for table: deployments"`)
      console.error(`   "[ProjectViewer] Snapshot changed, syncing tab records"`)
    }

    // This assertion will FAIL until the bug is fixed
    expect(refreshCount).toBeLessThanOrEqual(MAX_REFRESH_ALLOWED)
  })

  it('should not cause infinite renders when opening a workload detail page', async () => {
    const workload: Workload = {
      id: '7ee56e00-88e7-46ef-b41f-3fa31e301057',
      deploymentId: 'dep-123',
      moduleId: 'mod-123',
      moduleName: 'test-service',
      moduleType: 'service',
      status: 'running',
      currentStage: 'running',
      stages: [
        {
          stage: 'starting-container',
          status: 'success',
          logs: ['Container started'],
        },
        {
          stage: 'running',
          status: 'running',
          logs: ['Service running'],
        },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const projects: ProjectData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {},
    }

    let currentDbData: ProjectDbData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {
        projects: [],
        tasks: [],
        channels: [],
        messages: [],
        agentStatus: [],
        sessions: [],
        deployments: [
          {
            id: 'dep-123',
            projectId: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
            name: 'Test Deployment',
            status: 'running',
            workloadIds: [workload.id],
            trigger: { type: 'manual' },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [workload],
      },
    }

    // Track how many times onRefreshSnapshot is called
    const refreshSnapshotCalls: string[] = []
    const onRefreshSnapshot = vi.fn(async (projectId: string) => {
      refreshSnapshotCalls.push(projectId)
      // BUG REPRODUCTION: Simulate what happens in real app
      // When refresh is called, it updates the snapshot which triggers
      // the sync effect, which updates tabs, which triggers refresh again
      // This creates the infinite loop

      // Simulate snapshot update with a slightly modified timestamp
      currentDbData = {
        ...currentDbData,
        [projectId]: {
          ...currentDbData[projectId],
          workloads: currentDbData[projectId].workloads.map(w => ({
            ...w,
            updatedAt: new Date().toISOString(),
          })),
        },
      }

      // Rerender with updated data
      rerender(
        <ProjectViewer
          projects={projects}
          dbData={currentDbData}
          selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
          onRefreshSnapshot={onRefreshSnapshot}
        />
      )
    })

    // Open the component with a workload record tab already open
    // This simulates navigating to a workload detail page
    const persistedState = {
      activeProject: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
      tabs: [
        {
          id: 'table:deployments',
          type: 'table' as const,
          path: 'deployments',
          label: 'Deployments',
          pane: 'left' as const,
        },
        {
          id: `record:workloads:${workload.id}`,
          type: 'record' as const,
          path: `workloads:${workload.id}`,
          label: 'Test Workload',
          pane: 'right' as const,
          tableName: 'workloads' as const,
        },
      ],
      activeTabIds: {
        left: 'table:deployments',
        right: `record:workloads:${workload.id}`,
      },
      activePane: 'right' as const,
      expandedFolders: [],
      viewModes: {},
      recordViewModes: {},
      simpleMode: true,
      leftPaneWidth: 50,
      sidebarWidth: 260,
      selectedAgent: null,
    }

    localStorage.setItem('projectViewer:state', JSON.stringify(persistedState))

    // Render the component
    const { rerender } = render(
      <ProjectViewer
        projects={projects}
        dbData={currentDbData}
        selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
        onRefreshSnapshot={onRefreshSnapshot}
      />
    )

    // Wait for effects to settle and let the loop run for a bit
    await new Promise(resolve => setTimeout(resolve, 500))

    // BUG: onRefreshSnapshot should be called at most 2 times:
    // 1. Initial render with deployments table active
    // 2. (Potentially) when workload record is displayed
    //
    // However, due to the infinite loop caused by:
    // refresh -> snapshot update -> tab sync -> refresh -> ...
    // it gets called many times
    //
    // This test will FAIL until the bug is fixed
    console.log(`Total refresh calls: ${refreshSnapshotCalls.length}`)

    expect(refreshSnapshotCalls.length).toBeLessThanOrEqual(2)

    // If this fails, it means the infinite loop is occurring
    if (refreshSnapshotCalls.length > 2) {
      console.error('🐛 INFINITE LOOP DETECTED!')
      console.error(`Expected: ≤2 refresh calls`)
      console.error(`Actual: ${refreshSnapshotCalls.length} refresh calls`)
      console.error('This reproduces the bug where opening a workload detail causes endless renders')
      console.error('Root cause: refresh effect triggers snapshot update, which triggers tab sync, which triggers refresh effect again')
    }
  })

  it('should not trigger refresh loop when snapshot updates', async () => {
    const workload: Workload = {
      id: '7ee56e00-88e7-46ef-b41f-3fa31e301057',
      deploymentId: 'dep-123',
      moduleId: 'mod-123',
      moduleName: 'test-service',
      moduleType: 'service',
      status: 'running',
      currentStage: 'running',
      stages: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const projects: ProjectData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {},
    }

    const initialDbData: ProjectDbData = {
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {
        projects: [],
        tasks: [],
        channels: [],
        messages: [],
        agentStatus: [],
        sessions: [],
        deployments: [
          {
            id: 'dep-123',
            projectId: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
            name: 'Test Deployment',
            status: 'running',
            workloadIds: [workload.id],
            trigger: { type: 'manual' },
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [workload],
      },
    }

    let renderCount = 0
    const onRefreshSnapshot = vi.fn(async () => {
      renderCount++
    })

    // Render with deployments table active (should trigger refresh)
    const persistedState = {
      activeProject: '0b71ddd3-8746-4f88-8c77-5f57d78ae7de',
      tabs: [
        {
          id: 'table:deployments',
          type: 'table' as const,
          path: 'deployments',
          label: 'Deployments',
          pane: 'left' as const,
        },
      ],
      activeTabIds: {
        left: 'table:deployments',
        right: null,
      },
      activePane: 'left' as const,
      expandedFolders: [],
      viewModes: {},
      recordViewModes: {},
      simpleMode: true,
      leftPaneWidth: 50,
      sidebarWidth: 260,
      selectedAgent: null,
    }

    localStorage.setItem('projectViewer:state', JSON.stringify(persistedState))

    const { rerender } = render(
      <ProjectViewer
        projects={projects}
        dbData={initialDbData}
        selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
        onRefreshSnapshot={onRefreshSnapshot}
      />
    )

    // Wait for initial render effects
    await new Promise(resolve => setTimeout(resolve, 50))

    const initialRenderCount = renderCount

    // Simulate snapshot update (e.g., from SSE)
    const updatedDbData: ProjectDbData = {
      ...initialDbData,
      '0b71ddd3-8746-4f88-8c77-5f57d78ae7de': {
        ...initialDbData['0b71ddd3-8746-4f88-8c77-5f57d78ae7de'],
        workloads: [
          {
            ...workload,
            updatedAt: '2024-01-01T00:01:00Z',
          },
        ],
      },
    }

    rerender(
      <ProjectViewer
        projects={projects}
        dbData={updatedDbData}
        selectedProjectId="0b71ddd3-8746-4f88-8c77-5f57d78ae7de"
        onRefreshSnapshot={onRefreshSnapshot}
      />
    )

    // Wait for rerender effects
    await new Promise(resolve => setTimeout(resolve, 50))

    const rerenderCount = renderCount - initialRenderCount

    // After snapshot update, there should be NO additional refresh calls
    // because the data is already fresh
    expect(rerenderCount).toBeLessThanOrEqual(1)

    if (rerenderCount > 1) {
      console.error('Snapshot update triggered refresh loop! Calls:', rerenderCount)
    }
  })
})