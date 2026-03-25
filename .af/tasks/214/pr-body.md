## Summary
- Verified and fixed the complete game loop end-to-end: starter selection → rival battle → Route-1 traversal → Viridian City → Pewter Gym → Brock badge.
- Fixed 8 bugs discovered during integration verification spanning map navigation, catch mechanics, paralysis probability, rival battle flow, and file-size compliance.
- All 289 unit tests pass; `npx tsc --noEmit` exits clean.

## Changes

### Navigation (Map Warps)
- **`src/game/systems/OverworldSystem.ts`** — `tryMove` now allows movement onto warp tiles even when the cell has `collision=1`; all border/door warp tiles were previously unreachable.
- **`src/game/data/maps/route-1.json`** — Renamed `targetTileX`/`targetTileY` → `targetX`/`targetY` on both warps to match the `WarpDefinition` type (warps were landing at undefined coordinates).
- **`src/game/data/maps/viridian-city.json`** — Added missing warp from Viridian City north edge `(14,0)` → Pewter Gym `(7,12)`.
- **`src/game/data/maps/pewter-gym.json`** — Fixed exit warp: `targetMap` was `"pewter-city"` (non-existent map) → `"viridian-city"` with correct tile `(14,1)`.

### Catch Mechanic
- **`src/game/types/GameState.ts`** — `createInitialGameState()` now returns `inventory: [{ itemId: 1, quantity: 5 }]` so the player starts with 5 Pokéballs.

### Rival Battle
- **`src/game/data/maps/pallet-town.json`** — Added `RIVAL_BATTLE_TRIGGER` scriptZone at tiles (9–11, 4–5) so the rival battle triggers in the same session after picking a starter.
- **`src/game/engine/GamePhaseUpdater.ts`** — DIALOG phase handler now starts the battle transition when `state.trainerBattleNpcId` is set after a script-triggered dialog ends, fixing the rival battle flow.

### Paralysis Probability
- **`src/game/systems/battle/StatusEffects.ts`** — Fixed `Math.random() >= 0.25` (75% paralysis) → `Math.random() < 0.25` (correct 25% Gen-1 paralysis chance).
- **`tests/battle-system.test.ts`** — Updated paralysis test mock values to match the corrected logic.

### File-Size Refactor
- **`src/game/engine/BattleStateManager.ts`** (new, 107 lines) — Extracted `BADGE_INDEX_MAP`, `createTrainerBattleState`, and `handleBattleDone` from `GamePhaseUpdater`.
- **`src/game/engine/GamePhaseUpdater.ts`** — Reduced from 273 → 189 lines by delegating to `BattleStateManager`; `BADGE_INDEX_MAP` re-exported for backward compatibility.

## Testing
- `npm test` — 289 tests, 21 test files, all pass.
- `npx tsc --noEmit` — exits 0, no type errors.
- Integration report: `.af/tasks/214/integration-report.md` documents pass/fail for all 10 checklist items.
