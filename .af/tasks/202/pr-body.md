## Summary

- Implemented complete Gen 1 battle engine as pure TypeScript sub-modules (zero DOM/canvas deps) covering damage formula, status effects, catch rate, EXP gain, and AI move selection
- Built full BattleRenderer with INTRO→SELECT_ACTION→SELECT_MOVE phases, animated HP bars, status badges, action/move menus with type-color pills and PP display
- Added TransitionRenderer (encounterFlash scanlines, fadeToBlack, badgeZoom/spin) and wired EncounterSystem to initialize real BattleState with playerPokemon
- 68 tests passing, zero TypeScript errors, all files ≤200 lines

## Files Created

| File | Purpose |
|------|---------|
| `src/game/systems/battle/DamageCalc.ts` | Gen 1 damage formula, STAB, TYPE_CHART, crit, stat stages |
| `src/game/systems/battle/StatusEffects.ts` | Paralysis/poison/burn/sleep/freeze logic |
| `src/game/systems/battle/CatchSystem.ts` | Gen 1 4-shake catch algorithm, ball bonuses |
| `src/game/systems/battle/ExpSystem.ts` | Wild EXP formula, all 4 EXP curves, level-up |
| `src/game/systems/battle/MoveSelection.ts` | Gen 1 random AI, PP tracking, Struggle |
| `src/game/systems/battle/BattleSystemCore.ts` | `processTurn()` pure function |
| `src/game/renderers/TransitionRenderer.ts` | encounterFlash, fadeToBlack, badgeZoom |
| `src/game/renderers/battle/PanelRenderer.ts` | Enemy/player info panels |
| `src/game/renderers/battle/MenuRenderer.ts` | Action menu, move menu, dialog text |
| `tests/damage-formula.test.ts` | Formula correctness, TYPE_CHART, crit, stat stages |
| `tests/battle-system.test.ts` | Paralysis boundary, poison/sleep/PP/level-up |
| `tests/catch-formula.test.ts` | Wobble count, ball bonuses, HP-based rates |

## Files Modified

| File | Change |
|------|--------|
| `src/game/types/BattleTypes.ts` | Added BattlePhase, PlayerAction, AIAction, ImmuneEvent, MissEvent; updated BattleState |
| `src/game/systems/BattleSystem.ts` | Full rewrite with action/move menu input handling |
| `src/game/systems/EncounterSystem.ts` | Real BattleState initialization (playerPokemon, battlePhase, sleepTurns) |
| `src/game/renderers/BattleRenderer.ts` | Full rewrite with phase-aware rendering and HP animation |

## Test plan

- [x] `npm run test` → 68 tests pass (9 test files)
- [x] `npx tsc --noEmit` → zero TypeScript errors
- [x] Damage formula verified: Bulbasaur Lv.5 Tackle vs Rattata Lv.3 in range [3,5]
- [x] Super effective Fire vs Grass = 2× multiplier confirmed
- [x] TYPE_CHART: Water vs Rock=2×, Water vs Ground=2×, Water vs Rock+Ground=4×
- [x] Immunity: Electric→Ground, Normal→Ghost, Fighting→Ghost all correctly 0×
- [x] Critical hit: ~2× damage ratio (1.8–2.2×)
- [x] Stat stage +1 Attack: ~1.5× damage ratio
- [x] Paralysis threshold: random=0.24 → moves; random=0.25 → paralyzed
- [x] Poison: 1/16 maxHp end-of-turn damage
- [x] Sleep: counter-based duration, wakes after turns exhausted
- [x] PP depletion: decrements on use; all PP=0 → Struggle
- [x] Level-up: MEDIUM_FAST Lv.4→5 threshold = 125 EXP
- [x] Rattata (catchRate=255) at 1HP with Pokeball → rate ≥ 200
- [x] Full HP + Pokeball → rate < 100
- [x] Wobble count = floor(catchRate/12), 4 wobbles = caught

🤖 Generated with [Claude Code](https://claude.com/claude-code)
