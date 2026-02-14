import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeploymentListView, WorkloadDetailView } from './DeploymentViews'
import type { DbSnapshot, Workload } from '../types'

// Mock the API
vi.mock('../api', () => ({
  getWorkloadLogs: vi.fn().mockResolvedValue([]),
}))

describe('DeploymentViews', () => {
  describe('DeploymentListView', () => {
    it('renders without crashing with empty snapshot', () => {
      const snapshot: DbSnapshot = {
        deployments: [],
        workloads: [],
      }

      render(
        <DeploymentListView
          snapshot={snapshot}
          onWorkloadClick={vi.fn()}
        />
      )

      expect(screen.getByText('No deployments yet')).toBeInTheDocument()
    })

    it('renders deployments sorted by most recent first', () => {
      const snapshot: DbSnapshot = {
        deployments: [
          {
            id: '1',
            name: 'Old Deployment',
            status: 'success',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'New Deployment',
            status: 'running',
            createdAt: '2024-12-01T00:00:00Z',
            updatedAt: '2024-12-01T00:00:00Z',
          },
        ],
        workloads: [],
      }

      render(
        <DeploymentListView
          snapshot={snapshot}
          onWorkloadClick={vi.fn()}
        />
      )

      const deploymentCards = screen.getAllByText(/Deployment/)
      expect(deploymentCards[0]).toHaveTextContent('New Deployment')
      expect(deploymentCards[1]).toHaveTextContent('Old Deployment')
    })

    it('renders delete button for each deployment', () => {
      const snapshot: DbSnapshot = {
        deployments: [
          {
            id: '1',
            name: 'Test Deployment',
            status: 'running',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [],
      }

      render(
        <DeploymentListView
          snapshot={snapshot}
          onWorkloadClick={vi.fn()}
        />
      )

      const deleteButton = screen.getByTitle('Delete deployment')
      expect(deleteButton).toBeInTheDocument()
    })

    it('shows confirmation modal when delete button is clicked', () => {
      const snapshot: DbSnapshot = {
        deployments: [
          {
            id: '1',
            name: 'Test Deployment',
            status: 'running',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [],
      }

      render(
        <DeploymentListView
          snapshot={snapshot}
          onWorkloadClick={vi.fn()}
        />
      )

      const deleteButton = screen.getByTitle('Delete deployment')
      fireEvent.click(deleteButton)

      expect(screen.getByText('Delete Deployment')).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  describe('WorkloadDetailView', () => {
    it('renders without crashing', () => {
      const workload: Workload = {
        id: '1',
        deploymentId: 'dep-1',
        moduleName: 'test-workload',
        moduleType: 'service',
        status: 'running',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      render(<WorkloadDetailView workload={workload} />)

      expect(screen.getByText('test-workload')).toBeInTheDocument()
      expect(screen.getByText('Pipeline Stages')).toBeInTheDocument()
    })

    it('transforms flat logs array into grouped stages', () => {
      // Real workload data from production with flat logs array
      const workload: any = {
        id: '9c67a89e-a7f4-4368-899f-9fdd3e27894d',
        deploymentId: '7a092248-e19a-4405-bbc9-8ad6fcc8fc29',
        moduleName: 'project-dataobject',
        moduleType: 'service',
        servicePath: 'src/services/project-dataobject',
        stage: 'failed',
        logs: [
          {
            timestamp: '2026-02-11T17:29:59.538Z',
            stage: 'starting-container',
            message: 'Preparing container environment',
            level: 'info',
          },
          {
            timestamp: '2026-02-11T17:29:59.538Z',
            stage: 'starting-container',
            message: 'Preparing work directory: /var/folders/4q/xqnczd691xd8dz946lf4bv6w0000gn/T/workloads/9c67a89e-a7f4-4368-899f-9fdd3e27894d',
            level: 'info',
          },
          {
            timestamp: '2026-02-11T17:29:59.540Z',
            stage: 'cloning-repo',
            message: 'Cloning repository from https://github.com/tcosentino/agentforge-example-todo-app',
            level: 'info',
          },
          {
            timestamp: '2026-02-11T17:30:00.834Z',
            stage: 'cloning-repo',
            message: 'Repository cloned successfully',
            level: 'info',
          },
          {
            timestamp: '2026-02-11T17:30:00.835Z',
            stage: 'cloning-repo',
            message: 'Service configuration validated',
            level: 'info',
          },
          {
            timestamp: '2026-02-11T17:30:00.836Z',
            stage: 'starting-service',
            message: 'Preparing runtime environment',
            level: 'info',
          },
          {
            timestamp: '2026-02-11T17:30:01.771Z',
            stage: 'failed',
            message: 'Failed to start workload: Failed to start container',
            level: 'error',
          },
          {
            timestamp: '2026-02-11T17:30:01.772Z',
            stage: 'stopped',
            message: 'Cleaning up work directory',
            level: 'info',
          },
        ],
        error: 'Failed to start container',
        containerId: null,
        port: 3100,
        status: 'failed',
        createdAt: '2026-02-11T17:29:59.530Z',
        updatedAt: '2026-02-11T17:30:01.787Z',
      }

      render(<WorkloadDetailView workload={workload} />)

      // Should display all stage labels
      expect(screen.getByText('Starting Container')).toBeInTheDocument()
      expect(screen.getByText('Cloning Repository')).toBeInTheDocument()
      expect(screen.getByText('Starting Service')).toBeInTheDocument()
      expect(screen.getByText('Stopped')).toBeInTheDocument()

      // Should show log messages grouped by stage
      expect(screen.getByText(/Preparing container environment/)).toBeInTheDocument()
      expect(screen.getByText(/Repository cloned successfully/)).toBeInTheDocument()
      expect(screen.getByText(/Preparing runtime environment/)).toBeInTheDocument()
      // Error message appears in both logs and error field, use getAllByText
      expect(screen.getAllByText(/Failed to start workload/)[0]).toBeInTheDocument()
    })

    it('renders copy logs button', () => {
      const workload: Workload = {
        id: '1',
        deploymentId: 'dep-1',
        moduleName: 'test-workload',
        moduleType: 'service',
        status: 'running',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      render(<WorkloadDetailView workload={workload} />)

      const copyButton = screen.getByTitle('Copy all logs to clipboard')
      expect(copyButton).toBeInTheDocument()
      expect(copyButton).toHaveTextContent('Copy All Logs')
    })

    it('renders workload logs when available', () => {
      const workload: any = {
        id: '1',
        deploymentId: 'dep-1',
        moduleName: 'test-workload',
        moduleType: 'service',
        status: 'running',
        stage: 'running',
        logs: [
          { timestamp: new Date(), stage: 'validate', message: 'Validating...', level: 'info' },
          { timestamp: new Date(), stage: 'deploy', message: 'Deploying...', level: 'info' },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      render(<WorkloadDetailView workload={workload} />)

      expect(screen.getByText(/Validating/)).toBeInTheDocument()
      expect(screen.getByText(/Deploying/)).toBeInTheDocument()
    })
  })

  describe('Import validation', () => {
    it('all required icons are imported', () => {
      // This test ensures all icons used in the component are properly imported
      // If an icon is used but not imported, the component will fail to render
      const snapshot: DbSnapshot = {
        deployments: [
          {
            id: '1',
            name: 'Test',
            status: 'running',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        workloads: [],
      }

      // This will throw if any icons are missing
      expect(() => {
        render(
          <DeploymentListView
            snapshot={snapshot}
            onWorkloadClick={vi.fn()}
          />
        )
      }).not.toThrow()
    })
  })
})
