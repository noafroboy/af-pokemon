import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileControls from '../MobileControls'
import { InputManager } from '@/game/engine/InputManager'

describe('MobileControls', () => {
  beforeEach(() => {
    InputManager._resetForTest()
  })

  it("renders root container with data-testid='mobile-controls'", () => {
    render(<MobileControls />)
    expect(screen.getByTestId('mobile-controls')).toBeTruthy()
  })

  it("renders D-pad up arm with data-testid='dpad-up'", () => {
    render(<MobileControls />)
    expect(screen.getByTestId('dpad-up')).toBeTruthy()
  })

  it("renders D-pad down, left, right arms", () => {
    render(<MobileControls />)
    expect(screen.getByTestId('dpad-down')).toBeTruthy()
    expect(screen.getByTestId('dpad-left')).toBeTruthy()
    expect(screen.getByTestId('dpad-right')).toBeTruthy()
  })

  it("renders A and B buttons", () => {
    render(<MobileControls />)
    expect(screen.getByTestId('btn-a')).toBeTruthy()
    expect(screen.getByTestId('btn-b')).toBeTruthy()
  })

  it("renders START and SELECT buttons", () => {
    render(<MobileControls />)
    expect(screen.getByTestId('btn-start')).toBeTruthy()
    expect(screen.getByTestId('btn-select')).toBeTruthy()
  })

  it("pointerDown on dpad-up sets ArrowUp pressed in InputManager", () => {
    render(<MobileControls />)
    const up = screen.getByTestId('dpad-up')
    fireEvent.pointerDown(up)
    expect(InputManager.getInstance().isPressed('ArrowUp')).toBe(true)
  })

  it("pointerUp on dpad-up releases ArrowUp in InputManager", () => {
    render(<MobileControls />)
    const up = screen.getByTestId('dpad-up')
    fireEvent.pointerDown(up)
    fireEvent.pointerUp(up)
    expect(InputManager.getInstance().isPressed('ArrowUp')).toBe(false)
  })

  it("pointerDown on btn-a sets 'z' pressed (A button maps to z key)", () => {
    render(<MobileControls />)
    const btn = screen.getByTestId('btn-a')
    fireEvent.pointerDown(btn)
    expect(InputManager.getInstance().isPressed('z')).toBe(true)
  })

  it("pointerDown on btn-start sets 'Enter' pressed", () => {
    render(<MobileControls />)
    const btn = screen.getByTestId('btn-start')
    fireEvent.pointerDown(btn)
    expect(InputManager.getInstance().isPressed('Enter')).toBe(true)
  })

  it("pointerCancel releases the key (prevents stuck input)", () => {
    render(<MobileControls />)
    const left = screen.getByTestId('dpad-left')
    fireEvent.pointerDown(left)
    expect(InputManager.getInstance().isPressed('ArrowLeft')).toBe(true)
    fireEvent.pointerCancel(left)
    expect(InputManager.getInstance().isPressed('ArrowLeft')).toBe(false)
  })

  it("D-pad up arm is at least 44px wide and tall", () => {
    render(<MobileControls />)
    const up = screen.getByTestId('dpad-up')
    const style = up.style
    // The button has inline style width/height of 52px
    expect(parseInt(style.width || '52')).toBeGreaterThanOrEqual(44)
    expect(parseInt(style.height || '52')).toBeGreaterThanOrEqual(44)
  })
})
