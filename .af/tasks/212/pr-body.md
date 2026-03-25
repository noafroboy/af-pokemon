## Summary
- Fixes a hardcoded badge index bug where both branches of a ternary returned `0`, preventing any future gym badge from being awarded to the correct slot.
- Adds canonical Gen-1 species data for Geodude (#74) and Onix (#95) — including Rock-type moves — so Brock's battle team is correct.
- Updates Brock's party in `pewter-gym.json` from Bulbasaur+Charmander to Geodude lv.12 + Onix lv.14.

## Changes

**`src/game/engine/GamePhaseUpdater.ts`**
- Exported `BADGE_INDEX_MAP: Record<string, number>` mapping all 8 Kanto badge names (BOULDER→0, CASCADE→1, THUNDER→2, RAINBOW→3, SOUL→4, MARSH→5, VOLCANO→6, EARTH→7) to their badge-array slot indices.
- Replaced `const badgeIndex = npcEntity.badgeReward === 'BOULDER' ? 0 : 0` with `BADGE_INDEX_MAP[npcEntity.badgeReward!] ?? 0`.

**`src/game/data/moves.ts`**
- Added Rock Throw (moveId 88): Rock type, physical, power 50, accuracy 90, pp 15. Required for Brock's Pokémon to use a Rock-type move in battle.

**`src/game/data/pokemon-data.ts`**
- Added Geodude (#74): Rock/Ground, base stats HP:40 Atk:80 Def:100 Spd:20 Spc:30, learnset Rock Throw (lv.1) + Harden (lv.11).
- Added Graveler (#75): stub entry required by Geodude's evolution chain.
- Added Onix (#95): Rock/Ground, base stats HP:35 Atk:45 Def:160 Spd:70 Spc:30, learnset Rock Throw (lv.1) + Rage (lv.9).

**`src/game/data/maps/pewter-gym.json`**
- Brock's party updated from `[{speciesId:1,level:12},{speciesId:4,level:14}]` to `[{speciesId:74,level:12},{speciesId:95,level:14}]`.

**`tests/badge-award.test.ts`** *(new)*
- 28 tests covering: all 8 badge name→index mappings, Geodude/Onix species data correctness, and Brock's party composition in pewter-gym.json.

## Testing
- Wrote `tests/badge-award.test.ts` with 28 new tests before implementing (TDD).
- Ran `npm test`: **264 tests pass** (236 pre-existing + 28 new), 0 failures.
- Ran `npm run typecheck`: **0 type errors**.
- All previously passing tests continue to pass.
