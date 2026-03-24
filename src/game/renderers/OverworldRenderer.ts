import type { GameMap } from '../types/MapTypes'
import type { Player } from '../entities/Player'
import type { Camera } from '../engine/Camera'
import type { NPCSystem } from '../systems/NPCSystem'
import { NPC, TrainerNPC } from '../entities/NPC'
import { drawFallback, getCachedImage, TILE_COLORS } from '../engine/AssetLoader'

const TILE_SIZE = 16

// Player sprite colors by facing direction
const PLAYER_COLORS: Record<string, string> = {
  north: '#CC4444',
  south: '#CC4444',
  east:  '#CC4444',
  west:  '#CC4444',
}

export class OverworldRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    map: GameMap,
    player: Player,
    camera: Camera,
    _interpolation: number,
    npcSystem?: NPCSystem
  ): void {
    ctx.imageSmoothingEnabled = false
    const { startX, startY, endX, endY } = camera.getVisibleTileRange()

    this.drawLayer(ctx, map, map.layers.terrain, camera, startX, startY, endX, endY)
    this.drawLayer(ctx, map, map.layers.objects, camera, startX, startY, endX, endY)
    this.drawPlayer(ctx, player, camera)
    if (npcSystem) {
      this.drawNPCInstances(ctx, npcSystem.getNPCs(), camera)
    } else {
      this.drawNPCs(ctx, map, camera)
    }
  }

  private drawLayer(
    ctx: CanvasRenderingContext2D,
    map: GameMap,
    layer: number[],
    camera: Camera,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    ctx.imageSmoothingEnabled = false
    const tileset = map.tilesetPath ? getCachedImage(map.tilesetPath) : null

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        const idx = ty * map.width + tx
        const tileIndex = layer[idx] ?? 0
        if (tileIndex === 0) continue

        const worldX = tx * TILE_SIZE
        const worldY = ty * TILE_SIZE
        const { x: sx, y: sy } = camera.worldToScreen(worldX, worldY)

        if (tileset) {
          const srcX = (tileIndex - 1) * TILE_SIZE
          ctx.drawImage(tileset, srcX, 0, TILE_SIZE, TILE_SIZE, sx, sy, TILE_SIZE, TILE_SIZE)
        } else {
          drawFallback(ctx, sx, sy, TILE_SIZE, TILE_SIZE, tileIndex)
        }

        // Draw tall grass overlay marker
        if (tileIndex === 3) {
          ctx.fillStyle = 'rgba(0,80,0,0.3)'
          ctx.fillRect(sx + 2, sy + 2, TILE_SIZE - 4, TILE_SIZE - 4)
        }
      }
    }
  }

  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: Player,
    camera: Camera
  ): void {
    ctx.imageSmoothingEnabled = false
    const offset = player.getScreenOffset()
    const worldX = player.tileX * TILE_SIZE + offset.dx
    const worldY = player.tileY * TILE_SIZE + offset.dy
    const { x: sx, y: sy } = camera.worldToScreen(worldX, worldY)

    // Body
    ctx.fillStyle = PLAYER_COLORS[player.facing] ?? '#CC4444'
    ctx.fillRect(sx + 2, sy + 4, 12, 12)

    // Head
    ctx.fillStyle = '#FFCC88'
    ctx.fillRect(sx + 3, sy, 10, 8)

    // Eyes (direction indicator)
    ctx.fillStyle = '#000000'
    switch (player.facing) {
      case 'south':
        ctx.fillRect(sx + 4, sy + 3, 2, 2)
        ctx.fillRect(sx + 9, sy + 3, 2, 2)
        break
      case 'north':
        ctx.fillRect(sx + 4, sy + 2, 2, 2)
        ctx.fillRect(sx + 9, sy + 2, 2, 2)
        break
      case 'west':
        ctx.fillRect(sx + 4, sy + 3, 2, 2)
        break
      case 'east':
        ctx.fillRect(sx + 9, sy + 3, 2, 2)
        break
    }

    // Walk animation legs
    const frame = player.walkFrame
    if (player.isMoving() || frame > 0) {
      ctx.fillStyle = '#3333AA'
      if (frame === 1) {
        ctx.fillRect(sx + 3, sy + 12, 4, 4)
        ctx.fillRect(sx + 9, sy + 11, 4, 4)
      } else if (frame === 2) {
        ctx.fillRect(sx + 3, sy + 11, 4, 4)
        ctx.fillRect(sx + 9, sy + 12, 4, 4)
      } else {
        ctx.fillRect(sx + 3, sy + 12, 10, 4)
      }
    }
  }

  private drawNPCInstances(
    ctx: CanvasRenderingContext2D,
    npcs: NPC[],
    camera: Camera
  ): void {
    ctx.imageSmoothingEnabled = false
    for (const npc of npcs) {
      const worldX = npc.tileX * TILE_SIZE
      const worldY = npc.tileY * TILE_SIZE
      if (!camera.isVisible(worldX, worldY)) continue

      const { x: sx, y: sy } = camera.worldToScreen(worldX, worldY)

      // Defeated trainer faces away (north)
      const bodyColor = npc instanceof TrainerNPC && npc.defeated ? '#888888' : '#4488CC'
      ctx.fillStyle = bodyColor
      ctx.fillRect(sx + 2, sy + 4, 12, 12)
      ctx.fillStyle = '#FFCC88'
      ctx.fillRect(sx + 3, sy, 10, 8)

      // Exclamation mark for approaching trainers
      if (npc instanceof TrainerNPC && npc.approachPhase === 'EXCLAIM') {
        ctx.fillStyle = '#FF0000'
        ctx.font = 'bold 8px monospace'
        ctx.textBaseline = 'bottom'
        ctx.fillText('!', sx + 6, sy - 2)
      }
    }
  }

  private drawNPCs(
    ctx: CanvasRenderingContext2D,
    map: GameMap,
    camera: Camera
  ): void {
    ctx.imageSmoothingEnabled = false
    for (const npc of map.npcs) {
      const worldX = npc.tileX * TILE_SIZE
      const worldY = npc.tileY * TILE_SIZE
      if (!camera.isVisible(worldX, worldY)) continue

      const { x: sx, y: sy } = camera.worldToScreen(worldX, worldY)

      ctx.fillStyle = '#4488CC'
      ctx.fillRect(sx + 2, sy + 4, 12, 12)
      ctx.fillStyle = '#FFCC88'
      ctx.fillRect(sx + 3, sy, 10, 8)
    }
  }
}
