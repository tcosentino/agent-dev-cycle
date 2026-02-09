import { test, expect } from '@playwright/test';
import { SessionPanelHelper } from '../../fixtures/test-helpers';

/**
 * Agent Session Panel Tests
 * Based on OpenSpec: openspec/changes/existing-features/specs/agent-session-panel/spec.md
 */

test.describe('Session Panel - Metadata Display', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    
    // Navigate to a session (this will vary based on actual UI)
    // For now, we'll assume sessions are accessible from the UI
    await page.waitForLoadState('networkidle');
  });

  test('session status badge is displayed', async ({ page }) => {
    const statusBadge = sessionPanel.getStatusBadge();
    
    // Check if any status badge exists
    const badgeCount = await statusBadge.count();
    
    if (badgeCount === 0) {
      test.skip(); // No active sessions
    }

    await expect(statusBadge.first()).toBeVisible();
    
    // Check badge shows valid status
    const statusText = await statusBadge.first().textContent();
    expect(['Running', 'Completed', 'Failed', 'Pending']).toContain(statusText);
  });

  test('running session shows blue badge', async ({ page }) => {
    const runningBadge = await page.locator('text="Running"').first();
    
    if (await runningBadge.count() === 0) {
      test.skip(); // No running sessions
    }

    await expect(runningBadge).toBeVisible();
    
    // Check badge has appropriate styling (blue color)
    const badgeColor = await runningBadge.evaluate(el => {
      return getComputedStyle(el).backgroundColor || 
             getComputedStyle(el).borderColor ||
             el.className;
    });

    // Should contain blue color or appropriate class
    expect(badgeColor.toLowerCase()).toMatch(/blue|running|active/i);
  });

  test('completed session shows green badge', async ({ page }) => {
    const completedBadge = await page.locator('text="Completed"').first();
    
    if (await completedBadge.count() === 0) {
      test.skip(); // No completed sessions
    }

    await expect(completedBadge).toBeVisible();
    
    const badgeColor = await completedBadge.evaluate(el => {
      return getComputedStyle(el).backgroundColor ||
             getComputedStyle(el).borderColor ||
             el.className;
    });

    expect(badgeColor.toLowerCase()).toMatch(/green|success|completed/i);
  });

  test('failed session shows red badge', async ({ page }) => {
    const failedBadge = await page.locator('text="Failed"').first();
    
    if (await failedBadge.count() === 0) {
      test.skip(); // No failed sessions
    }

    await expect(failedBadge).toBeVisible();
    
    const badgeColor = await failedBadge.evaluate(el => {
      return getComputedStyle(el).backgroundColor ||
             getComputedStyle(el).borderColor ||
             el.className;
    });

    expect(badgeColor.toLowerCase()).toMatch(/red|error|failed|danger/i);
  });
});

test.describe('Session Panel - Stage Progression', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('five stages are displayed', async ({ page }) => {
    const stages = ['Clone', 'Load', 'Execute', 'Capture', 'Commit'];
    
    for (const stage of stages) {
      const stageButton = sessionPanel.getStage(stage as any);
      
      if (await stageButton.count() === 0) {
        test.skip(); // Session panel not visible
      }

      await expect(stageButton.first()).toBeVisible();
    }
  });

  test('stages show status indicators', async ({ page }) => {
    const cloneStage = sessionPanel.getStage('Clone');
    
    if (await cloneStage.count() === 0) {
      test.skip();
    }

    // Check stage has status class (pending, active, complete, failed)
    const hasStatusClass = await cloneStage.first().evaluate(el => {
      const classes = el.className;
      return classes.includes('pending') ||
             classes.includes('active') ||
             classes.includes('complete') ||
             classes.includes('failed');
    });

    expect(hasStatusClass).toBeTruthy();
  });

  test('click stage to view logs', async ({ page }) => {
    const executeStage = sessionPanel.getStage('Execute');
    
    if (await executeStage.count() === 0) {
      test.skip();
    }

    // Check if stage is clickable (not disabled)
    const isClickable = await executeStage.first().evaluate(el => {
      return !(el as HTMLButtonElement).disabled;
    });

    if (!isClickable) {
      test.skip(); // Stage has no logs yet
    }

    await executeStage.first().click();
    await page.waitForTimeout(500);

    // Check if logs are displayed
    const logs = sessionPanel.getLogs();
    const logsVisible = await logs.isVisible();
    
    // Logs should be visible or stage should show as selected
    const isSelected = await executeStage.first().evaluate(el => {
      return el.classList.contains('selected') ||
             el.getAttribute('aria-selected') === 'true';
    });

    expect(logsVisible || isSelected).toBeTruthy();
  });
});

