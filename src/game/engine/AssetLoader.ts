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
