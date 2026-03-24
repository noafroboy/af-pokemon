export const VIEWPORT_W = 160
export const VIEWPORT_H = 144
export const TILE_SIZE = 16

export class Camera {
  x: number
  y: number
  mapWidth: number
  mapHeight: number

  constructor(mapWidth = 20, mapHeight = 20) {
    this.x = 0
    this.y = 0
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  update(playerTileX: number, playerTileY: number, pixelOffsetX = 0, pixelOffsetY = 0): void {
    const worldX = playerTileX * TILE_SIZE + TILE_SIZE / 2 + pixelOffsetX
    const worldY = playerTileY * TILE_SIZE + TILE_SIZE / 2 + pixelOffsetY

    const targetX = worldX - VIEWPORT_W / 2
    const targetY = worldY - VIEWPORT_H / 2

    const maxX = this.mapWidth * TILE_SIZE - VIEWPORT_W
    const maxY = this.mapHeight * TILE_SIZE - VIEWPORT_H

    this.x = Math.max(0, Math.min(targetX, maxX))
    this.y = Math.max(0, Math.min(targetY, maxY))
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.round(worldX - this.x),
      y: Math.round(worldY - this.y),
    }
  }

  isVisible(worldX: number, worldY: number, w = TILE_SIZE, h = TILE_SIZE): boolean {
    return (
      worldX + w > this.x &&
      worldX < this.x + VIEWPORT_W &&
      worldY + h > this.y &&
      worldY < this.y + VIEWPORT_H
    )
  }

  setMap(mapWidth: number, mapHeight: number): void {
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  getVisibleTileRange(): { startX: number; startY: number; endX: number; endY: number } {
    const startX = Math.max(0, Math.floor(this.x / TILE_SIZE))
    const startY = Math.max(0, Math.floor(this.y / TILE_SIZE))
    const endX = Math.min(this.mapWidth - 1, Math.ceil((this.x + VIEWPORT_W) / TILE_SIZE))
    const endY = Math.min(this.mapHeight - 1, Math.ceil((this.y + VIEWPORT_H) / TILE_SIZE))
    return { startX, startY, endX, endY }
  }
}
