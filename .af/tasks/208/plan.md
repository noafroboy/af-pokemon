# Task 208 — E2E Tests, Integration Verification + Polish Pass

## Assumption Audit

Before planning, the following ambiguities were identified and resolved:

| Ambiguity | Assumption Made |
|-----------|-----------------|
| `tests/e2e/` vs current `e2e/` | playwright.config.ts must change testDir to `./tests/e2e` |
| "press End key" in name-entry | End key is not a registered game key; interpreted as "when done entering name, press Enter/Z to confirm" |
| Pre-seeded save injection | Must write to `pokebrowser_save_0` (old engine format) because GameEngine constructor calls `loadGame(0)` from `engine/SaveSystem.ts` — not the new v1 system |
| "badge[0]=true in localStorage" | Means `pokebrowser_save_v1` slot 1 `gameState.flags.badges[0] === true` after auto-save |
| Mobile layout at 375px | Canvas + mobile controls both visible without vertical scroll; app already uses dynamic scale |
| All 5 START menu items functional | OPTIONS must use real text speed / scale settings, not hardcoded defaults |
| No component over 200 lines | Applies to ALL `.ts`/`.tsx` files including test files per spec wording |

## Risks & Open Questions

1. **GameEngine.ts is 465 lines** — Largest refactor risk. Must be split without breaking the game loop. Plan: extract phase-update and phase-render logic to separate helper files.
2. **Dual save systems** — `engine/SaveSystem.ts` (slot 0, old) and `systems/SaveSystem.ts` (v1, new) are disconnected. Engine loads from old system; menu saves to new system. Party Pokemon is **never restored** from saves. Fix: unify engine to load from new v1 system.
3. **Script execution is a stub** — `GameEngine` handles SCRIPT results by showing `Script: {id}` text. Journey 1 requires real starter selection (STARTER_TABLE_TRIGGER). Minimum implementation needed.
4. **Name entry letters not handled** — InputManager only allows game keys (arrows, z, x, Enter, Escape). Alpha keys for name entry are commented as "simplified". Need to add separate keydown handler in GameEngine for this mode.
5. **EncounterSystem hardcodes Bulbasaur Lv.5** — Journey 2 (wild-catch) requires the actual party Pokemon to be used. Fix: `state.partyPokemon[0] ?? createPokemonInstance(1, 5, 'PLAYER')`.
6. **Battle ITEM action not implemented** — `BattleSystem.handleActionMenu()` has no case for `ITEM` choice. Journey 2 needs Pokeball throwing.
7. **pokemon.ts (234 lines) and AssetLoader.ts (217 lines)** also exceed 200-line limit — require light splitting.

---

## Approach Alternatives

### APPROACH A: Conservative (CHOSEN)
**Minimise code changes — fix bugs that prevent test passing, add seams for testability, avoid rewrites.**
- Effort: **L**
- Risk: **Medium** (splitting GameEngine is the biggest risk)
- Trade-off: Tests match actual game functionality; some planned journey steps may be slightly simplified where features truly don't exist but all 4 journey tests pass with real game behaviour.

### APPROACH B: Ideal
**Full re-architecture — proper plugin-based script engine, event-sourced battle renderer, unified save API.**
- Effort: **XL**
- Risk: **Low** (clean architecture) but **High** (time overrun, scope creep)
- Trade-off: Best long-term codebase but 3-4× more work; would require rebuilding systems already working.

## Approach Decision: A (Conservative)

This task is an *integration verification + polish pass*, not a new-feature sprint. The game systems are mostly working; the issues are integration gaps, missing seams for testing, and incomplete polish items. Approach A fixes the integration gaps directly without rewriting working code. The one substantial addition is minimal script execution for Journey 1.

---

## Production-Readiness Checklist

### 1. Persistence
**Current:** Two incompatible save systems exist. `engine/SaveSystem.ts` stores `{playerName, tileX, tileY, currentMap, partyIds[], badges[], money, playTime, flags}` — no `partyPokemon`. `systems/SaveSystem.ts` stores full `gameState` including `partyPokemon`. Engine loads from the old system; menu saves to the new.
**Fix:** Update `GameEngine` constructor to preferentially load from `pokebrowser_save_v1` slot 1 (new system) if present, restoring full `partyPokemon`, `inventory`, and `flags`. Keep old-system fallback for backwards compatibility.

