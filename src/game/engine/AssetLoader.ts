import type { GameMap } from '../types/MapTypes'
import { AssetManifest, TILE_COLORS } from './AssetManifest'

export { AssetManifest, TILE_COLORS } from './AssetManifest'
export { SPRITE_SHEET_META } from './AssetManifest'

const imageCache = new Map<string, HTMLImageElement>()
const mapCache = new Map<string, GameMap>()

let totalAssets = 0
let loadedAssets = 0

export function getLoadProgress(): number {
  if (totalAssets === 0) return 1
  return loadedAssets / totalAssets
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src)!)
  totalAssets++
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => { imageCache.set(src, img); loadedAssets++; resolve(img) }
    img.onerror = () => {
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
  if (mapCache.has(mapId)) return mapCache.get(mapId)!
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
  x: number, y: number, w: number, h: number,
  tileIndex: number, label?: string
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

export async function loadPokemonSprite(id: number, side: 'front' | 'back'): Promise<HTMLImageElement | null> {
  const src = `/assets/sprites/pokemon/${side}/${id}.png`
  try { return await loadImage(src) } catch { return null }
}

export function getPokemonSprite(id: number, side: 'front' | 'back'): HTMLImageElement | null {
  return getCachedImage(`/assets/sprites/pokemon/${side}/${id}.png`)
}

export async function loadTileset(id: string): Promise<HTMLImageElement | null> {
  const src = `/assets/tiles/${id}.png`
  try { return await loadImage(src) } catch { return null }
}

export function getCachedTileset(id: string): HTMLImageElement | null {
  return getCachedImage(`/assets/tiles/${id}.png`)
}

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
    paths.map((src) => loadImage(src).catch(() => { /* warning already logged */ }))
  )
}
