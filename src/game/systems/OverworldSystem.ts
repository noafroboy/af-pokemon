import type { Player, Direction } from '../entities/Player'
import type { GameState } from '../types/GameState'
import type { GameMap, EncounterTableEntry, WarpDefinition } from '../types/MapTypes'
import type { InputManager } from '../engine/InputManager'
import type { NPCSystem } from './NPCSystem'
import type { TrainerNPC } from '../entities/NPC'

const TALL_GRASS_TILE = 3

export type OverworldResult =
  | { type: 'NONE' }
  | { type: 'WARP'; target: { map: string; tileX: number; tileY: number } }
  | { type: 'ENCOUNTER'; encounterTable: EncounterTableEntry[] }
  | { type: 'DIALOG'; npcId: string; pages: string[][] }
  | { type: 'TRAINER_SPOTTED'; npc: TrainerNPC }
  | { type: 'SCRIPT'; scriptId: string }

export class OverworldSystem {
  private lastScriptZone: string | null = null
  private encounterCooldown = 0
  private input: InputManager
  private npcSystem: NPCSystem | null = null

  constructor(input: InputManager, npcSystem?: NPCSystem) {
    this.input = input
    this.npcSystem = npcSystem ?? null
  }

  setNPCSystem(npcSystem: NPCSystem): void {
    this.npcSystem = npcSystem
  }

  resetEncounterCooldown(): void { this.encounterCooldown = 30 }

  update(player: Player, state: GameState, map: GameMap | null): OverworldResult {
    if (this.encounterCooldown > 0) this.encounterCooldown--
    // A-press NPC interaction
    if (this.input.wasJustPressed('z')) {
      const result = this.checkNPCInteraction(player)
      if (result.type !== 'NONE') return result
    }

    this.handleInput(player, map)
    player.updateMovement()

    if (player.isMoving() || !map) {
      return { type: 'NONE' }
    }

    // NPC update for LOS
    if (this.npcSystem) {
      const spotted = this.npcSystem.update(16, player, map)
      if (spotted) {
        return { type: 'TRAINER_SPOTTED', npc: spotted }
      }
    }

    // Player just finished a tile step
    const warp = this.checkWarp(player, map)
    if (warp) {
      return {
        type: 'WARP',
        target: { map: warp.targetMap, tileX: warp.targetX, tileY: warp.targetY },
      }
    }

    const encounter = this.checkEncounter(player, map, state)
    if (encounter) {
      return { type: 'ENCOUNTER', encounterTable: encounter }
    }

    // Script zones — fire once per entry, not every tick
    if (this.npcSystem) {
      const scriptId = this.npcSystem.checkScriptZones(player, map)
      if (scriptId && scriptId !== this.lastScriptZone && !state.flags[`script_done_${scriptId}`]) {
        this.lastScriptZone = scriptId
        return { type: 'SCRIPT', scriptId }
      }
      if (!scriptId) this.lastScriptZone = null
    }

    // Process queued movement
    if (player.moveQueue.length > 0) {
      const dir = player.moveQueue.shift()!
      this.tryMove(player, dir, map)
    }

    return { type: 'NONE' }
  }

  checkNPCInteraction(player: Player): OverworldResult {
    if (!this.npcSystem) return { type: 'NONE' }
    const result = this.npcSystem.handleInteraction(player)
    if (result.type === 'DIALOG') {
      return { type: 'DIALOG', npcId: result.npcId, pages: result.pages }
    }
    if (result.type === 'TRAINER_BATTLE') {
      return { type: 'TRAINER_SPOTTED', npc: result.npc }
    }
    return { type: 'NONE' }
  }

  private handleInput(player: Player, map: GameMap | null): void {
    if (this.input.wasJustPressed('ArrowUp')) player.enqueueDirection('north')
    else if (this.input.wasJustPressed('ArrowDown')) player.enqueueDirection('south')
    else if (this.input.wasJustPressed('ArrowLeft')) player.enqueueDirection('west')
    else if (this.input.wasJustPressed('ArrowRight')) player.enqueueDirection('east')

    // Also handle held keys for continuous movement
    if (!player.isMoving() && player.moveQueue.length === 0) {
      if (this.input.isPressed('ArrowUp')) player.enqueueDirection('north')
      else if (this.input.isPressed('ArrowDown')) player.enqueueDirection('south')
      else if (this.input.isPressed('ArrowLeft')) player.enqueueDirection('west')
      else if (this.input.isPressed('ArrowRight')) player.enqueueDirection('east')
    }
    void map
  }

  private tryMove(player: Player, dir: Direction, map: GameMap): void {
    const { nx, ny } = this.getNeighborTile(player.tileX, player.tileY, dir)

    if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
      player.facing = dir
      return
    }

    // Warp tiles may sit on collision cells (doors/cave entrances) — allow movement
    const isWarpTile = map.warps.some(w => w.tileX === nx && w.tileY === ny)
    if (!isWarpTile) {
      const idx = ny * map.width + nx
      const collision = map.layers.collision[idx]
      if (collision) {
        player.facing = dir
        return
      }
    }

    // NPC collision
    if (this.npcSystem?.isCollision(nx, ny)) {
      player.facing = dir
      return
    }

    player.startMove(dir)
  }

  private getNeighborTile(x: number, y: number, dir: Direction): { nx: number; ny: number } {
    switch (dir) {
      case 'north': return { nx: x, ny: y - 1 }
      case 'south': return { nx: x, ny: y + 1 }
      case 'east':  return { nx: x + 1, ny: y }
      case 'west':  return { nx: x - 1, ny: y }
    }
  }

  private checkWarp(player: Player, map: GameMap): WarpDefinition | null {
    for (const warp of map.warps) {
      if (warp.tileX === player.tileX && warp.tileY === player.tileY) {
        return warp
      }
    }
    return null
  }

  private checkEncounter(
    player: Player,
    map: GameMap,
    _state: GameState
  ): EncounterTableEntry[] | null {
    if (!map.encounters && !(map as unknown as Record<string, unknown>)['encounterConfig']) {
      return null
    }

    const config = map.encounters ?? (map as unknown as Record<string, unknown>)['encounterConfig'] as typeof map.encounters
    if (!config || config.table.length === 0) return null

    const idx = player.tileY * map.width + player.tileX
    const terrainTile = map.layers.terrain[idx]

    if (terrainTile !== TALL_GRASS_TILE) return null
    if (this.encounterCooldown > 0) return null

    const roll = Math.random()
    if (roll < config.encounterRate / 255) {
      return config.table
    }
    return null
  }
}
