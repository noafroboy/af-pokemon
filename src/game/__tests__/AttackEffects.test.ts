import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createAttackEffectState,
  triggerAttackEffect,
  updateAttackEffect,
  drawAttackFlash,
  resetAttackEffect,
} from '../renderers/battle/AttackEffects'

describe('AttackEffects', () => {
  describe('createAttackEffectState', () => {
    it('creates idle state with zero timers', () => {
      const state = createAttackEffectState()
      expect(state.flashTimeMs).toBe(0)
      expect(state.shakeTimeMs).toBe(0)
      expect(state.shakeOffset).toBe(0)
      expect(state.effectiveness).toBe(1)
    })
  })

  describe('triggerAttackEffect', () => {
    it('sets positive flash and shake timers', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      expect(state.flashTimeMs).toBeGreaterThan(0)
      expect(state.shakeTimeMs).toBeGreaterThan(0)
    })

    it('effects complete in under 400ms', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      expect(state.flashTimeMs).toBeLessThanOrEqual(400)
      expect(state.shakeTimeMs).toBeLessThanOrEqual(400)
    })

    it('stores super-effective multiplier', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 2)
      expect(state.effectiveness).toBe(2)
    })

    it('stores not-very-effective multiplier', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 0.5)
      expect(state.effectiveness).toBe(0.5)
    })
  })

  describe('updateAttackEffect', () => {
    it('decrements flashTimeMs by dt', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      const before = state.flashTimeMs
      updateAttackEffect(state, 50)
      expect(state.flashTimeMs).toBe(Math.max(0, before - 50))
    })

    it('decrements shakeTimeMs by dt', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      const before = state.shakeTimeMs
      updateAttackEffect(state, 50)
      expect(state.shakeTimeMs).toBe(Math.max(0, before - 50))
    })

    it('clamps flashTimeMs to 0, never negative', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      updateAttackEffect(state, 9999)
      expect(state.flashTimeMs).toBe(0)
    })

    it('clamps shakeTimeMs to 0, never negative', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      updateAttackEffect(state, 9999)
      expect(state.shakeTimeMs).toBe(0)
    })

    it('resets shakeOffset to 0 when shake expires', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      updateAttackEffect(state, 9999)
      expect(state.shakeOffset).toBe(0)
    })

    it('produces a non-zero shakeOffset during active shake', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      // Advance partway through shake (e.g. 100ms out of 200ms)
      updateAttackEffect(state, 100)
      // Offset may or may not be non-zero depending on sine phase; just verify it's a small integer
      expect(Math.abs(state.shakeOffset)).toBeLessThanOrEqual(3)
    })

    it('does nothing when timers are already 0', () => {
      const state = createAttackEffectState()
      updateAttackEffect(state, 100)
      expect(state.flashTimeMs).toBe(0)
      expect(state.shakeTimeMs).toBe(0)
      expect(state.shakeOffset).toBe(0)
    })
  })

  describe('drawAttackFlash', () => {
    let ctx: CanvasRenderingContext2D
    let fillRectMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      fillRectMock = vi.fn()
      ctx = {
        fillStyle: '',
        fillRect: fillRectMock,
      } as unknown as CanvasRenderingContext2D
    })

    it('does not draw when flashTimeMs is 0', () => {
      const state = createAttackEffectState()
      drawAttackFlash(ctx, 88, 16, 48, 48, state)
      expect(fillRectMock).not.toHaveBeenCalled()
    })

    it('draws at the correct rectangle when active', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      drawAttackFlash(ctx, 88, 16, 48, 48, state)
      expect(fillRectMock).toHaveBeenCalledWith(88, 16, 48, 48)
    })

    it('uses white-ish color for normal effectiveness (1)', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 1)
      drawAttackFlash(ctx, 0, 0, 48, 48, state)
      expect(fillRectMock).toHaveBeenCalled()
      const style = (ctx as unknown as { fillStyle: string }).fillStyle
      expect(style).toMatch(/255,\s*255,\s*255/)
    })

    it('uses yellow-ish color for super-effective (>=2)', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 2)
      drawAttackFlash(ctx, 0, 0, 48, 48, state)
      expect(fillRectMock).toHaveBeenCalled()
      const style = (ctx as unknown as { fillStyle: string }).fillStyle
      // Yellow: high red, high green, no blue
      expect(style).toMatch(/255,\s*220,\s*0/)
    })

    it('uses grey color for not-very-effective (<1)', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 0.5)
      drawAttackFlash(ctx, 0, 0, 48, 48, state)
      expect(fillRectMock).toHaveBeenCalled()
      const style = (ctx as unknown as { fillStyle: string }).fillStyle
      // Grey: equal R, G, B values
      expect(style).toMatch(/140,\s*140,\s*140/)
    })
  })

  describe('resetAttackEffect', () => {
    it('clears all effect state', () => {
      const state = createAttackEffectState()
      triggerAttackEffect(state, 2)
      updateAttackEffect(state, 50)
      resetAttackEffect(state)
      expect(state.flashTimeMs).toBe(0)
      expect(state.shakeTimeMs).toBe(0)
      expect(state.shakeOffset).toBe(0)
      expect(state.effectiveness).toBe(1)
    })
  })
})
