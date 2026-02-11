/**
 * Counter Component Tests
 *
 * Demonstrates Test-Spec Linkage using describeSpec()
 * Each test suite is linked to a scenario in spec.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describeSpec } from '@agentforge/testing-framework'
import { Counter } from './Counter'

// ========================================
// Linked Tests (using describeSpec)
// ========================================

describeSpec(
  {
    spec: 'examples/test-spec-example/spec.md',
    scenario: 'counter-001',
    requirement: 'Display current count',
    title: 'Initial count is zero',
    priority: 'high',
  },
  () => {
    it('should display initial count of zero', () => {
      render(<Counter />)
      const countDisplay = screen.getByTestId('count-value')
      expect(countDisplay).toHaveTextContent('0')
    })
  }
)

describeSpec(
  {
    spec: 'examples/test-spec-example/spec.md',
    scenario: 'counter-002',
    requirement: 'Increment count',
    title: 'User clicks increment button',
    priority: 'critical',
  },
  () => {
    it('should increment count when clicking button', async () => {
      const user = userEvent.setup()
      render(<Counter />)

      const incrementButton = screen.getByTestId('increment-button')
      const countDisplay = screen.getByTestId('count-value')

      // Initial state
      expect(countDisplay).toHaveTextContent('0')

      // Click once
      await user.click(incrementButton)
      expect(countDisplay).toHaveTextContent('1')

      // Click again
      await user.click(incrementButton)
      expect(countDisplay).toHaveTextContent('2')
    })
  }
)

describeSpec(
  {
    spec: 'examples/test-spec-example/spec.md',
    scenario: 'counter-003',
    requirement: 'Decrement count',
    title: 'User clicks decrement button',
    priority: 'critical',
  },
  () => {
    it('should decrement count when clicking button', async () => {
      const user = userEvent.setup()
      render(<Counter />)

      const decrementButton = screen.getByTestId('decrement-button')
      const countDisplay = screen.getByTestId('count-value')

      // Initial state
      expect(countDisplay).toHaveTextContent('0')

      // Click decrement
      await user.click(decrementButton)
      expect(countDisplay).toHaveTextContent('-1')
    })
  }
)

// ========================================
// Uncovered Scenarios (TODO)
// ========================================

// counter-004: Count can go negative
// TODO: Add more comprehensive negative number tests

// counter-005: User clicks reset button
// TODO: Implement reset button test
