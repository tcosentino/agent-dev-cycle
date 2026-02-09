import { Page, Locator, expect } from '@playwright/test';

/**
 * Test helpers for AgentForge UI testing
 */

export class ProjectHelper {
  constructor(private page: Page) {}

  async navigateToProject(projectName: string) {
    // Click project in project list or selector
    await this.page.getByRole('button', { name: projectName }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForProjectLoad() {
    // Wait for file tree to be visible
    await this.page.waitForSelector('[data-testid="file-tree"]', { timeout: 10000 });
  }
}

export class FileTreeHelper {
  constructor(private page: Page) {}

  /**
   * Get file tree container
   */
  getTree(): Locator {
    return this.page.locator('[data-testid="file-tree"]').or(
      this.page.locator('.treeNode').first().locator('..')
    );
  }

  /**
   * Get folder node by path
   */
  getFolder(path: string): Locator {
    return this.page.locator(`button:has-text("${path.split('/').pop()}")`).filter({
      has: this.page.locator('svg') // Has chevron icon
    });
  }

  /**
   * Get file node by name
   */
  getFile(fileName: string): Locator {
    return this.page.locator(`button:has-text("${fileName}")`);
  }

  /**
   * Expand folder by clicking
   */
  async expandFolder(folderName: string) {
    const folder = this.getFolder(folderName);
    const isExpanded = await folder.evaluate(el => 
      el.querySelector('[data-icon="chevron-down"]') !== null
    );
    
    if (!isExpanded) {
      await folder.click();
    }
  }

  /**
   * Collapse folder
   */
  async collapseFolder(folderName: string) {
    const folder = this.getFolder(folderName);
    const isExpanded = await folder.evaluate(el =>
      el.querySelector('[data-icon="chevron-down"]') !== null
    );
    
    if (isExpanded) {
      await folder.click();
    }
  }

  /**
   * Click file to open
   */
  async clickFile(fileName: string) {
    await this.getFile(fileName).click();
  }

  /**
   * Check if folder is expanded
   */
  async isFolderExpanded(folderName: string): Promise<boolean> {
    const folder = this.getFolder(folderName);
    return folder.evaluate(el => 
      el.querySelector('[data-icon="chevron-down"]') !== null
    );
  }

  /**
   * Get all visible file/folder names
   */
  async getVisibleNodes(): Promise<string[]> {
    const nodes = await this.page.locator('button .nodeName, button:has(.nodeName)').allTextContents();
    return nodes;
  }
}

export class TabHelper {
  constructor(private page: Page) {}

  /**
   * Get tab by file name
   */
  getTab(fileName: string): Locator {
    return this.page.locator(`[role="tab"]:has-text("${fileName}")`);
  }

  /**
   * Get all open tabs
   */
  async getOpenTabs(): Promise<string[]> {
    return this.page.locator('[role="tab"]').allTextContents();
  }

  /**
   * Click tab to activate
   */
  async clickTab(fileName: string) {
    await this.getTab(fileName).click();
  }

  /**
   * Close tab by clicking close button
   */
  async closeTab(fileName: string) {
    const tab = this.getTab(fileName);
    const closeButton = tab.locator('button[aria-label="Close"]');
    await closeButton.click();
  }

  /**
   * Get active tab name
   */
  async getActiveTab(): Promise<string | null> {
    const activeTab = await this.page.locator('[role="tab"][aria-selected="true"]').textContent();
    return activeTab;
  }

  /**
   * Check if tab is open
   */
  async isTabOpen(fileName: string): Promise<boolean> {
    return this.getTab(fileName).isVisible();
  }
}

export class SessionPanelHelper {
  constructor(private page: Page) {}

  /**
   * Get session panel container
   */
  getPanel(): Locator {
    return this.page.locator('[data-testid="session-panel"]').or(
      this.page.locator('text=/Session|Agent/').locator('..')
    );
  }

  /**
   * Get session status badge
   */
  getStatusBadge(): Locator {
    return this.page.locator('[data-testid="session-status"]').or(
      this.page.locator('text=/Running|Completed|Failed|Pending/')
    );
  }

  /**
   * Get stage by name
   */
  getStage(stageName: 'Clone' | 'Load' | 'Execute' | 'Capture' | 'Commit'): Locator {
    return this.page.locator(`button:has-text("${stageName}")`);
  }

  /**
   * Click stage to view logs
   */
  async clickStage(stageName: string) {
    await this.getStage(stageName as any).click();
  }

  /**
   * Get logs container
   */
  getLogs(): Locator {
    return this.page.locator('[data-testid="session-logs"]').or(
      this.page.locator('.logEntry').first().locator('..')
    );
  }

  /**
   * Get all log entries
   */
  async getLogEntries(): Promise<string[]> {
    return this.page.locator('.logEntry .logMessage').allTextContents();
  }

  /**
   * Click retry button
   */
  async clickRetry() {
    await this.page.getByRole('button', { name: /Retry/i }).click();
  }

  /**
   * Click copy logs button
   */
  async clickCopyLogs() {
    await this.page.getByRole('button', { name: /Copy Logs/i }).click();
  }

  /**
   * Check if retry button is visible
   */
  async isRetryVisible(): Promise<boolean> {
    return this.page.getByRole('button', { name: /Retry/i }).isVisible();
  }

  /**
   * Wait for session status
   */
  async waitForStatus(status: 'Running' | 'Completed' | 'Failed' | 'Pending', timeout = 30000) {
    await this.page.waitForSelector(`text="${status}"`, { timeout });
  }
}
