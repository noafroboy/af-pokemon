import { test, expect } from '@playwright/test'

test.describe('Game Canvas', () => {
  test('renders game canvas at correct dimensions', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    // Canvas element should be 160×144 game pixels
    const width = await canvas.getAttribute('width')
    const height = await canvas.getAttribute('height')
    expect(width).toBe('160')
    expect(height).toBe('144')

    // CSS scale should be 3x (480×432)
    const boundingBox = await canvas.boundingBox()
    expect(boundingBox?.width).toBe(480)
    expect(boundingBox?.height).toBe(432)
  })

  test('game canvas is present without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await page.waitForTimeout(2000)

    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible()

    // No critical JS errors
    const criticalErrors = errors.filter(
      e => e.includes('TypeError') || e.includes('ReferenceError')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('canvas has pixelated rendering style', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible()

    const imageRendering = await canvas.evaluate((el: HTMLCanvasElement) => {
      return window.getComputedStyle(el).imageRendering
    })
    expect(['pixelated', 'crisp-edges', '-moz-crisp-edges']).toContain(imageRendering)
  })
})
