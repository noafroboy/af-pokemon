# Task 207: Mobile Controls + Responsive Layout — Plan

## Assumption Audit

### Explicit assumptions made about unclear requirements:

1. **`registerTouchButton` migration**: The task says `InputManager.registerTouchButton` "must be implemented in Task 0 stub." The current `InputManager.ts` has a `registerTouchButton(elementId: string, key: GameKey): void` that only stores a mapping (never reads it). This is the stub. We replace its signature entirely with `registerTouchButton(buttonId: TouchButtonId, pressed: boolean): void` which directly maps to `simulateKeyDown/simulateKeyUp`. The existing method is effectively dead code.

2. **Settings persistence**: The task says "Settings are persisted via SaveSystem." There is no `settings` field in either `engine/SaveSystem.ts` or `systems/SaveSystem.ts`. We store settings in a dedicated localStorage key `pokebrowser_settings` rather than modifying SaveSystem. This is the simplest compliant approach and survives page refresh.

3. **Real-time volume changes**: Settings modal changes volume sliders. `AudioManager` (`AudioManager.getInstance()`) is the target. We will call `AudioManager.getInstance().setMusicVolume()` and `setSFXVolume()` if those methods exist; otherwise, changes take effect on next page load. This is checked at implementation time.

4. **"Renders only when viewport width <= 768px"**: We use both CSS (`md:hidden` Tailwind class for display:none at ≥768px) AND a `useEffect` to detect mobile via `window.innerWidth` for conditional rendering. This prevents pointer events from firing on desktop even if CSS visibility is bypassed.

5. **SettingsModal's `onSettingChange` callback**: The task says "GameEngine reads" this. For this task, we persist to localStorage; the GameEngine picks up values on next start. Real-time propagation to GameEngine requires hooking into AudioManager which can be done without engine changes.

6. **Scale setting applies to desktop only**: Mobile uses 100vw fill; the scale buttons (2×/3×/4×) in SettingsModal are labelled "desktop only" and have no effect on mobile layout.

7. **"No vertical scroll needed" at 375px**: The layout is `h-screen overflow-hidden`. The game canvas area takes `flex-1` (remaining height above controls). This requires the canvas CSS height to be computed. We use `height: calc(100vh - 120px)` for the canvas wrapper on mobile.

8. **`useStorageWarning` color**: Task says "yellow bar." Current implementation uses red (`bg-[#c44]`). We update to yellow (`bg-yellow-500`).

### Risks & Open Questions

- **AudioManager volume API**: Does `AudioManager` expose `setMusicVolume(n: number)` / `setSFXVolume(n: number)`? Not confirmed from read. Risk: low (settings still persist; just no real-time audio change).
- **Singleton test isolation**: Tests that call `new InputManager()` create non-singleton instances. `getInstance()` tests must reset the static instance in `beforeEach`.
- **Touch events on iOS Safari**: `pointer` events are supported on modern iOS Safari (13+). No polyfill needed.

---

## Approach Alternatives

### APPROACH A — Conservative (CHOSEN)
- **What**: Minimal changes to existing code. Keep `simulateKeyDown/simulateKeyUp` intact (tests depend on them). Add `registerTouchButton` as a thin wrapper over them. Add `getInstance()` as a pure singleton. Rebuild `MobileControls.tsx` in-place. Create `SettingsModal.tsx` + `useSettings.ts`. Update `page.tsx` layout and `layout.tsx` meta tag.
- **Effort**: M
- **Risk**: Low
- **Trade-off**: Does not introduce architecture changes; the singleton pattern for InputManager is the only new abstraction.

### APPROACH B — Ideal
- **What**: Introduce a separate `TouchInputState` class, extract `useInputManager()` React hook, and build a full settings context with React Context API for global settings propagation.
- **Effort**: L
- **Risk**: Medium (higher abstraction risk, touches more files)
- **Trade-off**: Cleaner long-term architecture but significantly more scope than this task requires; settings context especially would cut across components not in this task's scope.

## Approach Decision

**Chosen: Approach A — Conservative.**

Rationale: The task is self-contained UI work (controls + layout + settings modal). The "singleton" for InputManager is the only cross-cutting concern and can be implemented with a static class field. A React Context for settings is unnecessary when only `page.tsx` and `SettingsModal.tsx` need to share settings state via useState + localStorage.

---

## Production-Readiness Checklist

### 1. Persistence
Settings stored in localStorage under `pokebrowser_settings` as JSON. Survives page refresh. `useSettings()` hook initializes state from localStorage (lazy `useState` initializer). On every `updateSetting()` call, the new value is serialized and written. Game saves are unchanged.

### 2. Error Handling
- `useSettings()` wraps `localStorage.getItem` + `JSON.parse` in try/catch, returns defaults on failure.
- `updateSetting()` wraps `localStorage.setItem` in try/catch; silent failure (non-critical).
- `onPointerCancel` handler fires `registerTouchButton(key, false)` to prevent stuck keys.
- No async operations in this task (no API calls, no file loading).