### 2. Error Handling
**Current:** `saveGame()` and `loadGame()` are wrapped in try/catch. `StorageWarning` banner component renders when localStorage fails. Sprite 404 → colored fallback rectangle (BattleRenderer, OverworldRenderer). Battle errors caught in `GameEngine.loop()` try/catch → `renderError()` on canvas.
**Needed:** Ensure SCRIPT execution errors are caught. Ensure battle ITEM action failure is handled gracefully. Add "You blacked out!" dialog before teleport (currently silent).

### 3. Input Validation
**Current:** Name entry capped at 7 chars. Save slot must be 1|2|3 (throws on invalid). No external API calls.
**Needed:** N/A — client-only game, no server calls. Letter key name entry is the missing validation seam.

### 4. Loading States
**Current:** `GameCanvas` shows "LOADING..." overlay. Battle screen shows "Loading..." text while battle state is null. Save progress bar animated.
**Status:** ✅ Adequate.

### 5. Empty States
**Current:** Empty bag screen and empty PC screen show blank canvas areas.
**Fix:** Add "Nothing here." centred text when bag category is empty. Add "PC is empty." when PC storage has no Pokémon.

### 6. Security
No API keys, no server calls, no LLM. The integration-checks spec will grep all source files for `/sk-[a-zA-Z0-9]{20,}/`, `OPENAI_API_KEY`, and `Bearer ...` patterns to assert zero matches.

### 7. Component Size
**Current offenders (must fix):**
- `GameEngine.ts` — 465 lines → extract `GamePhaseUpdater.ts` + `GamePhaseRenderer.ts` + `ScriptHandler.ts`
- `pokemon.ts` — 234 lines → extract learnset data to compressed format or separate constant file
- `AssetLoader.ts` — 217 lines → extract `AssetManifest.ts` with constants

### 8. Test Coverage
- 4 full journey E2E tests covering new-game, wild catch, gym badge, and team management
- 1 integration-checks suite covering 7 cross-cutting concerns
- All existing 6 unit tests must continue passing
- All existing E2E tests (e2e/overworld.spec.ts) must not regress

---

## Detailed Implementation Plan

### Step 1 — Create branch
```
git checkout -b af/208-e2e-tests-integration-verification-polis/1
```

### Step 2 — Update playwright.config.ts
Change `testDir: './e2e'` → `testDir: './tests/e2e'`.
Add a mobile project: `{ name: 'mobile-chrome', use: { ...devices['Pixel 5'] } }` for the 375px viewport tests in integration-checks.

### Step 3 — Unify save/load system (CRITICAL)
`GameEngine.constructor()` currently calls `loadGame(0)` from `engine/SaveSystem.ts` which reads `pokebrowser_save_0`. This old format lacks `partyPokemon`.

**Fix:** After loading old-format save, also try `load(1)` from `systems/SaveSystem.ts`. If the new-system slot exists, apply `gameState.partyPokemon`, `gameState.inventory`, `gameState.currentMap`, `gameState.playerTileX`, `gameState.playerTileY`, and `gameState.flags` to `this.state`.

Pre-seeded saves for E2E tests must write to `pokebrowser_save_v1` in the new format (which now works).

### Step 4 — Expose game state for E2E testing
Add to `GameEngine`:
```typescript
getPhase(): string { return this.state.phase }
getMapId(): string { return this.state.currentMap }
getPartyCount(): number { return this.state.partyPokemon.length }
getBadgeCount(): number {
  const b = this.state.flags['badges']
  return Array.isArray(b) ? (b as boolean[]).filter(Boolean).length : 0
}
```

In `GameCanvas.tsx`, after engine is created, schedule an `updateAttrs` callback each frame:
```typescript
const updateAttrs = () => {
  canvas.setAttribute('data-game-phase', engine.getPhase())
  canvas.setAttribute('data-map-id', engine.getMapId())
  canvas.setAttribute('data-party-count', String(engine.getPartyCount()))
  attrsRafId = requestAnimationFrame(updateAttrs)
}
updateAttrs()
```

Also set `window.__GAME_DEBUG__ = { engine }` for complex `page.evaluate()` calls.

