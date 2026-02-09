import { test, expect } from '@playwright/test';
import { FileTreeHelper, TabHelper } from '../../fixtures/test-helpers';

/**
 * File Tree Navigation Tests
 * Based on OpenSpec: openspec/changes/existing-features/specs/file-tree/spec.md
 */

test.describe('File Tree - Basic Navigation', () => {
  let fileTree: FileTreeHelper;
  let tabs: TabHelper;

  test.beforeEach(async ({ page }) => {
    fileTree = new FileTreeHelper(page);
    tabs = new TabHelper(page);
    
    // Navigate to AgentForge UI
    await page.goto('/');
    
    // Wait for file tree to load
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('folder displays chevron icon', async ({ page }) => {
    // Find a folder node (has chevron)
    const folder = await page.locator('button').filter({
      has: page.locator('svg[data-icon*="chevron"]')
    }).first();

    await expect(folder).toBeVisible();
    
    // Check for right chevron (collapsed) or down chevron (expanded)
    const hasChevron = await folder.locator('svg[data-icon*="chevron"]').count() > 0;
    expect(hasChevron).toBeTruthy();
  });

  test('click folder to expand', async ({ page }) => {
    // Find first collapsed folder
    const folder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron-right"]')
    }).first();

    if (await folder.count() === 0) {
      test.skip(); // No collapsed folders in this project
    }

    const folderName = await folder.textContent();
    
    // Click to expand
    await folder.click();
    
    // Wait for expansion
    await page.waitForTimeout(300);
    
    // Check chevron changed to down
    await expect(folder.locator('svg[data-icon="chevron-down"]')).toBeVisible();
  });

  test('click expanded folder to collapse', async ({ page }) => {
    // Find first expanded folder
    const folder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron-down"]')
    }).first();

    if (await folder.count() === 0) {
      test.skip(); // No expanded folders
    }

    // Click to collapse
    await folder.click();
    
    // Wait for collapse
    await page.waitForTimeout(300);
    
    // Check chevron changed to right
    await expect(folder.locator('svg[data-icon="chevron-right"]')).toBeVisible();
  });

  test('nested folders have increased indentation', async ({ page }) => {
    // Expand a folder to reveal nested folders
    const firstFolder = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron"]')
    }).first();

    await firstFolder.click();
    await page.waitForTimeout(300);

    // Find nested folders
    const nestedFolders = await page.locator('button').filter({
      has: page.locator('svg[data-icon="chevron"]')
    }).all();

    if (nestedFolders.length < 2) {
      test.skip(); // No nested folders
    }

    // Check padding increases with depth
    const firstPadding = await firstFolder.evaluate(el => 
      parseInt(getComputedStyle(el).paddingLeft)
    );

    const secondFolder = nestedFolders[1];
    const secondPadding = await secondFolder.evaluate(el =>
      parseInt(getComputedStyle(el).paddingLeft)
    );

    expect(secondPadding).toBeGreaterThan(firstPadding);
  });
});

test.describe('File Tree - File Selection and Tabs', () => {
  let fileTree: FileTreeHelper;
  let tabs: TabHelper;

  test.beforeEach(async ({ page }) => {
    fileTree = new FileTreeHelper(page);
    tabs = new TabHelper(page);
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('click file opens new tab', async ({ page }) => {
    // Find first file node (no chevron icon)
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await file.count() === 0) {
      test.skip(); // No files visible
    }

    const fileName = (await file.textContent())?.trim() || '';
    
    // Click file
    await file.click();
    
    // Wait for tab to appear
    await page.waitForTimeout(500);
    
    // Check tab exists
    const tabExists = await tabs.isTabOpen(fileName);
    expect(tabExists).toBeTruthy();
  });

  test('click already-open file activates tab', async ({ page }) => {
    // Open a file
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    const fileName = (await file.textContent())?.trim() || '';
    await file.click();
    await page.waitForTimeout(500);

    // Get initial tab count
    const initialTabs = await tabs.getOpenTabs();
    const initialCount = initialTabs.length;

    // Click same file again
    await file.click();
    await page.waitForTimeout(300);

    // Tab count should not increase
    const newTabs = await tabs.getOpenTabs();
    expect(newTabs.length).toBe(initialCount);
  });

  test('multiple files can be open in tabs', async ({ page }) => {
    // Find first two files
    const files = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).all();

    if (files.length < 2) {
      test.skip(); // Need at least 2 files
    }

    // Open first file
    await files[0].click();
    await page.waitForTimeout(300);

    // Open second file
    await files[1].click();
    await page.waitForTimeout(300);

    // Check both tabs exist
    const openTabs = await tabs.getOpenTabs();
    expect(openTabs.length).toBeGreaterThanOrEqual(2);
  });

  test('file is highlighted when selected', async ({ page }) => {
    const file = await page.locator('button').filter({
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    await file.click();
    await page.waitForTimeout(300);

    // Check file has selected class or aria-selected
    const isSelected = await file.evaluate(el => {
      return el.classList.contains('treeNodeSelected') ||
             el.getAttribute('aria-selected') === 'true' ||
             el.classList.contains('selected');
    });

    expect(isSelected).toBeTruthy();
  });
});

test.describe('File Tree - Service Folders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('service folders show service badge', async ({ page }) => {
    // Look for folders with "service" badge
    const serviceFolder = await page.locator('button').filter({
      has: page.locator('text="service"')
    }).first();

    if (await serviceFolder.count() === 0) {
      test.skip(); // No service folders in this project
    }

    // Check badge is visible
    await expect(serviceFolder.locator('text="service"')).toBeVisible();
  });

  test('service folders show box icon', async ({ page }) => {
    const serviceFolder = await page.locator('button').filter({
      has: page.locator('text="service"')
    }).first();

    if (await serviceFolder.count() === 0) {
      test.skip();
    }

    // Check for box/package icon (not folder icon)
    const hasBoxIcon = await serviceFolder.locator('svg').first().evaluate(el => {
      // Look for box/package icon attributes
      return el.getAttribute('data-icon') === 'box' ||
             el.classList.contains('treeServiceIcon');
    });

    expect(hasBoxIcon).toBeTruthy();
  });
});
