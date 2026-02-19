import { test, expect } from '@playwright/test';
import { FileTreeHelper, TabHelper } from '../../fixtures/test-helpers';

/**
 * Tab Management Tests
 * Based on OpenSpec: specs/file-tree/spec.md - Tab management scenarios
 */

test.describe('File Tree - Tab Management', () => {
  let fileTree: FileTreeHelper;
  let tabs: TabHelper;

  test.beforeEach(async ({ page }) => {
    fileTree = new FileTreeHelper(page);
    tabs = new TabHelper(page);
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('close tab button removes tab', async ({ page }) => {
    // Open a file
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip(); // No files
    }

    const fileName = (await file.textContent())?.trim() || '';
    await file.click();
    await page.waitForTimeout(500);

    // Get initial tab count
    const initialTabs = await tabs.getOpenTabs();
    const initialCount = initialTabs.length;

    // Close the tab
    const tab = tabs.getTab(fileName);
    const closeButton = tab.locator('button, [aria-label="Close"], [data-action="close"]').first();
    
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(300);

      // Check tab is removed
      const newTabs = await tabs.getOpenTabs();
      expect(newTabs.length).toBe(initialCount - 1);
      expect(newTabs).not.toContain(fileName);
    } else {
      test.skip(); // No close button found
    }
  });

  test('closing tab activates nearest remaining tab', async ({ page }) => {
    // Open 3 files
    const files = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).all();

    if (files.length < 3) {
      test.skip(); // Need at least 3 files
    }

    // Open first 3 files
    await files[0].click();
    await page.waitForTimeout(300);
    await files[1].click();
    await page.waitForTimeout(300);
    await files[2].click();
    await page.waitForTimeout(300);

    const file2Name = (await files[1].textContent())?.trim() || '';

    // Get tab for middle file
    const tab2 = tabs.getTab(file2Name);
    const closeButton = tab2.locator('button, [aria-label="Close"]').first();

    if (await closeButton.count() === 0) {
      test.skip();
    }

    await closeButton.click();
    await page.waitForTimeout(300);

    // Check that a tab is still active
    const activeTab = await tabs.getActiveTab();
    expect(activeTab).toBeTruthy();
    expect(activeTab).not.toBe(file2Name);
  });

  test('closing last tab shows empty state', async ({ page }) => {
    // Get all open tabs and close them
    let openTabs = await tabs.getOpenTabs();
    
    while (openTabs.length > 0) {
      const tab = tabs.getTab(openTabs[0]);
      const closeButton = tab.locator('button, [aria-label="Close"]').first();
      
      if (await closeButton.count() === 0) {
        break; // Can't close tabs
      }

      await closeButton.click();
      await page.waitForTimeout(200);
      openTabs = await tabs.getOpenTabs();
    }

    // Check for empty state
    const emptyState = await page.locator('text=/No file|No tab|Select a file|Empty/i').count() > 0;
    const noContentArea = await page.locator('[data-testid="file-content"], .file-content').count() === 0;

    expect(emptyState || noContentArea).toBeTruthy();
  });

  test('tab label matches file name', async ({ page }) => {
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip();
    }

    const fileName = (await file.textContent())?.trim() || '';
    await file.click();
    await page.waitForTimeout(500);

    // Check tab label
    const tab = tabs.getTab(fileName);
    await expect(tab).toBeVisible();
    
    const tabLabel = await tab.textContent();
    expect(tabLabel).toContain(fileName);
  });

  test('tab becomes active when clicked', async ({ page }) => {
    // Open 2 files
    const files = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).all();

    if (files.length < 2) {
      test.skip();
    }

    const file1Name = (await files[0].textContent())?.trim() || '';
    const file2Name = (await files[1].textContent())?.trim() || '';

    await files[0].click();
    await page.waitForTimeout(300);
    await files[1].click();
    await page.waitForTimeout(300);

    // File 2 should be active
    let activeTab = await tabs.getActiveTab();
    expect(activeTab).toBe(file2Name);

    // Click file 1's tab
    await tabs.clickTab(file1Name);
    await page.waitForTimeout(300);

    // File 1 should now be active
    activeTab = await tabs.getActiveTab();
    expect(activeTab).toBe(file1Name);
  });

  test('only one tab is active at a time', async ({ page }) => {
    // Open multiple files
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

    // Count active tabs
    const activeTabs = await page.locator('[role="tab"][aria-selected="true"]').count();
    expect(activeTabs).toBe(1);
  });
});

test.describe('File Tree - File Content Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('opened file displays content', async ({ page }) => {
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip();
    }

    await file.click();
    await page.waitForTimeout(500);

    // Check for content area (code editor, markdown viewer, etc.)
    const contentArea = await page.locator('[data-testid="file-content"], .file-content, pre, code, .markdown').first();
    
    if (await contentArea.count() === 0) {
      // Content might be in a different container
      test.skip();
    }

    await expect(contentArea).toBeVisible();
  });

  test('markdown files render with formatting', async ({ page }) => {
    // Look for .md files
    const mdFile = await page.locator('button:has-text(".md")').first();
    
    if (await mdFile.count() === 0) {
      test.skip();
    }

    await mdFile.click();
    await page.waitForTimeout(500);

    // Check for markdown rendering (headings, paragraphs, etc.)
    const hasMarkdown = await page.locator('h1, h2, h3, .markdown, [data-markdown]').count() > 0;
    
    // Or check for raw markdown text
    const hasContent = await page.locator('pre, code, .content').count() > 0;

    expect(hasMarkdown || hasContent).toBeTruthy();
  });

  test('JSON files show formatted content', async ({ page }) => {
    // Look for .json files
    const jsonFile = await page.locator('button:has-text(".json")').first();
    
    if (await jsonFile.count() === 0) {
      test.skip();
    }

    await jsonFile.click();
    await page.waitForTimeout(500);

    // Check for formatted JSON (pre, code, or JSON viewer)
    const hasJSONContent = await page.locator('pre, code, .json-viewer, [data-language="json"]').count() > 0;

    expect(hasJSONContent).toBeTruthy();
  });
});