### Step 5 — Fix name-entry letter key handling
In `GameEngine.start()` / `GameEngine` constructor, register an additional raw `keydown` handler:
```typescript
private onCharKeyDown = (e: KeyboardEvent): void => {
  if (!this.dialogSystem.isNameEntry) return
  const ch = e.key
  if (ch.length === 1 && /[A-Za-z]/.test(ch)) {
    this.dialogSystem.nameAddChar(ch.toUpperCase())
  } else if (ch === 'Backspace') {
    this.dialogSystem.nameDeleteChar()
    e.preventDefault()
  }
}
```
Attach on `start()`, detach on `stop()`.

### Step 6 — Implement minimal script execution
Create `src/game/engine/ScriptHandler.ts`:
- Handles: `STARTER_TABLE_TRIGGER`, `STARTER_OBTAINED_*`, `RIVAL_COUNTER_AFTER`, `NURSE_JOY_HEAL`, `NURSE_JOY_HEALED`
- On `STARTER_TABLE_TRIGGER`: shows the choices dialog; on choice 0/1/2 adds species 1/4/7 to `state.partyPokemon`; transitions to `STARTER_OBTAINED_*` dialog
- On `RIVAL_COUNTER_AFTER`: shows dialog, then sets up a trainer battle with rival's starter counter-pick

In `GameEngine`, when `result.type === 'SCRIPT'`, call `this.scriptHandler.handle(result.scriptId, this.state, this.dialogSystem)` instead of stub dialog.

### Step 7 — Fix EncounterSystem party lookup
In `EncounterSystem.startEncounter()`, replace:
```typescript
const playerPokemon = createPokemonInstance(1, 5, 'PLAYER')
```
with:
```typescript
const playerPokemon = _state.partyPokemon[0]
  ? JSON.parse(JSON.stringify(_state.partyPokemon[0])) as PokemonInstance
  : createPokemonInstance(1, 5, 'PLAYER')
```
After the battle ends, if the player Pokemon levelled up or gained EXP, sync changes back to `state.partyPokemon[0]`.

### Step 8 — Implement battle ITEM action
In `BattleSystem.handleActionMenu()`, add:
```typescript
else if (choice === 'ITEM') {
  // Find first Pokeball in inventory
  const inventory = (this.input as any).__state?.inventory ?? []
  // ... throw Pokeball via CatchSystem
}
```
Since BattleSystem needs access to GameState to use inventory, the `update(state)` signature already receives it. Pass state to handleActionMenu and handleMoveMenu.

### Step 9 — Add post-blackout dialog
In `GameEngine.update()`, case `GamePhase.BATTLE`, when `battleResult === 'DONE'` and all party fainted:
1. Before teleporting, set a `blackoutPending` flag
2. In DIALOG phase, if `blackoutPending`, show "You blacked out!" then "Your Pokemon were healed to full health at the Pokemon Center!" then clear flag and execute teleport + heal

### Step 10 — Split GameEngine.ts (465 lines → ~150 lines)
Extract:
- `GamePhaseUpdater.ts` — all `update()` switch/case phase logic (~140 lines)
- `GamePhaseRenderer.ts` — all `render()` switch/case phase logic (~80 lines)
- `ScriptHandler.ts` — script execution (~60 lines)

`GameEngine.ts` retains: constructor, start/stop, loop, loadMap, onPhaseChange, renderError, public getters — target ~150 lines.

### Step 11 — Split pokemon.ts and AssetLoader.ts
**pokemon.ts** (234 lines): The large size comes from species data entries. Extract learnset arrays to shorter format using `[level, moveId]` tuples and compress. Or split species 1-12 into one file and 13-25 into another, re-exporting a combined `POKEMON_DATA`.

**AssetLoader.ts** (217 lines): Move `AssetManifest`, `TILE_COLORS`, `SPRITE_SHEET_META` to new `src/game/engine/AssetManifest.ts`. AssetLoader becomes ~150 lines.

### Step 12 — Level-up stat reveal overlay
In `BattleRenderer`, add:
```typescript
private levelUpOverlay: {
  active: boolean; name: string; newLevel: number;
  oldStats: Record<string, number>; newStats: Record<string, number>; timer: number
} | null = null
```
When processing events in `render()`, detect `LEVEL_UP` events; capture old/new stats; set overlay active with 2000ms timer.
Render: black semi-transparent panel with "NAME grew to Lv.N!" + stat lines (ATK/DEF/SPD/SPC Δ values) while timer > 0.

