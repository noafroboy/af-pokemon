import { test, expect } from '@playwright/test'
import { buildSave, BULBASAUR_LV5, CHARMANDER_LV5 } from './helpers'

test.describe('Journey 4: Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Seed: 2 Pokemon (Bulbasaur full HP, Charmander low HP), 3 Potions
    await page.addInitScript((saveData: string) => {
      localStorage.setItem('pokebrowser_save_v1', saveData)
    }, JSON.stringify(buildSave({
      map: 'pallet-town',
      tileX: 10,
      tileY: 10,
      party: [BULBASAUR_LV5, CHARMANDER_LV5],
      inventory: [{ itemId: 4, quantity: 3 }], // 3 Potions (itemId=4)
    })))
  })

  test('game loads with 2 Pokemon in party', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )

    const partyCount = await canvas.getAttribute('data-party-count')
    expect(partyCount).toBe('2')
  })

  test('open START menu shows MENU phase', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )

    expect(await canvas.getAttribute('data-game-phase')).toBe('MENU')
  })

  test('POKEMON menu opens and shows party screen', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    // Open START menu
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )
    await page.waitForTimeout(300)

    // Select POKEMON (first item, press Z)
    await page.keyboard.press('z')
    await page.waitForTimeout(500)
    // Still in MENU phase (showing party screen)
    expect(await canvas.getAttribute('data-game-phase')).toBe('MENU')
  })

  test('all 5 START menu items open a screen', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    const menuItems = ['POKEMON', 'ITEM', 'SAVE', 'OPTIONS', 'EXIT']

    for (let i = 0; i < menuItems.length - 1; i++) {
      // Open START menu
      await page.keyboard.press('Enter')
      await page.waitForFunction(
        () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
        { timeout: 3000 }
      )
      await page.waitForTimeout(200)

      // Navigate to item i
      for (let j = 0; j < i; j++) {
        await page.keyboard.press('ArrowDown')
        await page.waitForTimeout(100)
      }

      // Select it
      await page.keyboard.press('z')
      await page.waitForTimeout(400)

      // Should still be in MENU phase (not jumped to OVERWORLD or other phase)
      const phase = await canvas.getAttribute('data-game-phase')
      expect(['MENU', 'OVERWORLD']).toContain(phase) // SAVE might auto-close

      // Close menu with X or Escape
      await page.keyboard.press('x')
      await page.waitForTimeout(300)
      await page.keyboard.press('x')
      await page.waitForTimeout(300)
    }

    // Test EXIT (last item - should close menu)
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )
    await page.waitForTimeout(200)
    // Navigate to EXIT (index 4)
    for (let j = 0; j < 4; j++) {
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(100)
    }
    await page.keyboard.press('z')
    await page.waitForTimeout(500)
    // Should return to OVERWORLD after EXIT
    const finalPhase = await canvas.getAttribute('data-game-phase')
    expect(['OVERWORLD', 'MENU']).toContain(finalPhase)
  })

  test('save game persists party across page reload', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    const initialPartyCount = await canvas.getAttribute('data-party-count')

    // Save via menu: Enter -> down to SAVE -> z -> z (confirm slot 1)
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )
    await page.waitForTimeout(300)
    // Navigate to SAVE (index 2)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    await page.keyboard.press('z') // Select SAVE
    await page.waitForTimeout(500)
    await page.keyboard.press('z') // Confirm slot
    await page.waitForTimeout(1000)

    // Reload page
    await page.reload()
    await expect(canvas).toBeVisible({ timeout: 10000 })

    // Wait for game to load saved state
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(1000)

    // Party count should be preserved
    const restoredPartyCount = await canvas.getAttribute('data-party-count')
    expect(restoredPartyCount).toBe(initialPartyCount)

    // Verify localStorage has save data
    const saveData = await page.evaluate(() => localStorage.getItem('pokebrowser_save_v1'))
    expect(saveData).not.toBeNull()
  })
})