### 3. Input Validation
- Settings values validated in `updateSetting()`: `scale` must be 2/3/4; `textSpeed` must be `slow/normal/fast`; volume must be 0–100.
- No server-side concerns (pure client-side feature).

### 4. Loading States
- No async operations introduced. `GameCanvas` already handles its own loading spinner.
- N/A for this feature.

### 5. Empty States
- If localStorage is unavailable, `useSettings()` returns defaults silently. No empty state UI needed.
- SettingsModal always has values (defaults guaranteed).

### 6. Security
- No API keys introduced.
- No server-side changes.
- `e.preventDefault()` on pointer events prevents scroll hijacking.
- `user-scalable=no` in viewport meta prevents pinch-zoom.

### 7. Component Size
Planned sizes (all under 150 lines):
- `MobileControls.tsx`: ~145 lines (D-pad + A/B/START/SELECT + event handlers)
- `SettingsModal.tsx`: ~125 lines (modal structure + 4 settings sections)
- `useSettings.ts`: ~40 lines
- `app/page.tsx` (updated): ~75 lines
- `src/game/engine/InputManager.ts` (updated): ~145 lines

If `MobileControls.tsx` approaches 150 lines, `DPad` and `ActionButtons` are extracted as sub-components in the same file.

### 8. Test Coverage
New tests planned:
- `InputManager.test.ts` additions: `getInstance()` singleton, `registerTouchButton` for each direction and action button, touch release.
- `MobileControls.test.tsx`: render checks, data-testids present, pointer events call InputManager.
- `SettingsModal.test.tsx`: open/close, Escape key, setting change callback, localStorage write.

---

## Detailed Implementation Steps

### Step 1 — InputManager.ts (update)
**Changes**:
```typescript
export type TouchButtonId = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select'

const TOUCH_KEY_MAP: Record<TouchButtonId, GameKey> = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  a: 'z', b: 'x', start: 'Enter', select: 'Escape',
}

export class InputManager {
  private static instance: InputManager | null = null

  static getInstance(): InputManager {
    if (!InputManager.instance) InputManager.instance = new InputManager()
    return InputManager.instance
  }

  // REPLACES old registerTouchButton(elementId, key) stub
  registerTouchButton(buttonId: TouchButtonId, pressed: boolean): void {
    const key = TOUCH_KEY_MAP[buttonId]
    if (!key) return
    if (pressed) this.simulateKeyDown(key)
    else this.simulateKeyUp(key)
  }
  // ... existing simulateKeyDown/Up, states, keyboard handlers unchanged
}
```
**Test impact**: Existing tests use `new InputManager()` — unaffected. New tests added for `getInstance()` and `registerTouchButton`.

**GameEngine.ts change** (one line): `this.input = InputManager.getInstance()`

---

### Step 2 — useSettings.ts (create)
```typescript
// src/hooks/useSettings.ts
const SETTINGS_KEY = 'pokebrowser_settings'

export interface GameSettings {
  textSpeed: 'slow' | 'normal' | 'fast'
  musicVolume: number  // 0-100
  sfxVolume: number    // 0-100
  scale: 2 | 3 | 4
}

function readSettings(): GameSettings { /* try/catch localStorage read */ }
function writeSettings(s: GameSettings): void { /* try/catch localStorage write */ }

export function useSettings() {
  const [settings, setSettings] = useState<GameSettings>(() => readSettings())
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    writeSettings(next)
  }
  return { settings, updateSetting }
}
```

---

### Step 3 — SettingsModal.tsx (create)
Props: `{ isOpen: boolean; onClose: () => void; settings: GameSettings; onSettingChange: (key, value) => void }`

Structure:
- Fixed overlay with `z-[100]` backdrop click closes
- Centered white panel with dark game-themed styling
- Text Speed section: 3 buttons, active one highlighted
- Music Volume: `<input type="range">` 0-100
- SFX Volume: `<input type="range">` 0-100
- Scale section: 3 buttons (hidden on mobile via `hidden md:flex`)
- Close button top-right
- `useEffect` attaches Escape keydown listener
- `data-testid="settings-modal"` on root panel

---

### Step 4 — MobileControls.tsx (rewrite)
Structure:
```
div[data-testid="mobile-controls"] (fixed bottom-0 flex justify-between hidden md:hidden ← uses block below 768)
  ├── D-pad cross div (110×110px)
  │   ├── div (52×52) [data-testid="dpad-up"]
  │   ├── div (52×52) [data-testid="dpad-left"]
  │   ├── div (52×52) [data-testid="dpad-right"]
  │   └── div (52×52) [data-testid="dpad-down"]
  ├── CENTER row: SELECT + START (bottom-center)
  │   ├── div (50×24) [data-testid="btn-select"]
  │   └── div (60×24) [data-testid="btn-start"]
  └── A+B buttons group (bottom-right)
      ├── div circle 60×60 [data-testid="btn-a"]
      └── div circle 50×50 [data-testid="btn-b"]
```

