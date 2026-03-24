export type Direction = 'north' | 'south' | 'east' | 'west'

export interface PlayerState {
  tileX: number
  tileY: number
  facing: Direction
  walkFrame: number
  pixelOffset: number
  moveQueue: Direction[]
  stepCount: number
  name: string
}

export class Player {
  tileX: number
  tileY: number
  facing: Direction
  walkFrame: number
  pixelOffset: number
  moveQueue: Direction[]
  stepCount: number
  name: string

  private static readonly MAX_QUEUE_DEPTH = 2

  constructor(tileX = 10, tileY = 10, name = 'RED') {
    this.tileX = tileX
    this.tileY = tileY
    this.facing = 'south'
    this.walkFrame = 0
    this.pixelOffset = 0
    this.moveQueue = []
    this.stepCount = 0
    this.name = name
  }

  enqueueDirection(dir: Direction): void {
    if (this.moveQueue.length < Player.MAX_QUEUE_DEPTH) {
      this.moveQueue.push(dir)
    }
  }

  isMoving(): boolean {
    return this.pixelOffset > 0
  }

  startMove(dir: Direction): void {
    this.facing = dir
    this.pixelOffset = 16

    switch (dir) {
      case 'north': this.tileY -= 1; break
      case 'south': this.tileY += 1; break
      case 'east':  this.tileX += 1; break
      case 'west':  this.tileX -= 1; break
    }
  }

  updateMovement(): void {
    if (this.pixelOffset > 0) {
      this.pixelOffset -= 8
      if (this.pixelOffset === 0) {
        this.stepCount++
        // Advance walk animation every 2 steps
        this.walkFrame = (this.walkFrame + 1) % 3
      }
    }
  }

  getScreenOffset(): { dx: number; dy: number } {
    switch (this.facing) {
      case 'north': return { dx: 0, dy: this.pixelOffset }
      case 'south': return { dx: 0, dy: -this.pixelOffset }
      case 'east':  return { dx: -this.pixelOffset, dy: 0 }
      case 'west':  return { dx: this.pixelOffset, dy: 0 }
    }
  }

  serialize(): PlayerState {
    return {
      tileX: this.tileX,
      tileY: this.tileY,
      facing: this.facing,
      walkFrame: this.walkFrame,
      pixelOffset: this.pixelOffset,
      moveQueue: [...this.moveQueue],
      stepCount: this.stepCount,
      name: this.name,
    }
  }

  static deserialize(state: PlayerState): Player {
    const p = new Player(state.tileX, state.tileY, state.name)
    p.facing = state.facing
    p.walkFrame = state.walkFrame
    p.pixelOffset = state.pixelOffset
    p.moveQueue = [...state.moveQueue]
    p.stepCount = state.stepCount
    return p
  }
}
