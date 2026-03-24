import type { Direction } from './Player'
import type { GameMap, TrainerPartyEntry } from '../types/MapTypes'

const LOS_RANGE_DEFAULT = 3

export class NPC {
  id: string
  tileX: number
  tileY: number
  facing: Direction
  spriteId: number
  dialogPages: string[][]
  movementType: 'static' | 'wander' | 'patrol'
  defeated = false

  constructor(
    id: string,
    tileX: number,
    tileY: number,
    facing: Direction,
    spriteId: number,
    dialogPages: string[][],
    movementType: 'static' | 'wander' | 'patrol' = 'static'
  ) {
    this.id = id
    this.tileX = tileX
    this.tileY = tileY
    this.facing = facing
    this.spriteId = spriteId
    this.dialogPages = dialogPages
    this.movementType = movementType
  }

  update(_dt: number): void {
    // Static NPCs don't move; wander/patrol can be extended later
  }
}

export type ApproachPhase = 'IDLE' | 'EXCLAIM' | 'WALK' | 'DONE'

export class TrainerNPC extends NPC {
  party: TrainerPartyEntry[]
  moneyReward: number
  trainerId: string
  losRange: number
  preBattleDialog: string[]
  postBattleDialog: string[]
  badgeReward: string | null
  approachPhase: ApproachPhase = 'IDLE'
  exclaimFrames = 0
  private walkTarget: { x: number; y: number } | null = null
  private walkAccum = 0
  private static readonly WALK_SPEED = 200 // ms per tile

  constructor(
    id: string,
    tileX: number,
    tileY: number,
    facing: Direction,
    spriteId: number,
    dialogPages: string[][],
    trainerId: string,
    party: TrainerPartyEntry[],
    moneyReward = 100,
    losRange = LOS_RANGE_DEFAULT,
    preBattleDialog: string[] = [],
    postBattleDialog: string[] = [],
    badgeReward: string | null = null
  ) {
    super(id, tileX, tileY, facing, spriteId, dialogPages)
    this.trainerId = trainerId
    this.party = party
    this.moneyReward = moneyReward
    this.losRange = losRange
    this.preBattleDialog = preBattleDialog
    this.postBattleDialog = postBattleDialog
    this.badgeReward = badgeReward
  }

  checkLOS(playerX: number, playerY: number, _map: GameMap): boolean {
    if (this.defeated || this.approachPhase !== 'IDLE') return false
    const dx = playerX - this.tileX
    const dy = playerY - this.tileY
    const dist = Math.abs(dx) + Math.abs(dy)
    if (dist === 0 || dist > this.losRange) return false

    switch (this.facing) {
      case 'north': return dx === 0 && dy < 0
      case 'south': return dx === 0 && dy > 0
      case 'east':  return dy === 0 && dx > 0
      case 'west':  return dy === 0 && dx < 0
    }
  }

  startApproach(playerX: number, playerY: number): void {
    this.approachPhase = 'EXCLAIM'
    this.exclaimFrames = 60
    this.walkTarget = { x: playerX, y: playerY }
  }

  override update(dt: number): void {
    if (this.approachPhase === 'EXCLAIM') {
      this.exclaimFrames -= dt
      if (this.exclaimFrames <= 0) {
        this.approachPhase = 'WALK'
        this.walkAccum = 0
      }
    } else if (this.approachPhase === 'WALK' && this.walkTarget) {
      this.walkAccum += dt
      if (this.walkAccum >= TrainerNPC.WALK_SPEED) {
        this.walkAccum -= TrainerNPC.WALK_SPEED
        this.stepTowardTarget()
      }
    }
  }

  private stepTowardTarget(): void {
    if (!this.walkTarget) return
    const dx = this.walkTarget.x - this.tileX
    const dy = this.walkTarget.y - this.tileY
    // Stop one tile in front of player
    const dist = Math.abs(dx) + Math.abs(dy)
    if (dist <= 1) {
      this.approachPhase = 'DONE'
      return
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      this.tileX += dx > 0 ? 1 : -1
      this.facing = dx > 0 ? 'east' : 'west'
    } else {
      this.tileY += dy > 0 ? 1 : -1
      this.facing = dy > 0 ? 'south' : 'north'
    }
  }
}
