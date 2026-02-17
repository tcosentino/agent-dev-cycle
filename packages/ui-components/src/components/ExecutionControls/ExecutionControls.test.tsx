import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExecutionControls } from './ExecutionControls'
import userEvent from '@testing-library/user-event'

describe('ExecutionControls', () => {
  describe('Job Mode', () => {
    it('shows cancel button when running', () => {
      const onCancel = vi.fn()
      render(
        <ExecutionControls
          mode="job"
          status="executing"
          onCancel={onCancel}
        />
      )
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('shows retry button when failed', () => {
      const onRetry = vi.fn()
      render(
        <ExecutionControls
          mode="job"
          status="failed"
          onRetry={onRetry}
        />
      )
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('shows retry button when cancelled', () => {
      const onRetry = vi.fn()
      render(
        <ExecutionControls
          mode="job"
          status="cancelled"
          onRetry={onRetry}
        />
      )
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    it('does not show cancel button when completed', () => {
      const onCancel = vi.fn()
      render(
        <ExecutionControls
          mode="job"
          status="completed"
          onCancel={onCancel}
        />
      )
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('handles cancel click', async () => {
      const onCancel = vi.fn()
      render(
        <ExecutionControls
          mode="job"
          status="executing"
          onCancel={onCancel}
        />
      )
      await userEvent.click(screen.getByText('Cancel'))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('handles retry click', async () => {
      const onRetry = vi.fn()
      render(
        <ExecutionControls
          mode="job"
          status="failed"
          onRetry={onRetry}
        />
      )
      await userEvent.click(screen.getByText('Retry'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows cancelling state', () => {
      render(
        <ExecutionControls
          mode="job"
          status="executing"
          onCancel={vi.fn()}
          isCancelling={true}
        />
      )
      expect(screen.getByText('Cancelling...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancelling/i })).toBeDisabled()
    })

    it('shows retrying state', () => {
      render(
        <ExecutionControls
          mode="job"
          status="failed"
          onRetry={vi.fn()}
          isRetrying={true}
        />
      )
      expect(screen.getByText('Retrying...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retrying/i })).toBeDisabled()
    })
  })

  describe('Service Mode', () => {
    it('shows stop button when running', () => {
      const onStop = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="running"
          onStop={onStop}
        />
      )
      expect(screen.getByText('Stop')).toBeInTheDocument()
    })

    it('shows restart button when running', () => {
      const onRestart = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="running"
          onRestart={onRestart}
        />
      )
      expect(screen.getByText('Restart')).toBeInTheDocument()
    })

    it('shows restart button when stopped', () => {
      const onRestart = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="stopped"
          onRestart={onRestart}
        />
      )
      expect(screen.getByText('Restart')).toBeInTheDocument()
    })

    it('shows restart button when failed', () => {
      const onRestart = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="failed"
          onRestart={onRestart}
        />
      )
      expect(screen.getByText('Restart')).toBeInTheDocument()
    })

    it('does not show stop button when stopped', () => {
      const onStop = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="stopped"
          onStop={onStop}
        />
      )
      expect(screen.queryByText('Stop')).not.toBeInTheDocument()
    })

    it('handles stop click', async () => {
      const onStop = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="running"
          onStop={onStop}
        />
      )
      await userEvent.click(screen.getByText('Stop'))
      expect(onStop).toHaveBeenCalledTimes(1)
    })

    it('handles restart click', async () => {
      const onRestart = vi.fn()
      render(
        <ExecutionControls
          mode="service"
          status="running"
          onRestart={onRestart}
        />
      )
      await userEvent.click(screen.getByText('Restart'))
      expect(onRestart).toHaveBeenCalledTimes(1)
    })

    it('shows stopping state', () => {
      render(
        <ExecutionControls
          mode="service"
          status="running"
          onStop={vi.fn()}
          isStopping={true}
        />
      )
      expect(screen.getByText('Stopping...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stopping/i })).toBeDisabled()
    })

    it('shows restarting state', () => {
      render(
        <ExecutionControls
          mode="service"
          status="running"
          onRestart={vi.fn()}
          isRestarting={true}
        />
      )
      expect(screen.getByText('Restarting...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /restarting/i })).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('renders nothing when no buttons should be shown', () => {
      const { container } = render(
        <ExecutionControls
          mode="job"
          status="completed"
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('does not show buttons without handlers', () => {
      render(
        <ExecutionControls
          mode="job"
          status="executing"
        />
      )
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })
  })
})
