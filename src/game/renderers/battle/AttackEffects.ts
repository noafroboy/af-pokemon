/** Visual attack effect state and rendering helpers for battle sprites */

export interface AttackEffectState {
  flashTimeMs: number    // Remaining flash display time in ms (shows color overlay)
  shakeTimeMs: number    // Remaining shake animation time in ms
  effectiveness: number  // Damage multiplier: <1 = not very, 1 = normal, >=2 = super
  shakeOffset: number    // Current horizontal pixel offset for sprite shake
}

export function createAttackEffectState(): AttackEffectState {
  return { flashTimeMs: 0, shakeTimeMs: 0, effectiveness: 1, shakeOffset: 0 }
}

/** Trigger a hit flash + shake effect with the given effectiveness multiplier */
export function triggerAttackEffect(state: AttackEffectState, effectiveness: number): void {
  state.flashTimeMs = 150
  state.shakeTimeMs = 200
  state.effectiveness = effectiveness
}

/** Advance effect timers by dt milliseconds and update shakeOffset */
export function updateAttackEffect(state: AttackEffectState, dt: number): void {
  if (state.flashTimeMs > 0) {
    state.flashTimeMs = Math.max(0, state.flashTimeMs - dt)
  }
  if (state.shakeTimeMs > 0) {
    state.shakeTimeMs = Math.max(0, state.shakeTimeMs - dt)
    const elapsed = 200 - state.shakeTimeMs
    const t = elapsed / 200
    state.shakeOffset = Math.round(Math.sin(t * Math.PI * 5) * 3 * (1 - t))
  } else {
    state.shakeOffset = 0
  }
}

/**
 * Draw a colored flash overlay over the sprite rectangle.
 * - White  (rgba 255,255,255): normal damage
 * - Yellow (rgba 255,220,0):   super-effective
 * - Grey   (rgba 140,140,140): not-very-effective
 */
export function drawAttackFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  state: AttackEffectState
): void {
  if (state.flashTimeMs <= 0) return
  if (state.effectiveness >= 2) {
    ctx.fillStyle = 'rgba(255, 220, 0, 0.65)'
  } else if (state.effectiveness < 1) {
    ctx.fillStyle = 'rgba(140, 140, 140, 0.55)'
  } else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.70)'
  }
  ctx.fillRect(x, y, w, h)
}

/** Reset effect state — call when starting a new battle */
export function resetAttackEffect(state: AttackEffectState): void {
  state.flashTimeMs = 0
  state.shakeTimeMs = 0
  state.effectiveness = 1
  state.shakeOffset = 0
}
