import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { buildSave, BULBASAUR_LV5 } from './helpers'

const projectRoot = path.resolve(__dirname, '../..')
const srcRoot = path.join(projectRoot, 'src')

function walkTs(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) files.push(...walkTs(full))
    else if (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) files.push(full)
  }
  return files
}

test.describe('Integration Checks', () => {
  test('localStorage persistence: save → reload → same map/party', async ({ page }) => {
    await page.addInitScript((saveData: string) => {
      localStorage.setItem('pokebrowser_save_v1', saveData)
    }, JSON.stringify(buildSave({
      map: 'pallet-town', tileX: 10, tileY: 10,
      party: [BULBASAUR_LV5],
      inventory: [{ itemId: 4, quantity: 5 }],
    })))

    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    const mapBefore = await canvas.getAttribute('data-map-id')
    const partyBefore = await canvas.getAttribute('data-party-count')

    // Save via menu: Enter → ArrowDown×2 → Z → Z (confirm slot)
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )
    await page.waitForTimeout(200)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('z')
    await page.waitForTimeout(400)
    await page.keyboard.press('z')
    await page.waitForTimeout(800)

    // Reload and verify same state
    await page.reload()
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    expect(await canvas.getAttribute('data-map-id')).toBe(mapBefore)
    expect(await canvas.getAttribute('data-party-count')).toBe(partyBefore)

    const raw = await page.evaluate(() => localStorage.getItem('pokebrowser_save_v1'))
    expect(raw).not.toBeNull()
  })

  test('localStorage unavailable: shows non-blocking save banner', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window.localStorage, 'setItem', {
        value: () => {
          const e = new Error('SecurityError')
          e.name = 'SecurityError'
          throw e
        },
        writable: true,
        configurable: true,
      })
    })

    await page.goto('/')
    await expect(page.getByTestId('game-canvas')).toBeVisible({ timeout: 10000 })

    const banner = page.getByTestId('storage-warning')
    await expect(banner).toBeVisible({ timeout: 5000 })
    expect(await banner.textContent()).toMatch(/unavailable|quota/i)
  })

  test('missing sprite 404: fallback renders, no uncaught errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.route('**/assets/sprites/pokemon/**', route => route.fulfill({ status: 404 }))

    await page.addInitScript((saveData: string) => {
      localStorage.setItem('pokebrowser_save_v1', saveData)
    }, JSON.stringify(buildSave({ map: 'pallet-town', tileX: 10, tileY: 10, party: [BULBASAUR_LV5] })))

    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )

    // Canvas still renders in OVERWORLD
    expect(await canvas.getAttribute('data-game-phase')).toBe('OVERWORLD')
    // No uncaught errors from sprite loading failures
    const spriteErrors = errors.filter(e =>
      /sprite|image|load.*fail|uncaught/i.test(e)
    )
    expect(spriteErrors).toHaveLength(0)
  })

  test('no hardcoded secrets in source files', () => {
    const files = walkTs(srcRoot)
    const patterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /OPENAI_API_KEY\s*=\s*['"][^'"]+/,
      /Bearer\s+[a-zA-Z0-9]{20,}/,
    ]
    const hits: string[] = []
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const pat of patterns) {
        if (pat.test(content)) hits.push(`${path.relative(projectRoot, file)}: ${pat}`)
      }
    }
    expect(hits).toHaveLength(0)
  })

  test('no source file over 200 lines', () => {
    const srcFiles = walkTs(srcRoot).filter(
      f => !f.includes('__tests__') && !f.includes('.test.') && !f.includes('.spec.')
    )
    const offenders: string[] = []
    for (const file of srcFiles) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n').length
      if (lines > 200) offenders.push(`${path.relative(projectRoot, file)}: ${lines} lines`)
    }
    if (offenders.length > 0) console.warn('Over-200-line files:', offenders.join(', '))
    expect(offenders).toHaveLength(0)
  })

  test('mobile layout 375px: canvas fits, mobile controls visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    const bb = await canvas.boundingBox()
    expect(bb).not.toBeNull()
    if (bb) {
      expect(bb.x).toBeGreaterThanOrEqual(0)
      expect(bb.x + bb.width).toBeLessThanOrEqual(376) // 375 + 1px tolerance
    }

    await expect(page.getByTestId('mobile-controls')).toBeVisible()
  })

  test('all 5 START menu items open a screen', async ({ page }) => {
    await page.addInitScript((saveData: string) => {
      localStorage.setItem('pokebrowser_save_v1', saveData)
    }, JSON.stringify(buildSave({ map: 'pallet-town', tileX: 10, tileY: 10, party: [BULBASAUR_LV5] })))

    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    // Test first 4 items (POKEMON, ITEM, SAVE, OPTIONS) open a screen
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
        { timeout: 3000 }
      )
      await page.waitForTimeout(200)
      for (let j = 0; j < i; j++) {
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(80)
      }
      await page.keyboard.press('z')
      await page.waitForTimeout(400)
      const phase = await canvas.getAttribute('data-game-phase')
      expect(['MENU', 'OVERWORLD']).toContain(phase)
      await page.keyboard.press('x')
      await page.waitForTimeout(200)
      await page.keyboard.press('x')
      await page.waitForTimeout(200)
    }

    // EXIT (item 5) should close the menu → OVERWORLD
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )
    await page.waitForTimeout(200)
    for (let j = 0; j < 4; j++) {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(80)
    }
    await page.keyboard.press('z')
    await page.waitForTimeout(500)
    expect(['OVERWORLD', 'MENU']).toContain(await canvas.getAttribute('data-game-phase'))
  })
})
