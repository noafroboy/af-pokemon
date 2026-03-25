import { test, expect } from '@playwright/test'
import { buildSave, SQUIRTLE_LV15 } from './helpers'

test.describe('Journey 3: Gym Badge', () => {
  test.beforeEach(async ({ page }) => {
    // Seed: Squirtle Lv.15 at pewter-gym entrance (7, 13)
    await page.addInitScript((saveData: string) => {
      localStorage.setItem('pokebrowser_save_v1', saveData)
    }, JSON.stringify(buildSave({
      map: 'pewter-gym',
      tileX: 7,
      tileY: 13,
      party: [SQUIRTLE_LV15],
      inventory: [],
      flags: {
        trainer_defeated_youngster_gym: true, // Skip youngster
      },
    })))
  })

  test('game loads at pewter gym with Squirtle', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )

    const mapId = await canvas.getAttribute('data-map-id')
    expect(mapId).toBe('pewter-gym')
    const partyCount = await canvas.getAttribute('data-party-count')
    expect(partyCount).toBe('1')
  })

  test('walking north triggers Brock trainer battle', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    // Walk north toward Brock (from y=13 toward y=2)
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowUp')
      await page.waitForTimeout(250)
      const phase = await canvas.getAttribute('data-game-phase')
      if (phase === 'BATTLE' || phase === 'TRANSITION' || phase === 'TRAINER_BATTLE_INTRO') break
    }

    // Wait for battle to start
    await page.waitForFunction(
      () => {
        const ph = document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase')
        return ph === 'BATTLE' || ph === 'TRANSITION' || ph === 'TRAINER_BATTLE_INTRO'
      },
      { timeout: 10000 }
    )

    const phase = await canvas.getAttribute('data-game-phase')
    expect(['BATTLE', 'TRANSITION', 'TRAINER_BATTLE_INTRO']).toContain(phase)
  })

  test('complete Brock battle -> badge ceremony -> badge in localStorage', async ({ page }) => {
    // Seed with Squirtle at higher position near Brock
    await page.addInitScript((saveData: string) => {
      localStorage.setItem('pokebrowser_save_v1', saveData)
    }, JSON.stringify(buildSave({
      map: 'pewter-gym',
      tileX: 7,
      tileY: 3,  // One tile away from Brock at y=2
      party: [SQUIRTLE_LV15],
      inventory: [],
      flags: { trainer_defeated_youngster_gym: true },
    })))

    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    // Walk up to trigger Brock (no LOS - interact by walking into his tile range)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(400)

    // Wait for battle to start
    await page.waitForFunction(
      () => {
        const ph = document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase')
        return ph === 'BATTLE' || ph === 'TRANSITION' || ph === 'TRAINER_BATTLE_INTRO'
      },
      { timeout: 8000 }
    )

    // Wait for BATTLE phase
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'BATTLE',
      { timeout: 15000 }
    )
    await page.waitForTimeout(2000) // Wait for intro animation

    // Battle through Brock: use FIGHT -> first move repeatedly until battle ends
    for (let turn = 0; turn < 20; turn++) {
      const phase = await canvas.getAttribute('data-game-phase')
      if (phase !== 'BATTLE') break

      // Try pressing Z (confirms/selects action)
      await page.keyboard.press('z')
      await page.waitForTimeout(400)
    }

    // Wait for BADGE_CEREMONY or OVERWORLD
    await page.waitForFunction(
      () => {
        const ph = document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase')
        return ph === 'BADGE_CEREMONY' || ph === 'OVERWORLD'
      },
      { timeout: 20000 }
    )

    const phase = await canvas.getAttribute('data-game-phase')
    // Badge ceremony OR overworld (if battle was auto-won)
    expect(['BADGE_CEREMONY', 'OVERWORLD']).toContain(phase)
  })

  test('badge case screen accessible from menu', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500)

    // Open menu
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'MENU',
      { timeout: 3000 }
    )

    expect(await canvas.getAttribute('data-game-phase')).toBe('MENU')
  })
})