### Step 13 — Wire text speed to settings
`useSettings` hook stores `settings.textSpeed`. Expose a module-level `getTextSpeed(): TextSpeed` function from the settings module, or pass it through GameEngine (which has access to window global).

In `GameEngine`, before `this.dialogSystem.startDialog(pages)`, call `dialog.startDialog(pages, getTextSpeed())`.

Verify all 3 speeds in DialogSystem:
- `FAST: 16ms` — blip plays, text flies
- `NORMAL: 40ms` — default
- `SLOW: 80ms` — adds 50ms effective per char

### Step 14 — Badge glow animation
In `MenuRenderer.renderBadgeCase()`, for each earned badge position:
```typescript
const alpha = 0.15 + 0.15 * Math.sin(Date.now() / 400)
ctx.fillStyle = `rgba(255, 220, 0, ${alpha})`
ctx.fillRect(badgeX - 1, badgeY - 1, badgeSize + 2, badgeSize + 2)
```

### Step 15 — Long name truncation in DialogRenderer
Add helper:
```typescript
function truncateName(name: string, max = 10): string {
  return name.length > max ? name.slice(0, 9) + '…' : name
}
```
Apply to all NPC names and Pokemon names before rendering to canvas text.

### Step 16 — Empty bag and PC messages
In `renderBagScreen()` in UIRenderer:
- After filtering items by category, if `filteredItems.length === 0`, render centred grey text "Nothing here."

In `PCRenderer` (if exists) or wherever PC screen is rendered:
- If `pcPokemon.length === 0`, render "The PC is empty."

### Step 17 — Frame-time tracker
In `GameEngine.loop()`:
```typescript
const dt = Math.min(timestamp - this.lastTime, 100)
if (dt > 20 && this.state.phase !== GamePhase.TITLE) {
  console.warn(`[GameEngine] Frame budget exceeded: ${dt.toFixed(1)}ms`)
}
```

### Step 18 — Write E2E test files

#### `tests/e2e/new-game-journey.spec.ts`
Strategy: use `page.waitForFunction` to poll `canvas.getAttribute('data-game-phase')` for state transitions. Use `page.keyboard.press()` for game keys and `page.keyboard.type()` for name entry chars.

Key assertions:
- Canvas visible with `data-game-phase='TITLE'`
- After Enter: `data-game-phase='DIALOG'`
- After advancing dialogs: name entry active (can check title rendering or phase still DIALOG)
- After naming: `data-game-phase='OVERWORLD'` and `data-map-id='pallet-town'`
- After starter selection: `data-party-count='1'`
- After rival battle + completion: `data-game-phase='OVERWORLD'` and `data-map-id='pallet-town'`

#### `tests/e2e/wild-catch-journey.spec.ts`
Strategy: inject save state via `page.addInitScript` writing to `pokebrowser_save_v1` with Bulbasaur Lv.5 + 5 Pokeballs. Hold ArrowDown on Route 1 until encounter transitions (phase becomes 'BATTLE'). Navigate battle menu. Assert phase returns to OVERWORLD and/or party count changes.

```typescript
await page.addInitScript(() => {
  const save = { /* bulbasaur save at route-1 */ }
  localStorage.setItem('pokebrowser_save_v1', JSON.stringify({ "1": save }))
})
```

#### `tests/e2e/gym-badge-journey.spec.ts`
Inject save with Squirtle Lv.15 at Pewter Gym entrance coordinates. Press Up to enter gym via warp. Navigate to Brock. Battle sequence. Check `data-game-phase='BADGE_CEREMONY'` appears. After ceremony, check localStorage for badge flag.

#### `tests/e2e/team-management-journey.spec.ts`
Inject save with 2 Pokemon (one low HP) + 3 Potions. Press Enter → wait for MENU phase. Navigate menus. After save and reload, verify restored state via data attributes and localStorage inspection.

