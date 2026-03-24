export type GameKey =
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  | 'z' | 'x' | 'Enter' | 'Escape'

export type TouchButtonId =
  | 'up' | 'down' | 'left' | 'right'
  | 'a' | 'b' | 'start' | 'select'

const TOUCH_TO_KEY: Record<TouchButtonId, GameKey> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'z',
  b: 'x',
  start: 'Enter',
  select: 'Escape',
}

const ALLOWED_KEYS = new Set<string>([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'z', 'Z', 'x', 'X', 'Enter', 'Escape',
])

interface KeyState {
  pressed: boolean
  justPressed: boolean
  justReleased: boolean
  heldFrames: number
}

function normalizeKey(key: string): GameKey | null {
  if (key === 'Z' || key === 'z') return 'z'
  if (key === 'X' || key === 'x') return 'x'
  if (ALLOWED_KEYS.has(key)) return key as GameKey
  return null
}

export class InputManager {
  private static _instance: InputManager | null = null

  static getInstance(): InputManager {
    if (!InputManager._instance) {
      InputManager._instance = new InputManager()
    }
    return InputManager._instance
  }

  /** Only for use in tests — resets the singleton so each test gets a clean state */
  static _resetForTest(): void {
    InputManager._instance = null
  }

  private states: Map<GameKey, KeyState> = new Map()
  private boundKeyDown: (e: KeyboardEvent) => void
  private boundKeyUp: (e: KeyboardEvent) => void
  private onFirstGestureCb: (() => void) | null = null
  private firstGestureFired = false

  constructor() {
    this.boundKeyDown = this.onKeyDown.bind(this)
    this.boundKeyUp = this.onKeyUp.bind(this)
  }

  setFirstGestureCallback(cb: () => void): void {
    this.onFirstGestureCb = cb
  }

  private getOrCreate(key: GameKey): KeyState {
    if (!this.states.has(key)) {
      this.states.set(key, { pressed: false, justPressed: false, justReleased: false, heldFrames: 0 })
    }
    return this.states.get(key)!
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = normalizeKey(e.key)
    if (!key) return
    e.preventDefault()
    const state = this.getOrCreate(key)
    if (!state.pressed) {
      state.justPressed = true
    }
    state.pressed = true
    if (!this.firstGestureFired && this.onFirstGestureCb) {
      this.firstGestureFired = true
      this.onFirstGestureCb()
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = normalizeKey(e.key)
    if (!key) return
    const state = this.getOrCreate(key)
    state.pressed = false
    state.justReleased = true
  }

  attach(target: Window | HTMLElement = window): void {
    target.addEventListener('keydown', this.boundKeyDown as EventListener)
    target.addEventListener('keyup', this.boundKeyUp as EventListener)
  }

  detach(target: Window | HTMLElement = window): void {
    target.removeEventListener('keydown', this.boundKeyDown as EventListener)
    target.removeEventListener('keyup', this.boundKeyUp as EventListener)
  }

  /** Maps a virtual touch button to a game key press or release */
  registerTouchButton(buttonId: TouchButtonId, pressed: boolean): void {
    const key = TOUCH_TO_KEY[buttonId]
    if (pressed) {
      this.simulateKeyDown(key)
      if (!this.firstGestureFired && this.onFirstGestureCb) {
        this.firstGestureFired = true
        this.onFirstGestureCb()
      }
    } else {
      this.simulateKeyUp(key)
    }
  }

  simulateKeyDown(key: GameKey): void {
    const state = this.getOrCreate(key)
    if (!state.pressed) {
      state.justPressed = true
    }
    state.pressed = true
  }

  simulateKeyUp(key: GameKey): void {
    const state = this.getOrCreate(key)
    state.pressed = false
    state.justReleased = true
  }

  isPressed(key: GameKey): boolean {
    return this.states.get(key)?.pressed ?? false
  }

  wasJustPressed(key: GameKey): boolean {
    return this.states.get(key)?.justPressed ?? false
  }

  wasJustReleased(key: GameKey): boolean {
    return this.states.get(key)?.justReleased ?? false
  }

  getHeldFrames(key: GameKey): number {
    return this.states.get(key)?.heldFrames ?? 0
  }

  // Call once per frame AFTER processing inputs
  update(): void {
    for (const state of this.states.values()) {
      if (state.pressed) {
        state.heldFrames++
      } else {
        state.heldFrames = 0
      }
      state.justPressed = false
      state.justReleased = false
    }
  }
}
