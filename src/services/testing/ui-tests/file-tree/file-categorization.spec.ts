import { test, expect } from '@playwright/test';
import { FileTreeHelper } from '../../fixtures/test-helpers';

/**
 * File Categorization Tests
 * Based on OpenSpec: specs/file-tree/spec.md - File categorization and icons
 */

test.describe('File Tree - File Categorization', () => {
  let fileTree: FileTreeHelper;

  test.beforeEach(async ({ page }) => {
    fileTree = new FileTreeHelper(page);
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('config files show settings icon', async ({ page }) => {
    // Look for common config file names
    const configFiles = ['package.json', 'tsconfig.json', '.eslintrc', 'vite.config.ts'];
    
    let foundConfigFile = false;
    
    for (const fileName of configFiles) {
      const file = await page.locator(`button:has-text("${fileName}")`).first();
      
      if (await file.count() > 0 && await file.isVisible()) {
        foundConfigFile = true;
        
        // Check for settings/gear icon
        const hasSettingsIcon = await file.locator('svg').first().evaluate(el => {
          const iconAttr = el.getAttribute('data-icon') || '';
          const className = el.className || '';
          return iconAttr.includes('settings') || 
                 iconAttr.includes('gear') ||
                 iconAttr.includes('cog') ||
                 className.includes('catConfig');
        });
        
        expect(hasSettingsIcon).toBeTruthy();
        break;
      }
    }
    
    if (!foundConfigFile) {
      test.skip(); // No config files in this project
    }
  });

  test('markdown files display document icon', async ({ page }) => {
    // Look for markdown files
    const mdFile = await page.locator('button:has-text(".md")').first();
    
    if (await mdFile.count() === 0) {
      test.skip(); // No markdown files
    }

    // Check for document/file icon
    const hasDocIcon = await mdFile.locator('svg').first().evaluate(el => {
      const iconAttr = el.getAttribute('data-icon') || '';
      return iconAttr.includes('file') || 
             iconAttr.includes('document') ||
             iconAttr.includes('book');
    });

    expect(hasDocIcon).toBeTruthy();
  });

  test('source code files show code icon', async ({ page }) => {
    // Look for source code files
    const codeFiles = ['.ts', '.tsx', '.js', '.jsx', '.py'];
    
    let foundCodeFile = false;
    
    for (const ext of codeFiles) {
      const file = await page.locator(`button:has-text("${ext}")`).first();
      
      if (await file.count() > 0 && await file.isVisible()) {
        foundCodeFile = true;
        
        // Check for code icon
        const hasCodeIcon = await file.locator('svg').first().evaluate(el => {
          const iconAttr = el.getAttribute('data-icon') || '';
          const className = el.className || '';
          return iconAttr.includes('code') || 
                 className.includes('catSource') ||
                 className.includes('source');
        });
        
        expect(hasCodeIcon).toBeTruthy();
        break;
      }
    }
    
    if (!foundCodeFile) {
      test.skip(); // No source files visible
    }
  });

  test('session transcripts show clock icon', async ({ page }) => {
    // Look for .jsonl files in sessions/ directory
    // First need to expand folders to find sessions
    const folders = await page.locator('button').filter({
      has: page.locator('svg[data-icon*="chevron"]')
    }).all();

    let foundSessionFile = false;

    // Try to expand folders to find sessions
    for (const folder of folders.slice(0, 5)) { // Check first 5 folders
      const folderText = await folder.textContent();
      if (folderText?.includes('session') || folderText?.includes('agent')) {
        await folder.click();
        await page.waitForTimeout(300);
        
        // Look for .jsonl files
        const jsonlFile = await page.locator('button:has-text(".jsonl")').first();
        
        if (await jsonlFile.count() > 0) {
          foundSessionFile = true;
          
          // Check for clock/time icon
          const hasClockIcon = await jsonlFile.locator('svg').first().evaluate(el => {
            const iconAttr = el.getAttribute('data-icon') || '';
            const className = el.className || '';
            return iconAttr.includes('clock') || 
                   iconAttr.includes('time') ||
                   className.includes('catSession');
          });
          
          expect(hasClockIcon).toBeTruthy();
          break;
        }
      }
    }

    if (!foundSessionFile) {
      test.skip(); // No session files found
    }
  });

  test('files have category-specific color styling', async ({ page }) => {
    // Get any file with an icon
    const fileWithIcon = await page.locator('button').filter({
      has: page.locator('svg'),
      hasNot: page.locator('svg[data-icon*="chevron"]')
    }).first();

    if (await fileWithIcon.count() === 0) {
      test.skip(); // No files visible
    }

    // Check that the icon has some color styling (not just default)
    const icon = fileWithIcon.locator('svg').first();
    const hasColorStyling = await icon.evaluate(el => {
      const className = el.className || '';
      const style = getComputedStyle(el);
      const color = style.color || style.fill;
      
      // Check for category classes or non-default colors
      return className.includes('cat') || 
             (color && color !== 'rgb(0, 0, 0)' && color !== 'inherit');
    });

    expect(hasColorStyling).toBeTruthy();
  });
});

test.describe('File Tree - Service Folders Advanced', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('button', { timeout: 10000 });
  });

  test('service folder chevron expands folder', async ({ page }) => {
    const serviceFolder = await page.locator('button').filter({
      has: page.locator('text="service"')
    }).first();

    if (await serviceFolder.count() === 0) {
      test.skip(); // No service folders
    }

    // Find the chevron within the service folder
    const chevron = serviceFolder.locator('svg[data-icon*="chevron"]').first();
    
    if (await chevron.count() === 0) {
      test.skip(); // Service folder doesn't have chevron
    }

    // Click chevron to expand
    await chevron.click();
    await page.waitForTimeout(300);

    // Check folder expanded (chevron changed direction)
    const isExpanded = await serviceFolder.evaluate(el => {
      const chevronDown = el.querySelector('svg[data-icon="chevron-down"]');
      return chevronDown !== null;
    });

    expect(isExpanded).toBeTruthy();
  });

  test('clicking service folder name opens service view', async ({ page }) => {
    const serviceFolder = await page.locator('button').filter({
      has: page.locator('text="service"')
    }).first();

    if (await serviceFolder.count() === 0) {
      test.skip();
    }

    // Get the folder name (not the chevron)
    const folderName = serviceFolder.locator('.nodeName').first();
    
    if (await folderName.count() === 0) {
      // Try clicking the whole button (excluding chevron)
      await serviceFolder.click({ position: { x: 100, y: 10 } }); // Click to the right of chevron
    } else {
      await folderName.click();
    }

    await page.waitForTimeout(500);

    // Check if service view opened (look for service.json content or service metadata)
    const serviceViewOpened = await page.locator('text=/service.json|Service|Dataobject|Integration/i').count() > 0;

    expect(serviceViewOpened).toBeTruthy();
  });
});
