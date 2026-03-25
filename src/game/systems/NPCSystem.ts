import { NPC, TrainerNPC } from '../entities/NPC'
import type { Player } from '../entities/Player'
import type { GameMap } from '../types/MapTypes'
import type { GameState } from '../types/GameState'

export type NPCInteractionResult =
  | { type: 'NONE' }
  | { type: 'DIALOG'; npcId: string; pages: string[][] }
  | { type: 'TRAINER_BATTLE'; npcId: string; npc: TrainerNPC }
  | { type: 'SCRIPT'; scriptId: string }

export class NPCSystem {
  private npcs: NPC[] = []
  private defeatedIds: Set<string> = new Set()

  loadFromMap(map: GameMap, state: GameState): void {
    this.npcs = []
    const flagPrefix = `trainer_defeated_`
    for (const def of map.npcs) {
      const wasDefeated = !!state.flags[`${flagPrefix}${def.id}`]
      const activationFlagActive = !def.activationFlag || !!state.flags[def.activationFlag]
      if (def.isTrainer && def.party && def.trainerId !== undefined) {
        const t = new TrainerNPC(
          def.id,
          def.tileX,
          def.tileY,
          def.facing,
          def.spriteId,
          def.dialog.map(line => [line]),
          def.trainerId,
          def.party,
          def.moneyBase ?? 100,
          def.losRange ?? 3,
          def.preBattleDialog ?? [],
          def.postBattleDialog ?? [],
          def.badgeReward ?? null
        )
        t.defeated = wasDefeated || !activationFlagActive
        if (t.defeated) this.defeatedIds.add(def.id)
        this.npcs.push(t)
      } else {
        const npc = new NPC(
          def.id,
          def.tileX,
          def.tileY,
          def.facing,
          def.spriteId,
          def.dialog.map(line => [line])
        )
        npc.defeated = wasDefeated
        this.npcs.push(npc)
      }
    }
  }

  getNPCs(): NPC[] {
    return this.npcs
  }

  update(dt: number, player: Player, _map: GameMap): TrainerNPC | null {
    for (const npc of this.npcs) {
      npc.update(dt)
      if (npc instanceof TrainerNPC) {
        if (npc.approachPhase === 'IDLE' && !npc.defeated) {
          if (npc.checkLOS(player.tileX, player.tileY, _map)) {
            npc.startApproach(player.tileX, player.tileY)
          }
        }
        if (npc.approachPhase === 'DONE') {
          npc.approachPhase = 'IDLE'
          return npc
        }
      }
    }
    return null
  }

  handleInteraction(player: Player): NPCInteractionResult {
    const { nx, ny } = this.getFacingTile(player)
    for (const npc of this.npcs) {
      if (npc.tileX === nx && npc.tileY === ny) {
        if (npc instanceof TrainerNPC && !npc.defeated) {
          return { type: 'TRAINER_BATTLE', npcId: npc.id, npc }
        }
        const pages = npc.defeated && npc instanceof TrainerNPC
          ? npc.postBattleDialog.map(l => [l])
          : npc.dialogPages
        return { type: 'DIALOG', npcId: npc.id, pages }
      }
    }
    return { type: 'NONE' }
  }

  checkScriptZones(player: Player, map: GameMap): string | null {
    for (const zone of map.scriptZones) {
      if (
        player.tileX >= zone.tileX &&
        player.tileX < zone.tileX + zone.width &&
        player.tileY >= zone.tileY &&
        player.tileY < zone.tileY + zone.height
      ) {
        return zone.scriptId
      }
    }
    return null
  }

  isCollision(tileX: number, tileY: number): boolean {
    for (const npc of this.npcs) {
      if (!npc.defeated && npc.tileX === tileX && npc.tileY === tileY) return true
    }
    return false
  }

  markDefeated(npcId: string, state: GameState): void {
    const npc = this.npcs.find(n => n.id === npcId)
    if (npc) {
      npc.defeated = true
      this.defeatedIds.add(npcId)
    }
    state.flags[`trainer_defeated_${npcId}`] = true
  }

  private getFacingTile(player: Player): { nx: number; ny: number } {
    switch (player.facing) {
      case 'north': return { nx: player.tileX, ny: player.tileY - 1 }
      case 'south': return { nx: player.tileX, ny: player.tileY + 1 }
      case 'east':  return { nx: player.tileX + 1, ny: player.tileY }
      case 'west':  return { nx: player.tileX - 1, ny: player.tileY }
    }
  }
}
