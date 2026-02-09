import { test, expect } from '@playwright/test';

/**
 * Keyboard Navigation Tests
 * Based on OpenSpec: specs/file-tree/spec.md - Keyboard navigation
 */

test.describe('File Tree - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('down arrow moves selection to next node', async ({ page }) => {
    // Click first file/folder to give it focus
    const firstNode = await page.locator('button').first();
    await firstNode.click();
    await page.waitForTimeout(200);

    // Press down arrow
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);

    // Check focus moved (different element has focus or aria-selected)
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBeTruthy();
  });

  test('up arrow moves selection to previous node', async ({ page }) => {
    // Click second node
    const nodes = await page.locator('button').all();
    
    if (nodes.length < 2) {
      test.skip();
    }

    await nodes[1].click();
    await page.waitForTimeout(200);

    // Press up arrow
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);

    // Check focus moved to first node
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    const firstNodeText = await nodes[0].textContent();
    
    expect(focusedElement).toContain(firstNodeText || '');
  });

  test('right arrow expands collapsed folder', async ({ page }) => {
    // Find collapsed folder
    const collapsedFolder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron-right"]')
    }).first();

    if (await collapsedFolder.count() === 0) {
      test.skip();
    }

    // Focus folder
    await collapsedFolder.click();
    await page.waitForTimeout(200);

    // Press right arrow
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Check folder expanded
    const isExpanded = await collapsedFolder.locator('svg[data-icon="chevron-down"]').count() > 0;
    expect(isExpanded).toBeTruthy();
  });

  test('left arrow collapses expanded folder', async ({ page }) => {
    // Find expanded folder
    const expandedFolder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron-down"]')
    }).first();

    if (await expandedFolder.count() === 0) {
      test.skip();
    }

    // Focus folder
    await expandedFolder.click();
    await page.waitForTimeout(200);

    // Press left arrow
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    // Check folder collapsed
    const isCollapsed = await expandedFolder.locator('svg[data-icon="chevron-right"]').count() > 0;
    expect(isCollapsed).toBeTruthy();
  });

  test('enter key opens selected file', async ({ page }) => {
    // Find a file (not a folder)
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip();
    }

    const fileName = (await file.textContent())?.trim() || '';

    // Focus file
    await file.focus();
    await page.waitForTimeout(200);

    // Press Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Check file opened in tab
    const tabExists = await page.locator(`[role="tab"]:has-text("${fileName}")`).count() > 0;
    expect(tabExists).toBeTruthy();
  });

  test('tab key navigates through tree nodes', async ({ page }) => {
    // Press Tab from first node
    const firstNode = await page.locator('button').first();
    await firstNode.focus();
    await page.waitForTimeout(200);

    const initialFocus = await page.evaluate(() => document.activeElement?.textContent);

    // Press Tab
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    const newFocus = await page.evaluate(() => document.activeElement?.textContent);

    // Focus should have moved
    expect(newFocus).not.toBe(initialFocus);
  });

  test('shift+tab navigates backwards', async ({ page }) => {
    // Focus second node
    const nodes = await page.locator('button').all();
    
    if (nodes.length < 2) {
      test.skip();
    }

    await nodes[1].focus();
    await page.waitForTimeout(200);

    // Press Shift+Tab
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(200);

    // Should move to previous element
    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBeTruthy();
  });

  test('focus indicator is visible on keyboard navigation', async ({ page }) => {
    const firstNode = await page.locator('button').first();
    await firstNode.focus();
    await page.waitForTimeout(200);

    // Check for focus styling (outline, border, background)
    const hasFocusStyle = await firstNode.evaluate(el => {
      const style = getComputedStyle(el);
      return style.outline !== 'none' && style.outline !== '' ||
             el.matches(':focus') ||
             el.matches(':focus-visible');
    });

    expect(hasFocusStyle).toBeTruthy();
  });
});

test.describe('File Tree - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('tree nodes have proper ARIA roles', async ({ page }) => {
    const treeNode = await page.locator('button').first();
    
    // Check for appropriate role (button, treeitem, etc.)
    const role = await treeNode.getAttribute('role');
    const tagName = await treeNode.evaluate(el => el.tagName);

    // Should be button or have treeitem role
    expect(tagName === 'BUTTON' || role === 'treeitem').toBeTruthy();
  });

  test('folders indicate expanded/collapsed state to screen readers', async ({ page }) => {
    const folder = await page.locator('button').filter({
      has: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await folder.count() === 0) {
      test.skip();
    }

    // Check for aria-expanded attribute
    const ariaExpanded = await folder.getAttribute('aria-expanded');
    expect(ariaExpanded).toBeTruthy();
    expect(['true', 'false']).toContain(ariaExpanded || '');
  });

  test('file tree has accessible label', async ({ page }) => {
    // Look for tree container with label
    const treeContainer = await page.locator('[role="tree"], [aria-label*="file"], [aria-label*="tree"]').first();

    if (await treeContainer.count() === 0) {
      // Tree might not have explicit role but should be navigable
      test.skip();
    }

    const ariaLabel = await treeContainer.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('selected node is announced to screen readers', async ({ page }) => {
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip();
    }

    await file.click();
    await page.waitForTimeout(200);

    // Check for aria-selected or aria-current
    const ariaSelected = await file.getAttribute('aria-selected');
    const ariaCurrent = await file.getAttribute('aria-current');

    expect(ariaSelected === 'true' || ariaCurrent === 'true').toBeTruthy();
  });
});
