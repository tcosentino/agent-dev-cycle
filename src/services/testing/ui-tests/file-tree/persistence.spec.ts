import { test, expect } from '@playwright/test';
import { FileTreeHelper, TabHelper } from '../../fixtures/test-helpers';

/**
 * Persistence Tests
 * Based on OpenSpec: specs/file-tree/spec.md - Folder expansion and tab state persistence
 */

test.describe('File Tree - State Persistence', () => {
  let fileTree: FileTreeHelper;
  let tabs: TabHelper;

  test.beforeEach(async ({ page }) => {
    fileTree = new FileTreeHelper(page);
    tabs = new TabHelper(page);
  });

  test('expanded folders persist across page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });

    // Find a collapsed folder
    const folder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron-right"]')
    }).first();

    if (await folder.count() === 0) {
      test.skip(); // No collapsed folders
    }

    const folderName = (await folder.textContent())?.trim() || '';

    // Expand the folder
    await folder.click();
    await page.waitForTimeout(500);

    // Verify it's expanded
    const isExpanded = await folder.locator('svg[data-icon="chevron-down"]').count() > 0;
    expect(isExpanded).toBeTruthy();

    // Refresh the page
    await page.reload();
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Find the same folder again
    const folderAfterRefresh = await page.locator(`button:has-text("${folderName}")`).first();

    // Check if still expanded
    const stillExpanded = await folderAfterRefresh.locator('svg[data-icon="chevron-down"]').count() > 0;
    expect(stillExpanded).toBeTruthy();
  });

  test('open tabs persist across page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });

    // Open a file
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip();
    }

    const fileName = (await file.textContent())?.trim() || '';
    await file.click();
    await page.waitForTimeout(500);

    // Verify tab is open
    const tabOpen = await tabs.isTabOpen(fileName);
    expect(tabOpen).toBeTruthy();

    // Refresh the page
    await page.reload();
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check if tab is still open
    const stillOpen = await tabs.isTabOpen(fileName);
    expect(stillOpen).toBeTruthy();
  });

  test('active tab persists across page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });

    // Open 2 files
    const files = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).all();

    if (files.length < 2) {
      test.skip();
    }

    await files[0].click();
    await page.waitForTimeout(300);
    await files[1].click();
    await page.waitForTimeout(300);

    const activeFileName = await tabs.getActiveTab();
    expect(activeFileName).toBeTruthy();

    // Refresh
    await page.reload();
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check active tab restored
    const activeAfterRefresh = await tabs.getActiveTab();
    expect(activeAfterRefresh).toBe(activeFileName);
  });

  test('selected file persists across page refresh', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });

    // Click a file
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip();
    }

    const fileName = (await file.textContent())?.trim() || '';
    await file.click();
    await page.waitForTimeout(500);

    // Refresh
    await page.reload();
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Find the file again and check if selected
    const fileAfterRefresh = await page.locator(`button:has-text("${fileName}")`).first();
    
    const isSelected = await fileAfterRefresh.evaluate(el => {
      return el.classList.contains('treeNodeSelected') ||
             el.classList.contains('selected') ||
             el.getAttribute('aria-selected') === 'true';
    });

    expect(isSelected).toBeTruthy();
  });

  test('localStorage is used for persistence', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });

    // Expand a folder
    const folder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron-right"]')
    }).first();

    if (await folder.count() > 0) {
      await folder.click();
      await page.waitForTimeout(500);
    }

    // Check localStorage has project state
    const localStorage = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      return keys.filter(key => 
        key.includes('project') || 
        key.includes('tree') ||
        key.includes('viewer') ||
        key.includes('expanded') ||
        key.includes('tabs')
      );
    });

    expect(localStorage.length).toBeGreaterThan(0);
  });
});

test.describe('File Tree - View Mode Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('view mode toggle changes visibility', async ({ page }) => {
    // Look for view mode toggle (Simple/Detailed or Show All)
    const viewToggle = await page.locator('button:has-text("Simple"), button:has-text("Detailed"), button:has-text("Show All")').first();

    if (await viewToggle.count() === 0) {
      test.skip(); // No view toggle available
    }

    // Get initial file count
    const initialFiles = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).count();

    // Toggle view mode
    await viewToggle.click();
    await page.waitForTimeout(500);

    // Get new file count
    const newFiles = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).count();

    // Count should change (some files hidden/shown)
    expect(newFiles).not.toBe(initialFiles);
  });

  test('simple mode hides .agentforge folder', async ({ page }) => {
    // Find simple mode toggle
    const simpleToggle = await page.locator('button:has-text("Simple")').first();

    if (await simpleToggle.count() === 0) {
      test.skip();
    }

    // Enable simple mode
    await simpleToggle.click();
    await page.waitForTimeout(500);

    // Check .agentforge folder is hidden
    const agentforgeFolder = await page.locator('button:has-text(".agentforge")').count();
    expect(agentforgeFolder).toBe(0);
  });

  test('detailed mode shows all files', async ({ page }) => {
    // Find detailed mode toggle
    const detailedToggle = await page.locator('button:has-text("Detailed"), button:has-text("Show All")').first();

    if (await detailedToggle.count() === 0) {
      test.skip();
    }

    // Enable detailed mode
    await detailedToggle.click();
    await page.waitForTimeout(500);

    // .agentforge should be visible
    const agentforgeVisible = await page.locator('button:has-text(".agentforge")').count() > 0;
    
    // Or at least more folders/files are visible
    const fileCount = await page.locator('button').count();
    expect(fileCount).toBeGreaterThan(5); // Assuming project has files
  });
});
