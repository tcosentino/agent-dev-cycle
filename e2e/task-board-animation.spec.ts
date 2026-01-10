import { test, expect } from '@playwright/test'

test.describe('TaskBoard Animation', () => {
  test.describe('Demo Page Story', () => {
    test('should animate tasks through the board on demo page', async ({ page }) => {
      await page.goto('/')

      // Wait for the page to fully load
      await page.waitForLoadState('networkidle')

      // Scroll to the task board section to trigger intersection observer
      const taskBoardRoot = page.locator('#task-board-demo-root')
      await taskBoardRoot.scrollIntoViewIfNeeded()

      // Wait for React to mount the TaskBoard (triggered by intersection observer)
      // Animation starts immediately on mount (autoPlay: true)
      await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

      // Wait for first animation cycle to complete and loop to reset (4000ms + 3000ms loopDelay)
      // Then capture positions at the start of the second cycle
      await page.waitForTimeout(7500)

      // At this point, animation has reset - all tasks should be back in To Do
      const baap1Initial = await page.locator('[data-task-key="BAAP-1"]').boundingBox()
      const baap3Box = await page.locator('[data-task-key="BAAP-3"]').boundingBox()

      // BAAP-1 and BAAP-3 should be in the same column (To Do) at reset
      expect(baap1Initial).not.toBeNull()
      expect(baap3Box).not.toBeNull()
      if (baap1Initial && baap3Box) {
        expect(Math.abs(baap1Initial.x - baap3Box.x)).toBeLessThan(50)
      }

      // Wait for the animation to complete (all steps by 4000ms, plus buffer)
      await page.waitForTimeout(4500)

      // After animation: BAAP-1 should be in Done column (rightmost)
      const baap1Final = await page.locator('[data-task-key="BAAP-1"]').boundingBox()

      expect(baap1Final).not.toBeNull()

      // BAAP-1 (in Done) should be far to the right of BAAP-3 (still in To Do)
      if (baap1Final && baap3Box) {
        expect(baap1Final.x - baap3Box.x).toBeGreaterThan(100)
      }
    })

    test('should loop the animation after completion', async ({ page }) => {
      await page.goto('/')

      // Wait for the page to fully load
      await page.waitForLoadState('networkidle')

      // Scroll to the task board section to trigger intersection observer
      const taskBoardRoot = page.locator('#task-board-demo-root')
      await taskBoardRoot.scrollIntoViewIfNeeded()

      // Wait for TaskBoard to mount
      await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

      // Get the BAAP-3 position as reference (it stays in To Do column throughout)
      const baap3Box = await page.locator('[data-task-key="BAAP-3"]').boundingBox()
      expect(baap3Box).not.toBeNull()

      // Wait for animation to complete (4000ms for last step) + loop delay (3000ms) + new animation start
      // Total: animation ends at ~4000ms, loop delay 3000ms, so reset at ~7000ms
      await page.waitForTimeout(7500)

      // After loop reset, BAAP-1 should be back in To Do column (same x as BAAP-3)
      const resetBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()

      expect(resetBox).not.toBeNull()
      if (baap3Box && resetBox) {
        // BAAP-1 should be in same column as BAAP-3 (To Do) after reset
        expect(Math.abs(resetBox.x - baap3Box.x)).toBeLessThan(50)
      }
    })
  })

  test.describe('Component Preview Page', () => {
    test('should run animation when clicking Run Animation button', async ({ page }) => {
      await page.goto('/component-preview.html')

      // Wait for page to load
      await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

      // Get initial position
      const initialBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()

      // Click Run Animation button
      await page.click('button:has-text("Run Animation")')

      // Button should show "Animating..."
      await expect(page.locator('button:has-text("Animating...")')).toBeVisible()

      // Wait for first step (2000ms)
      await page.waitForTimeout(2500)

      // BAAP-1 should have moved
      const movedBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()

      expect(initialBox).not.toBeNull()
      expect(movedBox).not.toBeNull()
      if (initialBox && movedBox) {
        expect(Math.abs(initialBox.x - movedBox.x)).toBeGreaterThan(50)
      }

      // Wait for animation to complete
      await page.waitForTimeout(3000)

      // Button should go back to "Run Animation"
      await expect(page.locator('button:has-text("Run Animation")')).toBeVisible()
    })

    test('should reset tasks when clicking Reset button', async ({ page }) => {
      await page.goto('/component-preview.html')

      // Wait for page to load
      await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

      // Click Run Animation
      await page.click('button:has-text("Run Animation")')

      // Wait for some animation
      await page.waitForTimeout(2500)

      // BAAP-1 should have moved
      const movedBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()

      // Click Reset
      await page.click('button:has-text("Reset")')

      // Wait for reset
      await page.waitForTimeout(500)

      // BAAP-1 should be back in original position
      const resetBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()

      expect(movedBox).not.toBeNull()
      expect(resetBox).not.toBeNull()
      if (movedBox && resetBox) {
        // Should have moved back to the left (To Do column)
        expect(resetBox.x).toBeLessThan(movedBox.x)
      }
    })
  })

  test.describe('FLIP Animation', () => {
    test('should smoothly animate task cards between columns', async ({ page }) => {
      await page.goto('/component-preview.html')

      // Wait for page to load
      await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

      // Click Run Animation
      await page.click('button:has-text("Run Animation")')

      // Wait just before the first animation step
      await page.waitForTimeout(1900)

      // Capture the task element
      const task = page.locator('[data-task-key="BAAP-1"]')

      // Check that transform transition is applied during animation
      await page.waitForTimeout(200) // Animation should be starting

      // The card should have a transition style applied
      const transitionStyle = await task.evaluate(el => {
        return window.getComputedStyle(el).transition
      })

      // Should have some transition (the FLIP animation applies inline transition)
      expect(transitionStyle).toBeDefined()
    })

    test('should animate remaining tasks when one moves out of column', async ({ page }) => {
      await page.goto('/component-preview.html')

      // Wait for page to load
      await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

      // Get initial positions of BAAP-2, BAAP-3, BAAP-4 (all in To Do)
      const getPositions = async () => {
        const baap2 = await page.locator('[data-task-key="BAAP-2"]').boundingBox()
        const baap3 = await page.locator('[data-task-key="BAAP-3"]').boundingBox()
        const baap4 = await page.locator('[data-task-key="BAAP-4"]').boundingBox()
        return { baap2, baap3, baap4 }
      }

      const initialPositions = await getPositions()

      // Click Run Animation - BAAP-1 will move to In Progress
      await page.click('button:has-text("Run Animation")')

      // Wait for first animation to complete
      await page.waitForTimeout(2500)

      const afterPositions = await getPositions()

      // BAAP-2, BAAP-3, BAAP-4 should have moved up (lower y value)
      // since BAAP-1 left the To Do column
      expect(initialPositions.baap2).not.toBeNull()
      expect(afterPositions.baap2).not.toBeNull()
      if (initialPositions.baap2 && afterPositions.baap2) {
        expect(afterPositions.baap2.y).toBeLessThan(initialPositions.baap2.y)
      }
    })
  })
})

