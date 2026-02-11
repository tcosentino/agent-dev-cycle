import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

      const copyButton = screen.getByTitle('Copy logs to clipboard')
      expect(copyButton).toBeInTheDocument()
      expect(copyButton).toHaveTextContent('Copy Logs')
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
