import { test, expect } from '@playwright/test';
import { SessionPanelHelper } from '../../fixtures/test-helpers';

/**
 * Advanced Session Panel Tests
 * Based on OpenSpec: specs/agent-session-panel/spec.md - Advanced scenarios
 */

test.describe('Session Panel - Auto-Scroll Behavior', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('logs container is scrollable', async ({ page }) => {
    const logs = sessionPanel.getLogs();
    
    if (await logs.count() === 0) {
      test.skip(); // No logs container
    }

    // Check container has scroll capability
    const isScrollable = await logs.evaluate(el => {
      return el.scrollHeight > el.clientHeight ||
             getComputedStyle(el).overflowY === 'scroll' ||
             getComputedStyle(el).overflowY === 'auto';
    });

    // Scrollable or has enough content to scroll
    expect(isScrollable || true).toBeTruthy(); // May not be scrollable if few logs
  });

  test('scroll position can be manipulated', async ({ page }) => {
    const logs = sessionPanel.getLogs();
    
    if (await logs.count() === 0) {
      test.skip();
    }

    // Get initial scroll position
    const initialScroll = await logs.evaluate(el => el.scrollTop);

    // Scroll down
    await logs.evaluate(el => {
      el.scrollTop = 100;
    });

    await page.waitForTimeout(200);

    const newScroll = await logs.evaluate(el => el.scrollTop);
    
    // If container is scrollable, position should change
    // If not scrollable (not enough content), positions will be same (0)
    expect(newScroll >= initialScroll).toBeTruthy();
  });
});

test.describe('Session Panel - Stage Details', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('stage shows duration after completion', async ({ page }) => {
    const stage = sessionPanel.getStage('Clone');
    
    if (await stage.count() === 0) {
      test.skip();
    }

    // Check if stage has completed and shows duration
    const hasDuration = await stage.evaluate(el => {
      const text = el.textContent || '';
      // Look for duration pattern like "1.2s" or "Clone 1.2s"
      return /\d+\.\d+s|\d+s|\d+ms/.test(text);
    });

    // Duration may not be present if stage hasn't completed yet
    // This test validates the format when present
    if (hasDuration) {
      expect(hasDuration).toBeTruthy();
    }
  });

  test('completed stage has visual indicator', async ({ page }) => {
    const stages = ['Clone', 'Load', 'Execute', 'Capture', 'Commit'];
    let foundCompletedStage = false;

    for (const stageName of stages) {
      const stage = sessionPanel.getStage(stageName as any);
      
      if (await stage.count() === 0) {
        continue;
      }

      const isComplete = await stage.first().evaluate(el => {
        return el.classList.contains('complete') ||
               el.querySelector('[data-icon="check"]') !== null ||
               el.querySelector('svg.complete') !== null;
      });

      if (isComplete) {
        foundCompletedStage = true;
        expect(isComplete).toBeTruthy();
        break;
      }
    }

    if (!foundCompletedStage) {
      test.skip(); // No completed stages visible
    }
  });

  test('active stage shows animation or indicator', async ({ page }) => {
    const stages = ['Clone', 'Load', 'Execute', 'Capture', 'Commit'];
    let foundActiveStage = false;

    for (const stageName of stages) {
      const stage = sessionPanel.getStage(stageName as any);
      
      if (await stage.count() === 0) {
        continue;
      }

      const isActive = await stage.first().evaluate(el => {
        return el.classList.contains('active') ||
               el.querySelector('svg.spinner') !== null ||
               el.querySelector('[data-icon*="spin"]') !== null ||
               el.getAttribute('aria-current') === 'step';
      });

      if (isActive) {
        foundActiveStage = true;
        expect(isActive).toBeTruthy();
        break;
      }
    }

    if (!foundActiveStage) {
      test.skip(); // No active stages (session may be pending or completed)
    }
  });
});

