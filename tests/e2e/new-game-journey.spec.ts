import { test, expect } from '@playwright/test'

test.describe('Journey 1: New Game', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh — no save data
    await page.addInitScript(() => {
      localStorage.removeItem('pokebrowser_save_v1')
      localStorage.removeItem('pokebrowser_save_0')
    })
  })

  test('title screen renders and shows PRESS ENTER', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    // Canvas should have TITLE phase
    await expect(canvas).toHaveAttribute('data-game-phase', 'TITLE', { timeout: 5000 })
  })

  test('pressing Enter advances from title to dialog (Oak intro)', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })
    // Wait for title phase
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'TITLE',
      { timeout: 8000 }
    )
    await page.waitForTimeout(500) // Let game fully init
    await page.keyboard.press('Enter')
    // Phase should transition to DIALOG
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'DIALOG',
      { timeout: 5000 }
    )
    expect(await canvas.getAttribute('data-game-phase')).toBe('DIALOG')
  })

  test('complete onboarding: dialog + name entry -> OVERWORLD', async ({ page }) => {
    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    // Wait for TITLE
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'TITLE',
      { timeout: 8000 }
    )
    await page.waitForTimeout(800)

    // Press Enter to start Oak intro
    await page.keyboard.press('Enter')
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'DIALOG',
      { timeout: 5000 }
    )

    // Advance through Oak dialog pages (3 pages, Z to skip/advance)
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(400)
      await page.keyboard.press('z')
    }

    // Now should be in name entry (still DIALOG phase)
    await page.waitForTimeout(500)
    // Type player name: A, S, H
    await page.keyboard.type('ASH')
    await page.waitForTimeout(300)
    // Confirm name with Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Now rival name entry
    await page.keyboard.type('GARY')
    await page.waitForTimeout(300)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)

    // Should eventually reach OVERWORLD
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'OVERWORLD',
      { timeout: 10000 }
    )

    const phase = await canvas.getAttribute('data-game-phase')
    expect(phase).toBe('OVERWORLD')
    const mapId = await canvas.getAttribute('data-map-id')
    expect(mapId).toBe('pallet-town')
  })

  test('starter selection gives player 1 Pokemon', async ({ page }) => {
    // Pre-seed to skip onboarding but place player near starter zone
    await page.addInitScript(() => {
      const save = {
        '1': {
          slot: 1, schemaVersion: 1, playerName: 'ASH', badges: [],
          playtimeSeconds: 0, savedAt: Date.now(),
          gameState: {
            currentMap: 'pallet-town', playerTileX: 7, playerTileY: 4,
            party: [], partyPokemon: [], inventory: [],
            flags: { NEW_GAME_STARTED: true, playerName: 'ASH' },
            activeSlot: 1,
          },
        },
      }
      localStorage.setItem('pokebrowser_save_v1', JSON.stringify(save))
    })

    await page.goto('/')
    const canvas = page.getByTestId('game-canvas')
    await expect(canvas).toBeVisible({ timeout: 10000 })

    // Wait for OVERWORLD phase (skips title since NEW_GAME_STARTED=true)
    await page.waitForFunction(
      () => {
        const ph = document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase')
        return ph === 'OVERWORLD' || ph === 'DIALOG'
      },
      { timeout: 8000 }
    )

    await page.waitForTimeout(500)
    // Walk into the starter trigger zone (7,3) from (7,4) by pressing ArrowUp
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(400)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(400)

    // Should trigger DIALOG (starter selection)
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-canvas"]')?.getAttribute('data-game-phase') === 'DIALOG',
      { timeout: 5000 }
    )

    // Select CHARMANDER (index 1 with ArrowDown then Z to confirm)
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown') // cursor to CHARMANDER
    await page.waitForTimeout(200)
    await page.keyboard.press('z') // confirm CHARMANDER choice
    await page.waitForTimeout(500)

    // Advance through "CHARMANDER chose you!" dialogs
    await page.keyboard.press('z')
    await page.waitForTimeout(300)
    await page.keyboard.press('z')
    await page.waitForTimeout(300)

    // Wait for return to OVERWORLD with 1 party Pokemon
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('[data-testid="game-canvas"]')
        return canvas?.getAttribute('data-party-count') === '1'
      },
      { timeout: 10000 }
    )

    const partyCount = await canvas.getAttribute('data-party-count')
    expect(partyCount).toBe('1')
    const mapId = await canvas.getAttribute('data-map-id')
    expect(mapId).toBe('pallet-town')
  })
})