All interaction buttons:
- `onPointerDown={(e) => { e.preventDefault(); handlePress(btnId); setActive(btnId) }}`
- `onPointerUp={() => { handleRelease(btnId); setActive(null) }}`
- `onPointerCancel={() => { handleRelease(btnId); setActive(null) }}`
- `onPointerLeave={() => { handleRelease(btnId); setActive(null) }}` (for desktop drag off)

`handlePress/handleRelease` call `InputManager.getInstance().registerTouchButton(buttonId, pressed)`.

Visual active state: darken background with `opacity-70` or `brightness-50` filter when active.

---

### Step 5 — GameCanvas.tsx (update)
- Remove lines 6 and 85 (`import MobileControls`, `<MobileControls engineRef={engineRef} />`)
- Add `scale?: number` to the component props interface (default 3)
- Replace `const SCALE = 3` with `const { scale = 3 } = props` or just the prop inline

---

### Step 6 — layout.tsx (update)
Add inside `<head>`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
```

---

### Step 7 — page.tsx (rewrite)
```tsx
'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import MobileControls from '@/components/MobileControls'
import SettingsModal from '@/components/SettingsModal'
import { useStorageWarning } from '@/game/systems/SaveSystem'
import { useSettings } from '@/hooks/useSettings'
import { VIEWPORT_W, VIEWPORT_H } from '@/game/engine/Camera'

const GameCanvas = dynamic(...)

function StorageWarning() { /* yellow bar, dismissible */ }

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, updateSetting } = useSettings()
  const scale = settings.scale

  return (
    <main className="flex flex-col h-screen bg-[#1a1c2c] items-center justify-center overflow-hidden relative">
      <StorageWarning />

      {/* Gear icon - top right, always visible */}
      <button
        data-testid="settings-btn"
        onClick={() => setSettingsOpen(true)}
        className="fixed top-2 right-2 z-50 text-[#566c86] hover:text-white text-xl"
        aria-label="Settings"
      >⚙</button>

      {/* Canvas wrapper - responsive */}
      <div
        className="relative flex-1 flex items-center justify-center w-full md:flex-none"
        style={{ maxHeight: 'calc(100vh - 120px)' }} // mobile: leave room for controls
      >
        <div
          className="md:hidden w-screen aspect-[160/144]"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          <GameCanvas scale={1} className="w-full h-full" />
        </div>
        <div className="hidden md:block">
          <GameCanvas scale={scale} />
        </div>
      </div>

      {/* Mobile controls row */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[120px]">
        <MobileControls />
      </div>

      {/* Desktop keyboard hint footer */}
      <footer className="hidden md:block mt-4 text-[#566c86] text-[8px] font-pixel text-center">
        Arrow Keys: Move | Z: Confirm | X: Cancel | Enter: Start
      </footer>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingChange={updateSetting}
      />
    </main>
  )
}
```

Note: The GameCanvas dynamic import approach (rendering two instances) won't work. The actual implementation will use a single GameCanvas with conditional scale/className prop, with a `useIsMobile` check to determine the scale/style.

---

## Canvas Responsive Sizing — Final Approach

`page.tsx` will use a `useEffect` mount hook to detect mobile:
```ts
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  const check = () => setIsMobile(window.innerWidth <= 768)
  check()
  window.addEventListener('resize', check)
  return () => window.removeEventListener('resize', check)
}, [])
```

On mobile: GameCanvas receives `scale` derived from 100vw. Actual calculation:
```ts
const mobileScale = typeof window !== 'undefined' ? window.innerWidth / VIEWPORT_W : 1
```
On desktop: `scale = settings.scale`

GameCanvas renders `canvas` with `style={{ width: VIEWPORT_W * scale, height: VIEWPORT_H * scale }}`.

This maintains the 160:144 aspect ratio at all viewport sizes.

---

## File Dependency Graph

```
useSettings.ts
  └── SettingsModal.tsx ← page.tsx
  └── page.tsx

InputManager.ts (static getInstance)
  └── MobileControls.tsx ← page.tsx
  └── GameEngine.ts (use getInstance)
  └── GameCanvas.tsx (no more MobileControls import)
```

---

## Test Strategy

Tests use `vitest` + `jsdom` (confirmed in `vitest.config.ts`). React component tests would use `@testing-library/react`. Checking if that's installed:

- If RTL not available: component tests will be pure unit tests of hook logic + InputManager
- InputManager tests: pure unit tests, no DOM needed
- MobileControls/SettingsModal: RTL if available, otherwise test via InputManager state

---

## Known Limitations / Deferred Items

1. **Real-time volume propagation**: Settings changes persist to localStorage but don't update `AudioManager` in real-time. Will take effect on next page load. AudioManager singleton could be called directly in `updateSetting` if `setMusicVolume` exists.
2. **`text-speed` effect on DialogSystem**: The `textSpeed` setting is stored but DialogSystem's char timer is not hooked up to it in this task.
3. **D-pad visual SVG**: Spec allows SVG or div-based. We use div-based (simpler, no SVG overhead).
4. **Scale on mobile**: The `[2×][3×][4×]` scale buttons are hidden on mobile. Mobile users always get 100vw fill.
