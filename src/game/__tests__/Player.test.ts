import { describe, it, expect, beforeEach } from 'vitest'
import { Player } from '../entities/Player'

describe('Player', () => {
  let player: Player

  beforeEach(() => {
    player = new Player(10, 10, 'RED')
  })

  it('initializes with correct defaults', () => {
    expect(player.tileX).toBe(10)
    expect(player.tileY).toBe(10)
    expect(player.facing).toBe('south')
    expect(player.walkFrame).toBe(0)
    expect(player.pixelOffset).toBe(0)
    expect(player.moveQueue).toHaveLength(0)
    expect(player.stepCount).toBe(0)
  })

  it('enqueues directions up to MAX_QUEUE_DEPTH (2)', () => {
    player.enqueueDirection('north')
    player.enqueueDirection('south')
    player.enqueueDirection('east') // should be dropped
    expect(player.moveQueue).toHaveLength(2)
    expect(player.moveQueue[0]).toBe('north')
    expect(player.moveQueue[1]).toBe('south')
  })

  it('isMoving returns true when pixelOffset > 0', () => {
    expect(player.isMoving()).toBe(false)
    player.pixelOffset = 8
    expect(player.isMoving()).toBe(true)
  })

  it('startMove updates tileY and facing for north direction', () => {
    player.startMove('north')
    expect(player.facing).toBe('north')
    expect(player.tileY).toBe(9)
    expect(player.pixelOffset).toBe(16)
  })

  it('startMove updates tileX and facing for east direction', () => {
    player.startMove('east')
    expect(player.facing).toBe('east')
    expect(player.tileX).toBe(11)
    expect(player.pixelOffset).toBe(16)
  })

  it('updateMovement decrements pixelOffset by 8 and increments stepCount on landing', () => {
    player.startMove('south')
    expect(player.pixelOffset).toBe(16)
    player.updateMovement()
    expect(player.pixelOffset).toBe(8)
    expect(player.stepCount).toBe(0)
    player.updateMovement()
    expect(player.pixelOffset).toBe(0)
    expect(player.stepCount).toBe(1)
  })

  it('getScreenOffset returns correct pixel offset for south direction', () => {
    player.facing = 'south'
    player.pixelOffset = 8
    const offset = player.getScreenOffset()
    expect(offset.dx).toBe(0)
    expect(offset.dy).toBe(-8)
  })

  it('serialize and deserialize round-trips player state', () => {
    player.startMove('north')
    player.updateMovement()
    const state = player.serialize()
    const restored = Player.deserialize(state)

    expect(restored.tileX).toBe(player.tileX)
    expect(restored.tileY).toBe(player.tileY)
    expect(restored.facing).toBe(player.facing)
    expect(restored.pixelOffset).toBe(player.pixelOffset)
    expect(restored.stepCount).toBe(player.stepCount)
  })
})