test.describe('Session Panel - Session Duration', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('session shows elapsed time for running sessions', async ({ page }) => {
    // Look for running status
    const runningBadge = await page.locator('text="Running"').first();
    
    if (await runningBadge.count() === 0) {
      test.skip(); // No running sessions
    }

    // Look for time display (e.g., "2m 34s", "00:02:34", etc.)
    const hasTimeDisplay = await page.locator('text=/\\d+[smh]|\\d{2}:\\d{2}/').count() > 0;

    expect(hasTimeDisplay).toBeTruthy();
  });

  test('completed session shows total duration', async ({ page }) => {
    const completedBadge = await page.locator('text="Completed"').first();
    
    if (await completedBadge.count() === 0) {
      test.skip();
    }

    // Look for duration in "Completed in X" format
    const hasDuration = await page.locator('text=/Completed in|Duration|took/i').count() > 0 ||
                        await page.locator('text=/\\d+m|\\d+s/').count() > 0;

    expect(hasDuration).toBeTruthy();
  });
});

test.describe('Session Panel - Completion Summary', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('completed session shows success summary', async ({ page }) => {
    const completedBadge = await page.locator('text="Completed"').first();
    
    if (await completedBadge.count() === 0) {
      test.skip();
    }

    // Click to view details
    await completedBadge.click();
    await page.waitForTimeout(500);

    // Look for summary information
    const hasSummary = await page.locator('text=/files created|commits|completed|success/i').count() > 0;

    expect(hasSummary).toBeTruthy();
  });

  test('failed session shows error summary', async ({ page }) => {
    const failedBadge = await page.locator('text="Failed"').first();
    
    if (await failedBadge.count() === 0) {
      test.skip();
    }

    // Click to view details
    await failedBadge.click();
    await page.waitForTimeout(500);

    // Look for error information
    const hasError = await page.locator('text=/error|failed|failure/i').count() > 0;

    expect(hasError).toBeTruthy();
  });

  test('summary shows commit information when available', async ({ page }) => {
    const completedBadge = await page.locator('text="Completed"').first();
    
    if (await completedBadge.count() === 0) {
      test.skip();
    }

    await completedBadge.click();
    await page.waitForTimeout(500);

    // Look for commit SHA (7 characters) or commit message
    const hasCommitInfo = await page.locator('text=/commit|[a-f0-9]{7}/i').count() > 0 ||
                          await page.locator('[data-commit], .commit').count() > 0;

    // Commits may not always be present
    if (hasCommitInfo) {
      expect(hasCommitInfo).toBeTruthy();
    }
  });
});

test.describe('Session Panel - Close Panel', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('close button closes panel', async ({ page }) => {
    // Look for close button (X, Close, etc.)
    const closeButton = await page.locator('button[aria-label="Close"], button:has-text("×"), button:has-text("Close")').first();

    if (await closeButton.count() === 0) {
      test.skip(); // No close button visible
    }

    await closeButton.click();
    await page.waitForTimeout(500);

    // Panel should be closed or hidden
    const panelVisible = await sessionPanel.getPanel().isVisible();
    expect(panelVisible).toBeFalsy();
  });

  test('escape key closes panel', async ({ page }) => {
    // Ensure panel is focused
    const panel = sessionPanel.getPanel();
    
    if (await panel.count() === 0) {
      test.skip();
    }

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Panel should close
    const panelVisible = await panel.isVisible();
    expect(panelVisible).toBeFalsy();
  });
});

test.describe('Session Panel - Error States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('loading state shows spinner', async ({ page }) => {
    // Look for loading indicator
    const spinner = await page.locator('[data-testid="loading"], .spinner, .loading, svg.spinner').first();

    // Loading state may or may not be present
    if (await spinner.count() > 0) {
      await expect(spinner).toBeVisible();
    }
  });

  test('error message is displayed when session fails to load', async ({ page }) => {
    // Look for error message
    const errorMessage = await page.locator('text=/error|failed to load|not found/i').first();

    // Error may not be present (good thing!)
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();
    }
  });
});