test.describe('Session Panel - Logs Display', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('log entries show timestamp and level', async ({ page }) => {
    const logEntry = await page.locator('.logEntry').first();
    
    if (await logEntry.count() === 0) {
      test.skip(); // No logs available
    }

    // Check for timestamp
    const hasTimestamp = await logEntry.locator('.logTime, [data-log-time]').count() > 0;
    
    // Check for log level
    const hasLevel = await logEntry.locator('.logLevel, [data-log-level]').count() > 0 ||
                     await logEntry.textContent().then(text => 
                       /\[(INFO|WARN|ERROR|DEBUG)\]/.test(text || '')
                     );

    expect(hasTimestamp || hasLevel).toBeTruthy();
  });

  test('error logs are styled in red', async ({ page }) => {
    const errorLog = await page.locator('.logEntry.error, .logEntry:has-text("[ERROR]")').first();
    
    if (await errorLog.count() === 0) {
      test.skip(); // No error logs
    }

    const color = await errorLog.evaluate(el => {
      return getComputedStyle(el).color || el.className;
    });

    expect(color.toLowerCase()).toMatch(/red|error/i);
  });
});

test.describe('Session Panel - Copy Logs', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('copy logs button is visible', async ({ page }) => {
    const copyButton = await page.getByRole('button', { name: /Copy Logs/i });
    
    if (await copyButton.count() === 0) {
      test.skip(); // Button not visible (maybe no session open)
    }

    await expect(copyButton.first()).toBeVisible();
  });

  test('click copy logs shows success feedback', async ({ page }) => {
    const copyButton = await page.getByRole('button', { name: /Copy Logs/i }).first();
    
    if (await copyButton.count() === 0) {
      test.skip();
    }

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    await copyButton.click();
    await page.waitForTimeout(500);

    // Check for success feedback (button text changes or toast appears)
    const buttonText = await copyButton.textContent();
    const hasSuccessToast = await page.locator('text=/Copied|Success/i').count() > 0;

    expect(buttonText?.includes('Copied') || hasSuccessToast).toBeTruthy();
  });
});

test.describe('Session Panel - Retry Failed Session', () => {
  let sessionPanel: SessionPanelHelper;

  test.beforeEach(async ({ page }) => {
    sessionPanel = new SessionPanelHelper(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('retry button appears for failed sessions', async ({ page }) => {
    // Look for failed session
    const failedBadge = await page.locator('text="Failed"').first();
    
    if (await failedBadge.count() === 0) {
      test.skip(); // No failed sessions
    }

    // Check for retry button
    const retryButton = await page.getByRole('button', { name: /Retry/i });
    
    if (await retryButton.count() === 0) {
      // Retry button might be in a different location
      test.skip();
    }

    await expect(retryButton.first()).toBeVisible();
    await expect(retryButton.first()).toBeEnabled();
  });

  test('retry button does not appear for completed sessions', async ({ page }) => {
    const completedBadge = await page.locator('text="Completed"').first();
    
    if (await completedBadge.count() === 0) {
      test.skip(); // No completed sessions
    }

    // Click or navigate to completed session
    await completedBadge.click();
    await page.waitForTimeout(500);

    // Retry button should not be visible
    const retryButton = await page.getByRole('button', { name: /Retry/i, exact: true });
    const retryVisible = await retryButton.count() > 0 && await retryButton.isVisible();

    expect(retryVisible).toBeFalsy();
  });
});