#### `tests/e2e/integration-checks.spec.ts`
1. **localStorage persistence**: Save via menu, close tab, reopen, check same map/party
2. **localStorage unavailable**: `page.addInitScript` overrides `localStorage.setItem` to throw; assert StorageWarning banner visible
3. **Missing sprite 404**: Intercept sprite PNG → return 404; assert no unhandled promise rejections; assert canvas still renders
4. **No hardcoded secrets**: `grep source files`; assert 0 matches
5. **No component over 200 lines**: read all `.ts/.tsx` files, assert lineCount < 200
6. **Mobile 375px**: set viewport 375×667; assert canvas and mobile controls visible without scroll
7. **All 5 menu items functional**: open START, press Z on each of POKEMON/ITEM/SAVE/OPTIONS/EXIT, assert each opens a real screen (data-game-phase stays MENU and different UI renders — or at minimum no phase === OVERWORLD after opening)

---

## Files Created/Modified Summary

### New Files
| Path | Purpose |
|------|---------|
| `tests/e2e/new-game-journey.spec.ts` | Journey 1 E2E test |
| `tests/e2e/wild-catch-journey.spec.ts` | Journey 2 E2E test |
| `tests/e2e/gym-badge-journey.spec.ts` | Journey 3 E2E test |
| `tests/e2e/team-management-journey.spec.ts` | Journey 4 E2E test |
| `tests/e2e/integration-checks.spec.ts` | Cross-cutting integration checks |
| `src/game/engine/GamePhaseUpdater.ts` | Extracted phase update logic from GameEngine |
| `src/game/engine/GamePhaseRenderer.ts` | Extracted phase render logic from GameEngine |
| `src/game/engine/ScriptHandler.ts` | Minimal script execution (starter, rival, nurse) |
| `src/game/engine/AssetManifest.ts` | Extracted constants from AssetLoader |

### Modified Files
| Path | Change |
|------|--------|
| `playwright.config.ts` | testDir → `./tests/e2e`; add mobile project |
| `src/components/GameCanvas.tsx` | Add data-game-phase/map-id/party-count attrs; window debug |
| `src/game/engine/GameEngine.ts` | Split + unify save load + letter keys + frame tracker + state getters |
| `src/game/systems/EncounterSystem.ts` | Use party Pokemon from state |
| `src/game/systems/BattleSystem.ts` | Implement ITEM action; pass state to handlers |
| `src/game/renderers/BattleRenderer.ts` | Level-up overlay |
| `src/game/renderers/DialogRenderer.ts` | Name truncation |
| `src/game/renderers/MenuRenderer.ts` | Badge glow animation |
| `src/game/renderers/UIRenderer.ts` | Empty bag/PC state messages |
| `src/game/engine/AssetLoader.ts` | Import from AssetManifest; reduce to <200 lines |
| `src/game/data/pokemon.ts` | Compress/split to <200 lines |

---

## Test Strategy for Canvas-Based Game

Since the game renders exclusively to a `<canvas>` element, traditional DOM assertions are insufficient. The chosen strategy:

1. **Data attributes** on the `<canvas>` element (`data-game-phase`, `data-map-id`, `data-party-count`) updated each RAF tick by GameCanvas — allows `page.waitForSelector('[data-game-phase="OVERWORLD"]')` style assertions.

2. **Window global** (`window.__GAME_DEBUG__`) provides deeper query capability via `page.evaluate(() => window.__GAME_DEBUG__.engine.getPartyCount())`.

3. **localStorage inspection** via `page.evaluate(() => localStorage.getItem('pokebrowser_save_v1'))` for persistence checks.

4. **`page.waitForFunction`** with polling for game state changes after key sequences, with generous timeouts (15–30s) to account for game animation and headless Chromium timing.

5. **`page.addInitScript`** to inject pre-seeded save states before page loads.

6. **`page.route`** to intercept sprite asset requests for the missing-sprite test.

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Journey tests flaky due to random encounters | Pre-seed save at Route 1 with max encounter rate tile; hold direction key until encounter triggers with retry loop |
| GameEngine split breaks game loop | Split is purely extractive (no logic changes); existing unit tests catch regressions |
| Rival battle requires scripted trainer setup | ScriptHandler creates a minimal TrainerNPC with rival's counter-starter on demand |
| Name entry letters in headless mode | Raw keydown listener bypasses InputManager; Playwright's `page.keyboard.type()` fires keydown events that the listener captures |
| Badge test: badge persists in both save systems | Sync badge state to both save systems when marking trainer defeated |
| pokemon.ts / AssetLoader.ts split may break imports | Use barrel re-exports to maintain backward compatibility |
