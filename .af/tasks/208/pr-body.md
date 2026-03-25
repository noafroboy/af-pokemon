# E2E Tests, Integration Verification + Polish Pass

## Summary

- **23 Playwright E2E tests** across 5 spec files covering all critical user journeys
- **3 bug fixes** discovered during E2E authoring (save unification, encounter sync, battle ITEM action)
- **3 polish features** added (level-up overlay, name truncation, badge glow animation)
- **6 file splits** to keep all source files under 200 lines (Iron Law)
- **TypeScript clean**: zero `tsc --noEmit` errors; 215 unit tests passing

## What Changed

### New Test Files
- `tests/e2e/helpers.ts` — `buildSave()` factory + pre-built Pokémon fixtures
- `tests/e2e/new-game-journey.spec.ts` — Title → onboarding → starter choice
- `tests/e2e/wild-catch-journey.spec.ts` — Encounter trigger, ITEM action, catch flow
- `tests/e2e/gym-badge-journey.spec.ts` — Pewter Gym trainer battle → badge ceremony
- `tests/e2e/team-management-journey.spec.ts` — Party screen, save/reload persistence
- `tests/e2e/integration-checks.spec.ts` — 7 cross-cutting checks (storage, mobile, secrets, line counts)

### New Source Files
- `src/game/data/MapBundles.ts` — Extracted map JSON imports + TIMESTEP (reduces GameEngine to 199 lines)
- `src/game/data/pokemon-data.ts` — Species 16–20 + Pikachu extended data
- `src/game/engine/AssetManifest.ts` — Tile colors and sprite sheet metadata
- `src/game/engine/GamePhaseUpdater.ts` — Phase update logic extracted from GameEngine
- `src/game/engine/GamePhaseRenderer.ts` — Phase render logic extracted from GameEngine
- `src/game/engine/ScriptHandler.ts` — Script dispatch handler

### Bug Fixes
1. **Save system unification** (`GameEngine.applyV1Save()`): Pre-seeded saves in `pokebrowser_save_v1` are now loaded correctly; game skips title screen when `NEW_GAME_STARTED` flag is set
2. **EncounterSystem hardcoded Pokémon** (`EncounterSystem.ts`): Player's actual party lead is used in battle instead of always Bulbasaur
3. **BattleSystem ITEM action** (`BattleSystem.ts`): Selecting ITEM in battle now finds and uses a Pokéball from inventory, calls `processTurn` with the ITEM action

### Polish
- **Level-up overlay** (`BattleRenderer.ts`): 2-second semi-transparent panel displays "NAME grew to Lv.N!" with gold border on `LEVEL_UP` events
- **Name truncation** (`DialogRenderer.ts`): `truncateName(name, 10)` exported helper truncates long names with `…` in name-entry display
- **Badge glow** (`MenuRenderer.ts`): Earned badges pulse with sinusoidal white alpha overlay (0–35% opacity) in badge case screen

### Other Changes
- `app/page.tsx`: Added `data-testid="storage-warning"` to storage unavailability banner
- `src/game/types/GameState.ts`: Widened `flags` type to `Record<string, unknown>` to support `boolean[]` badge arrays
- `vitest.config.ts`: Added `tests/e2e/**` to exclude list so Vitest doesn't run Playwright specs
- `playwright.config.ts`: `testDir` updated to `./tests/e2e`

## Test Plan

- [ ] `npm test` — all 215 unit tests pass
- [ ] `npx playwright test` — runs E2E suites (requires `npm run dev` in background)
- [ ] Manual: load game with pre-seeded save → verify party count, map, start menu
- [ ] Manual: trigger wild encounter → use ITEM → verify catch or failure message
- [ ] Manual: reach Pewter Gym → defeat Brock → verify badge ceremony → check badge case

🤖 Generated with [Claude Code](https://claude.com/claude-code)
