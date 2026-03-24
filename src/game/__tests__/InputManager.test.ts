import { describe, it, expect, beforeEach } from 'vitest'
import { InputManager } from '../engine/InputManager'

describe('InputManager', () => {
  let input: InputManager

  beforeEach(() => {
    input = new InputManager()
  })

  it('starts with no keys pressed', () => {
    expect(input.isPressed('ArrowUp')).toBe(false)
    expect(input.wasJustPressed('z')).toBe(false)
  })

  it('simulateKeyDown marks key as pressed and justPressed', () => {
    input.simulateKeyDown('ArrowUp')
    expect(input.isPressed('ArrowUp')).toBe(true)
    expect(input.wasJustPressed('ArrowUp')).toBe(true)
  })

  it('update clears justPressed after one frame', () => {
    input.simulateKeyDown('ArrowLeft')
    expect(input.wasJustPressed('ArrowLeft')).toBe(true)
    input.update()
    expect(input.wasJustPressed('ArrowLeft')).toBe(false)
    expect(input.isPressed('ArrowLeft')).toBe(true)
  })

  it('simulateKeyUp marks key as released and not pressed', () => {
    input.simulateKeyDown('z')
    input.update()
    input.simulateKeyUp('z')
    expect(input.isPressed('z')).toBe(false)
    expect(input.wasJustReleased('z')).toBe(true)
  })

  it('heldFrames increments while key is held', () => {
    input.simulateKeyDown('ArrowDown')
    input.update()
    expect(input.getHeldFrames('ArrowDown')).toBe(1)
    input.update()
    expect(input.getHeldFrames('ArrowDown')).toBe(2)
  })

  it('heldFrames resets to 0 when key is released', () => {
    input.simulateKeyDown('Enter')
    input.update()
    input.update()
    expect(input.getHeldFrames('Enter')).toBe(2)
    input.simulateKeyUp('Enter')
    input.update()
    expect(input.getHeldFrames('Enter')).toBe(0)
  })

  it('wasJustReleased clears after update', () => {
    input.simulateKeyDown('x')
    input.update()
    input.simulateKeyUp('x')
    expect(input.wasJustReleased('x')).toBe(true)
    input.update()
    expect(input.wasJustReleased('x')).toBe(false)
  })
})
