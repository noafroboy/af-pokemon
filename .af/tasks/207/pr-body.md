## Summary
- Adds full virtual D-pad + action button overlay for mobile play, bridged to InputManager via `registerTouchButton`
- Makes the full page layout responsive from 375px mobile (canvas fills viewport width, virtual controls at bottom) to 1280px+ desktop (scale-setting canvas, keyboard hint footer)
- Introduces a persistent settings system (text speed, music/SFX volume, canvas scale) stored in `localStorage` and surfaced through a gear-icon-triggered SettingsModal

## Changes

### InputManager (`src/game/engine/InputManager.ts`)
- Added `TouchButtonId` type (`up|down|left|right|a|b|start|select`)
- Added `static getInstance()` singleton + `static _resetForTest()` for test isolation
- Rewrote `registerTouchButton(buttonId, pressed)` to map virtual buttons → `GameKey` and call `simulateKeyDown`/`simulateKeyUp`

### GameEngine (`src/game/engine/GameEngine.ts`)
- Changed `new InputManager()` to `InputManager.getInstance()` so MobileControls can share the same instance without prop drilling

### New: `src/hooks/useSettings.ts`
- `useSettings()` hook that reads/writes `pokebrowser_settings` in `localStorage`; exposes `{ settings, updateSetting }`

### New: `src/components/SettingsModal.tsx`
- Centered modal overlay with text speed buttons, music/SFX volume sliders, desktop-only scale selector
- Closes on Escape key or backdrop click; `data-testid="settings-modal"`

### Rewritten: `src/components/MobileControls.tsx`
- Uses `InputManager.getInstance()` (no prop drilling)
- D-pad: 3×3 CSS grid, 52×52px arms, `rgba(0,0,0,0.4)` backgrounds with darkened active state
- A (60×60 red circle), B (50×50 blue circle), START (60×24 rect), SELECT (50×24 rect)
- All buttons use `onPointerDown`/`onPointerUp`/`onPointerCancel` with `e.preventDefault()`
- `data-testid` on every interactive element

### `src/components/GameCanvas.tsx`
- Removed MobileControls (moved to page.tsx); accepts `scale?: number` prop (default 3)

### `app/layout.tsx`
- Added `<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">`

### `app/page.tsx`
- Responsive layout: mobile shows canvas + 120px controls bar; desktop shows canvas + footer
- Canvas scale computed from `settings.scale` on desktop, `window.innerWidth / 160` on mobile
- Gear icon button (`data-testid="settings-btn"`) always visible top-right
- Storage warning banner updated to yellow

### Tests
- `src/game/__tests__/InputManager.test.ts` — added singleton tests + full `registerTouchButton` coverage
- `src/components/__tests__/MobileControls.test.tsx` — 11 tests covering rendering, pointer events, InputManager integration
- `src/components/__tests__/SettingsModal.test.tsx` — 10 tests covering open/close, Escape key, setting callbacks

## Testing
- `npm test` → 215 tests pass across 18 test files
- `npx tsc --noEmit` → zero type errors
- `npm run lint` → zero errors (one pre-existing font warning)
