import type { GameMap } from '../types/MapTypes'

export const TILE_COLORS: Record<number, string> = {
  0: 'transparent',
  1: '#8B7355',
  2: '#5A8A3C',
  3: '#3D6B29',
  4: '#2D4A1E',
  5: '#8B8B8B',
  6: '#A07050',
  7: '#3A7AB5',
  8: '#C8C060',
  9: '#7BB85A',
}

/** All expected asset paths; missing files are warned on startup */
export const AssetManifest = {
  pokemonIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25],
  get spriteFront() {
    return this.pokemonIds.map((id) => `/assets/sprites/pokemon/front/${id}.png`)
  },
  get spriteBack() {
    return this.pokemonIds.map((id) => `/assets/sprites/pokemon/back/${id}.png`)
  },
  player: '/assets/sprites/overworld/player.png',
  npcs: '/assets/sprites/overworld/npcs.png',
  tilesets: {
    overworld: '/assets/tiles/overworld.png',
    interior: '/assets/tiles/interior.png',
    gym: '/assets/tiles/gym.png',
  },
  ui: {
    pokeball: '/assets/ui/pokeball-icon.png',
    badges: '/assets/ui/badges.png',
  },
} as const

/** Sprite sheet metadata for player and NPC walk animations */
export const SPRITE_SHEET_META = {
  frameWidth: 16,
  frameHeight: 16,
  directions: { down: 0, up: 1, left: 2, right: 3 } as Record<string, number>,
  framesPerDir: 3,
} as const

const imageCache = new Map<string, HTMLImageElement>()
const mapCache = new Map<string, GameMap>()

let totalAssets = 0
let loadedAssets = 0

export function getLoadProgress(): number {
  if (totalAssets === 0) return 1
  return loadedAssets / totalAssets
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!)
  }

  totalAssets++
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, img)
      loadedAssets++
      resolve(img)
    }
    img.onerror = () => {
      // Graceful fallback: store null-sentinel and resolve
      loadedAssets++
      console.warn(`AssetLoader: failed to load image "${src}", using fallback`)
      reject(new Error(`Failed to load: ${src}`))
    }
    img.src = src
  })
}

export function getCachedImage(src: string): HTMLImageElement | null {
  return imageCache.get(src) ?? null
}

export async function loadMap(mapId: string): Promise<GameMap> {
  if (mapCache.has(mapId)) {
    return mapCache.get(mapId)!
  }

  totalAssets++
  try {
    const res = await fetch(`/api/maps/${mapId}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as GameMap
    mapCache.set(mapId, data)
    loadedAssets++
    return data
  } catch (err) {
    loadedAssets++
    console.warn(`AssetLoader: failed to load map "${mapId}":`, err)
    throw err
  }
}

export function getCachedMap(mapId: string): GameMap | null {
  return mapCache.get(mapId) ?? null
}

export function setMapCache(mapId: string, map: GameMap): void {
  mapCache.set(mapId, map)
}

export function drawFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tileIndex: number,
  label?: string
): void {
  const color = TILE_COLORS[tileIndex] ?? '#FF00FF'
  if (color === 'transparent') return

  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)

  if (label) {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '4px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(String(label), x + w / 2, y + h / 2 + 2)
  }
}

export async function preloadFont(): Promise<void> {
  try {
    await document.fonts.load('8px "Press Start 2P"')
  } catch {
    console.warn('AssetLoader: Press Start 2P font failed to preload, using fallback')
  }
}

export function resetProgress(): void {
  totalAssets = 0
  loadedAssets = 0
}

/**
 * Load a Pokemon battle sprite. Returns null (with a console warning) if the
 * file is missing or fails to load — callers must draw a fallback in that case.
 */
export async function loadPokemonSprite(
  id: number,
  side: 'front' | 'back'
): Promise<HTMLImageElement | null> {
  const src = `/assets/sprites/pokemon/${side}/${id}.png`
  try {
    return await loadImage(src)
  } catch {
    return null
  }
}

/**
 * Synchronous look-up for an already-cached Pokemon sprite.
 * Returns null if not yet loaded.
 */
export function getPokemonSprite(
  id: number,
  side: 'front' | 'back'
): HTMLImageElement | null {
  return getCachedImage(`/assets/sprites/pokemon/${side}/${id}.png`)
}

/**
 * Load a tileset by logical ID ('overworld' | 'interior' | 'gym').
 * Returns null if the file is missing or fails to load.
 */
export async function loadTileset(id: string): Promise<HTMLImageElement | null> {
  const src = `/assets/tiles/${id}.png`
  try {
    return await loadImage(src)
  } catch {
    return null
  }
}

/**
 * Synchronous look-up for an already-cached tileset.
 * Returns null if not yet loaded.
 */
export function getCachedTileset(id: string): HTMLImageElement | null {
  return getCachedImage(`/assets/tiles/${id}.png`)
}

/**
 * Preload all assets listed in AssetManifest.
 * Never rejects — missing files are logged as warnings.
 */
export async function preloadAllAssets(): Promise<void> {
  const paths: string[] = [
    ...AssetManifest.spriteFront,
    ...AssetManifest.spriteBack,
    AssetManifest.player,
    AssetManifest.npcs,
    ...Object.values(AssetManifest.tilesets),
    ...Object.values(AssetManifest.ui),
  ]

  await Promise.allSettled(
    paths.map((src) =>
      loadImage(src).catch(() => {
        /* warning already logged in loadImage onerror */
      })
    )
  )
}
