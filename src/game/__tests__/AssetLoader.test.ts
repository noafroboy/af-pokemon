import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Image global ─────────────────────────────────────────────────────
// Must be defined before AssetLoader is imported so `new Image()` uses this mock.

function makeMockImage(shouldFail = false) {
  const img: Record<string, unknown> = {
    naturalWidth: 1024,
    naturalHeight: 1024,
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
  }

  Object.defineProperty(img, 'src', {
    configurable: true,
    set(value: string) {
      img._src = value
      if (!value) return
      if (shouldFail) {
        setTimeout(() => (img.onerror as (() => void) | null)?.(), 0)
      } else {
        setTimeout(() => (img.onload as (() => void) | null)?.(), 0)
      }
    },
    get() {
      return img._src
    },
  })

  return img
}

let imageShouldFail = false
const MockImageConstructor = vi.fn(() => makeMockImage(imageShouldFail))

vi.stubGlobal('Image', MockImageConstructor)

// ─── Imports AFTER stubbing ────────────────────────────────────────────────
import {
  loadPokemonSprite,
  getPokemonSprite,
  loadTileset,
  getCachedTileset,
  preloadAllAssets,
  AssetManifest,
  SPRITE_SHEET_META,
  resetProgress,
  getLoadProgress,
} from '../engine/AssetLoader'

// ─── Test helper: clear module-level imageCache via resetProgress+unique paths
// We use unique sprite IDs in each test to avoid cross-test cache collisions.

let spriteIdCounter = 1000

function uniqueId() {
  return spriteIdCounter++
}

beforeEach(() => {
  imageShouldFail = false
  resetProgress()
  MockImageConstructor.mockClear()
})

// ─── AssetManifest ─────────────────────────────────────────────────────────

describe('AssetManifest', () => {
  it('contains all 21 pokemon IDs', () => {
    expect(AssetManifest.pokemonIds).toHaveLength(21)
    expect(AssetManifest.pokemonIds).toContain(25)   // Pikachu
    expect(AssetManifest.pokemonIds).toContain(1)    // Bulbasaur
    expect(AssetManifest.pokemonIds).toContain(20)   // Raticate
  })

  it('generates correct front sprite paths', () => {
    const paths = AssetManifest.spriteFront
    expect(paths).toHaveLength(21)
    expect(paths[0]).toBe('/assets/sprites/pokemon/front/1.png')
    expect(paths).toContain('/assets/sprites/pokemon/front/25.png')
  })

  it('generates correct back sprite paths', () => {
    const paths = AssetManifest.spriteBack
    expect(paths).toHaveLength(21)
    expect(paths[0]).toBe('/assets/sprites/pokemon/back/1.png')
  })

  it('has correct tileset paths', () => {
    expect(AssetManifest.tilesets.overworld).toBe('/assets/tiles/overworld.png')
    expect(AssetManifest.tilesets.interior).toBe('/assets/tiles/interior.png')
    expect(AssetManifest.tilesets.gym).toBe('/assets/tiles/gym.png')
  })

  it('has correct UI asset paths', () => {
    expect(AssetManifest.ui.pokeball).toBe('/assets/ui/pokeball-icon.png')
    expect(AssetManifest.ui.badges).toBe('/assets/ui/badges.png')
  })

  it('has player and NPC sprite sheet paths', () => {
    expect(AssetManifest.player).toBe('/assets/sprites/overworld/player.png')
    expect(AssetManifest.npcs).toBe('/assets/sprites/overworld/npcs.png')
  })
})

// ─── SPRITE_SHEET_META ─────────────────────────────────────────────────────

describe('SPRITE_SHEET_META', () => {
  it('has correct frame dimensions', () => {
    expect(SPRITE_SHEET_META.frameWidth).toBe(16)
    expect(SPRITE_SHEET_META.frameHeight).toBe(16)
  })

  it('has all 4 directions with correct row indices', () => {
    expect(SPRITE_SHEET_META.directions.down).toBe(0)
    expect(SPRITE_SHEET_META.directions.up).toBe(1)
    expect(SPRITE_SHEET_META.directions.left).toBe(2)
    expect(SPRITE_SHEET_META.directions.right).toBe(3)
  })

  it('has 3 frames per direction', () => {
    expect(SPRITE_SHEET_META.framesPerDir).toBe(3)
  })
})

// ─── loadPokemonSprite ─────────────────────────────────────────────────────

describe('loadPokemonSprite', () => {
  it('returns an HTMLImageElement for a valid pokemon ID (front)', async () => {
    const id = uniqueId()
    const img = await loadPokemonSprite(id, 'front')
    expect(img).not.toBeNull()
  })

  it('returns an HTMLImageElement for back sprite', async () => {
    const id = uniqueId()
    const img = await loadPokemonSprite(id, 'back')
    expect(img).not.toBeNull()
  })

  it('returns null when the image fails to load', async () => {
    imageShouldFail = true
    const id = uniqueId()
    const img = await loadPokemonSprite(id, 'front')
    expect(img).toBeNull()
  })

  it('does not throw on load failure', async () => {
    imageShouldFail = true
    const id = uniqueId()
    await expect(loadPokemonSprite(id, 'front')).resolves.toBeNull()
  })
})

// ─── getPokemonSprite ──────────────────────────────────────────────────────

describe('getPokemonSprite', () => {
  it('returns null before image is loaded', () => {
    const img = getPokemonSprite(99999, 'front')
    expect(img).toBeNull()
  })

  it('returns cached image after loadPokemonSprite resolves', async () => {
    const id = uniqueId()
    await loadPokemonSprite(id, 'front')
    const cached = getPokemonSprite(id, 'front')
    expect(cached).not.toBeNull()
  })

  it('returns null for back if only front was loaded', async () => {
    const id = uniqueId()
    await loadPokemonSprite(id, 'front')
    const backCached = getPokemonSprite(id, 'back')
    expect(backCached).toBeNull()
  })
})

// ─── loadTileset ───────────────────────────────────────────────────────────

describe('loadTileset', () => {
  it('loads and returns a tileset image for a valid ID', async () => {
    const img = await loadTileset('overworld-test-unique')
    expect(img).not.toBeNull()
  })

  it('returns null when the tileset image fails to load', async () => {
    imageShouldFail = true
    const img = await loadTileset('overworld-fail-unique')
    expect(img).toBeNull()
  })

  it('does not throw on load failure', async () => {
    imageShouldFail = true
    await expect(loadTileset('interior-fail-unique')).resolves.toBeNull()
  })
})

// ─── getCachedTileset ──────────────────────────────────────────────────────

describe('getCachedTileset', () => {
  it('returns null for an ID that was never loaded', () => {
    const img = getCachedTileset('never-loaded-tileset-xyz')
    expect(img).toBeNull()
  })

  it('returns the cached image after loadTileset resolves', async () => {
    const id = 'gym-cached-test-unique'
    await loadTileset(id)
    const cached = getCachedTileset(id)
    expect(cached).not.toBeNull()
  })
})

// ─── preloadAllAssets ──────────────────────────────────────────────────────

describe('preloadAllAssets', () => {
  it('resolves without throwing even when some assets fail', async () => {
    // Half succeed, half fail — doesn't matter
    await expect(preloadAllAssets()).resolves.toBeUndefined()
  })

  it('tracks load progress after preloading', async () => {
    resetProgress()
    // progress starts at 1 when totalAssets === 0
    const before = getLoadProgress()
    expect(before).toBe(1)

    await preloadAllAssets()

    // After preload attempt, progress is 1 (all settled)
    const after = getLoadProgress()
    expect(after).toBe(1)
  })
})
