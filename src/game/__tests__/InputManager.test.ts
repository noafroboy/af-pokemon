import { describe, it, expect, beforeEach } from 'vitest'
import { InputManager } from '../engine/InputManager'

describe('InputManager (instance)', () => {
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

describe('InputManager singleton', () => {
  beforeEach(() => {
    InputManager._resetForTest()
  })

  it('getInstance() returns the same instance on repeated calls', () => {
    const a = InputManager.getInstance()
    const b = InputManager.getInstance()
    expect(a).toBe(b)
  })

  it('_resetForTest() causes getInstance() to return a fresh instance', () => {
    const a = InputManager.getInstance()
    InputManager._resetForTest()
    const b = InputManager.getInstance()
    expect(a).not.toBe(b)
  })
})

describe('InputManager.registerTouchButton', () => {
  let input: InputManager

  beforeEach(() => {
    InputManager._resetForTest()
    input = InputManager.getInstance()
  })

  it("registerTouchButton('up', true) makes isPressed('ArrowUp') return true", () => {
    input.registerTouchButton('up', true)
    expect(input.isPressed('ArrowUp')).toBe(true)
  })

  it("registerTouchButton('down', true) makes isPressed('ArrowDown') return true", () => {
    input.registerTouchButton('down', true)
    expect(input.isPressed('ArrowDown')).toBe(true)
  })

  it("registerTouchButton('left', true) makes isPressed('ArrowLeft') return true", () => {
    input.registerTouchButton('left', true)
    expect(input.isPressed('ArrowLeft')).toBe(true)
  })

  it("registerTouchButton('right', true) makes isPressed('ArrowRight') return true", () => {
    input.registerTouchButton('right', true)
    expect(input.isPressed('ArrowRight')).toBe(true)
  })

  it("registerTouchButton('a', true) makes isPressed('z') return true", () => {
    input.registerTouchButton('a', true)
    expect(input.isPressed('z')).toBe(true)
  })

  it("registerTouchButton('b', true) makes isPressed('x') return true", () => {
    input.registerTouchButton('b', true)
    expect(input.isPressed('x')).toBe(true)
  })

  it("registerTouchButton('start', true) makes isPressed('Enter') return true", () => {
    input.registerTouchButton('start', true)
    expect(input.isPressed('Enter')).toBe(true)
  })

  it("registerTouchButton('select', true) makes isPressed('Escape') return true", () => {
    input.registerTouchButton('select', true)
    expect(input.isPressed('Escape')).toBe(true)
  })

  it("registerTouchButton('up', false) releases ArrowUp after pressing", () => {
    input.registerTouchButton('up', true)
    expect(input.isPressed('ArrowUp')).toBe(true)
    input.registerTouchButton('up', false)
    expect(input.isPressed('ArrowUp')).toBe(false)
  })

  it("pressing then releasing marks wasJustReleased correctly", () => {
    input.registerTouchButton('a', true)
    input.update()
    input.registerTouchButton('a', false)
    expect(input.wasJustReleased('z')).toBe(true)
  })
})
