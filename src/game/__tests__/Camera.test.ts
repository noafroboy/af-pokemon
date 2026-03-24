import { describe, it, expect, beforeEach } from 'vitest'
import { Camera, VIEWPORT_W, VIEWPORT_H, TILE_SIZE } from '../engine/Camera'

describe('Camera', () => {
  let camera: Camera

  beforeEach(() => {
    camera = new Camera(20, 20)
  })

  it('centers on player tile and clamps to 0 when player is near top-left', () => {
    camera.update(1, 1)
    expect(camera.x).toBe(0)
    expect(camera.y).toBe(0)
  })

  it('centers camera on player in middle of map', () => {
    // 20x20 map, player at (10, 9)
    // World center: (10*16 + 8, 9*16 + 8) = (168, 152)
    // Target cam: (168 - 80, 152 - 72) = (88, 80)
    camera.update(10, 9)
    expect(camera.x).toBe(88)
    expect(camera.y).toBe(80)
  })

  it('clamps camera to max bounds (map right/bottom edge)', () => {
    // 20x20 map = 320x320 px, viewport = 160x144
    // Max cam: (320-160, 320-144) = (160, 176)
    camera.update(19, 19)
    expect(camera.x).toBe(160)
    expect(camera.y).toBe(176)
  })

  it('worldToScreen converts world coords to screen coords correctly', () => {
    camera.x = 32
    camera.y = 16
    const screen = camera.worldToScreen(64, 48)
    expect(screen.x).toBe(32)
    expect(screen.y).toBe(32)
  })

  it('isVisible returns false for tiles outside viewport', () => {
    camera.x = 100
    camera.y = 100
    expect(camera.isVisible(0, 0, TILE_SIZE, TILE_SIZE)).toBe(false)
  })

  it('isVisible returns true for tiles within viewport', () => {
    camera.x = 0
    camera.y = 0
    expect(camera.isVisible(80, 72, TILE_SIZE, TILE_SIZE)).toBe(true)
  })

  it('getVisibleTileRange returns correct range', () => {
    camera.x = 0
    camera.y = 0
    const range = camera.getVisibleTileRange()
    expect(range.startX).toBe(0)
    expect(range.startY).toBe(0)
    expect(range.endX).toBe(Math.ceil((VIEWPORT_W) / TILE_SIZE))
    expect(range.endY).toBe(Math.ceil((VIEWPORT_H) / TILE_SIZE))
  })
})