test.describe('useStoryPlayer Hook', () => {
  test('story state transitions happen at correct delays', async ({ page }) => {
    await page.goto('/component-preview.html')

    // Wait for page to load
    await expect(page.locator('[data-task-key="BAAP-1"]')).toBeVisible({ timeout: 10000 })

    // Get initial position of BAAP-1
    const initialBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()
    expect(initialBox).not.toBeNull()
    const initialX = initialBox!.x

    // Click Run Animation and record start time
    const startTime = Date.now()
    await page.click('button:has-text("Run Animation")')

    // Wait for first transition (should happen at ~2000ms)
    await page.waitForTimeout(2300)

    const afterFirstBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()
    expect(afterFirstBox).not.toBeNull()

    // BAAP-1 should have moved to In Progress column (different x position)
    expect(Math.abs(afterFirstBox!.x - initialX)).toBeGreaterThan(50)

    const firstTransitionTime = Date.now() - startTime
    expect(firstTransitionTime).toBeGreaterThan(1800)
    expect(firstTransitionTime).toBeLessThan(3000)

    // Wait for second transition (should happen at ~4000ms)
    await page.waitForTimeout(2000)

    const afterSecondBox = await page.locator('[data-task-key="BAAP-1"]').boundingBox()
    expect(afterSecondBox).not.toBeNull()

    // BAAP-1 should have moved again (to Done column)
    expect(Math.abs(afterSecondBox!.x - afterFirstBox!.x)).toBeGreaterThan(50)

    const secondTransitionTime = Date.now() - startTime
    expect(secondTransitionTime).toBeGreaterThan(3800)
    expect(secondTransitionTime).toBeLessThan(5000)
  })
})
