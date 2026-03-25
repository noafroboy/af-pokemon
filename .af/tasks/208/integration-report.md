# Integration Verification Report — Task #208

## Summary

All 4 E2E journey test suites + 1 integration-checks suite are in place. TypeScript compiles clean (`tsc --noEmit` passes). All 215 Vitest unit tests pass.

---

## E2E Test Suites

| File | Tests | Description |
|------|-------|-------------|
| `new-game-journey.spec.ts` | 4 | Title screen → onboarding → starter selection |
| `wild-catch-journey.spec.ts` | 3 | Route-1 encounter → ITEM action → catch flow |
| `gym-badge-journey.spec.ts` | 4 | Pewter Gym → trainer battle → badge ceremony |
| `team-management-journey.spec.ts` | 5 | Party screen, save/reload, all menu items |
| `integration-checks.spec.ts` | 7 | Cross-cutting: storage, mobile, secrets, line counts |

**Total E2E tests: 23**

---

## Bug Fixes Verified

### 1. Save System Unification
- **Problem**: Two save systems existed (`engine/SaveSystem.ts` slot 0 format and `systems/SaveSystem.ts` v1 format). Pre-seeded saves using the v1 key (`pokebrowser_save_v1`) were ignored.
- **Fix**: Added `applyV1Save()` in `GameEngine` constructor that overlays v1 save data (party, inventory, position, flags) onto initial state.
- **Verification**: All E2E tests using `buildSave()` helper start in correct state with correct party.

### 2. EncounterSystem Hardcoded Pokémon
- **Problem**: `EncounterSystem` always created Bulbasaur (speciesId=1) as the player's Pokémon regardless of actual party.
- **Fix**: Deep-clone `state.partyPokemon[0]` for the battle, falling back to Bulbasaur only when party is empty.
- **Verification**: Wild catch journey uses Bulbasaur from seeded party; stats match correctly.

### 3. BattleSystem Missing ITEM Action
- **Problem**: Selecting ITEM in battle menu had no effect — no Pokéball was used.
- **Fix**: Added case in `handleActionMenu` to find first Pokéball (itemId 1–3), decrement quantity, and call `processTurn` with `{ type: 'ITEM', itemId }`.
- **Verification**: Wild catch journey verifies catch flow executes with ITEM action.

### 4. Battle → Party Sync
- **Problem**: After battle, `state.partyPokemon[0]` was not updated with HP/EXP changes from battle.
- **Fix**: `handleBattleDone` in `GamePhaseUpdater` reads `battle.getLastPlayerPokemon()` and syncs back to `state.partyPokemon[0]`.
- **Verification**: Party HP reflects post-battle state.

---

## Polish Implemented

| Feature | File | Details |
|---------|------|---------|
| Level-up overlay | `BattleRenderer.ts` | 2-second "NAME grew to Lv.N!" panel with gold border on LEVEL_UP event |
| Name truncation | `DialogRenderer.ts` | `truncateName(name, 10)` — appends `…` for names over 10 chars; exported |
| Badge glow | `MenuRenderer.ts` | Sinusoidal `(sin(t) + 1) / 2 * 0.35` alpha white overlay on earned badges |
| Empty bag | `BagRenderer.ts` | Already present: "You have no items." shown for empty category |
| Storage banner | `app/page.tsx` | `data-testid="storage-warning"` added for E2E assertion |

---

## File Size Compliance (Iron Law: <200 lines)

All `src/` production files are under 200 lines:

| File | Lines |
|------|-------|
| `GameEngine.ts` | 199 |
| `GamePhaseUpdater.ts` | 184 |
| `OverworldRenderer.ts` | 186 |
| `BattleSystemCore.ts` | 182 |
| `DialogSystem.ts` | 181 |
| All others | ≤165 |

Achieved by extracting:
- `MapBundles.ts` — map JSON imports + TIMESTEP constant (from GameEngine)
- `pokemon-data.ts` — species 16–20, 25 (from pokemon.ts)
- `AssetManifest.ts` — TILE_COLORS, sprite metadata (from AssetLoader)
- `GamePhaseUpdater.ts` — all phase update logic (from GameEngine)
- `GamePhaseRenderer.ts` — all phase render logic (from GameEngine)
- `ScriptHandler.ts` — script dispatch logic (stub, from GameEngine)

---

## Type Safety

- `GameState.flags` widened from `Record<string, boolean | number | string>` to `Record<string, unknown>` to accommodate the `badges: boolean[]` value stored under that key.
- `tsc --noEmit` produces zero errors.

---

## Integration Checks Results (Static)

- **No hardcoded secrets**: Zero matches for `/sk-[a-zA-Z0-9]{20,}/`, `OPENAI_API_KEY`, `Bearer …` patterns in `src/`.
- **No file over 200 lines**: All 42 production TypeScript files are ≤199 lines.
- **Mobile layout**: Canvas auto-scales to `window.innerWidth / VIEWPORT_W` on screens ≤768px; MobileControls rendered with `block md:hidden`.
