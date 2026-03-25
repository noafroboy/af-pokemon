## Summary
- Adds visible hit-flash and sprite-shake effects to `BattleRenderer` so players get immediate visual feedback when a Pokémon takes damage — bridging the gap between audio SFX (already present) and on-screen feedback (previously absent).
- Flash color communicates effectiveness: white = normal, yellow = super-effective, grey = not-very-effective, matching the three existing SFX variants.
- Extracted all effect state and helpers into a new `AttackEffects.ts` module to keep `BattleRenderer.ts` under the 200-line limit.

## Changes

**`src/game/renderers/battle/AttackEffects.ts`** (new)
- `AttackEffectState` interface: `flashTimeMs`, `shakeTimeMs`, `effectiveness`, `shakeOffset`
- `createAttackEffectState()` — factory returning idle state
- `triggerAttackEffect(state, effectiveness)` — arms a 150 ms flash + 200 ms shake
- `updateAttackEffect(state, dt)` — advances timers and computes sinusoidal `shakeOffset`
- `drawAttackFlash(ctx, x, y, w, h, state)` — overlays color-coded flash rectangle
- `resetAttackEffect(state)` — clears all state on new battle

**`src/game/renderers/BattleRenderer.ts`** (modified)
- Imports new AttackEffects helpers
- Tracks independent `enemyEffect` and `playerEffect` states
- `checkDamageEvents()` replaces the old `checkLevelUpEvents()` + now also handles LEVEL_UP in a single event-cursor pass (fixing a latent double-advance bug)
- Enemy sprite drawn at `88 + enemyEffect.shakeOffset`; player at `16 + playerEffect.shakeOffset`
- `drawAttackFlash` called after each sprite draw
- `reset()` clears both effect states
- Final line count: 188 (was 162)

**`src/game/__tests__/AttackEffects.test.ts`** (new)
- 18 Vitest tests covering `createAttackEffectState`, `triggerAttackEffect`, `updateAttackEffect`, `drawAttackFlash`, and `resetAttackEffect` — including boundary cases (dt > total duration, idle state no-ops, color correctness per effectiveness tier)

## Testing
- `npm test` — 236 tests pass (18 new), 0 failures
- `npm run typecheck` — 0 TypeScript errors
- `npm run lint` — 0 errors (1 pre-existing warning unrelated to this change)
