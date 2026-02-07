import { test, expect } from '@playwright/test'

test.describe('Vite Build Configuration', () => {
  test('agentforge-ui should not have 404 errors', async ({ page }) => {
    const errors404: string[] = []

    // Listen for 404 responses
    page.on('response', response => {
      if (response.status() === 404) {
        errors404.push(`404: ${response.url()}`)
      }
    })

    await page.goto('http://localhost:5173')

    // Wait for React to mount
    await page.waitForSelector('#root', { timeout: 10000 }).catch(() => {
      // Ignore timeout
    })

    // Wait a bit for any delayed requests
    await page.waitForTimeout(2000)

    // The critical assertion: no 404 errors
    expect(
      errors404,
      `Found 404 errors:\n${errors404.join('\n')}`
    ).toHaveLength(0)
  })

  test('demo-ui should not have 404 errors', async ({ page }) => {
    const errors404: string[] = []

    page.on('response', response => {
      if (response.status() === 404) {
        errors404.push(`404: ${response.url()}`)
      }
    })

    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(2000)

    expect(
      errors404,
      `Found 404 errors:\n${errors404.join('\n')}`
    ).toHaveLength(0)
  })
})
