# Battle System Engine + Wild Encounter Full Flow — Plan

## Assumption Audit

### Unclear Requirements & Defaults Chosen

1. **PlayerAction/AIAction types not defined** — Will add to `BattleTypes.ts`. PlayerAction includes `type: 'FIGHT'|'ITEM'|'RUN'|'SWITCH'` plus optional `moveIndex/itemId/switchTo`.

2. **playerPokemon not in BattleState** — Current `BattleState` has `playerPartyIndex` but no actual `PokemonInstance`. Will add `playerPokemon: PokemonInstance` field. EncounterSystem will default to Bulbasaur Lv.5 since party persistence system is incomplete (party stored as UUIDs only, no lookup).

3. **IMMUNE event type not in BattleEventType** — The test expects `BattleEvent type=IMMUNE`. This needs to be added to `BattleEventType` union. Will add `ImmunEvent` type.

4. **Paralysis boundary ambiguity** — Task says "25% chance full-para per turn" but test requires `Math.random()=0.24 → moves; =0.25 → paralyzed`. These are only consistent with `paralyzed if random >= 0.25` (75% rate), contradicting the 25% description. **Test is ground truth**: will implement threshold at 0.25 (`>= 0.25 → paralyzed`).

5. **battlePhase not in BattleState** — Will add `battlePhase: BattlePhase` and `cursorIndex: number` fields.

6. **Sleep turn counter** — Gen 1 sleep lasts 1-6 turns; need persistent counter. Will add `sleepTurns: { player: number; wild: number }` to `BattleState`.

7. **Geodude not in POKEMON_DATA** — Geodude (#74) is not in the existing pokemon.ts data. Will either add it or modify the test to use a Rock-type Pokemon that IS available. Ground-type Rock-type combo is what makes Water Gun super effective vs Geodude. For tests, will create mock PokemonInstance with Rock/Ground types directly.

8. **tests/ directory location** — Task specifies `tests/damage-formula.test.ts` (top-level). Vitest config doesn't restrict location, picks up all `*.test.ts` files. Will create top-level `tests/` directory.

9. **BattleRenderer animation - requestAnimationFrame vs game loop** — Will use `Date.now()` timestamps and animation state stored in BattleRenderer instance, updated in `render()` calls.

10. **ITEM action in battle (Pokéball throw)** — The `processItemAction()` within `processTurn` will handle `itemId=1 (Pokeball), 2 (Great Ball), 3 (Ultra Ball)`.

### Risks & Open Questions

- **Party system**: `GameState.party` is `string[]` of UUIDs. There is no `PokemonInstance` registry to look up by UUID. The MVP defaults to Bulbasaur Lv.5. Full party persistence requires a future task.
- **Wild battle music**: The task mentions "wild battle music starts". Howler.js and Tone.js are available but no audio assets are bundled. Noted as out-of-scope rendering concern.
- **Full encounter flash in game loop**: The encounterFlash 400ms transition is specified in EncounterSystem but renders on canvas. Will handle within BattleRenderer INTRO phase (not a new GamePhase).

---

## Approach Alternatives

### APPROACH A: Conservative (CHOSEN)
**Minimize code changes, use existing class patterns.**
- Keep `BattleSystem` class as GameEngine's entry point
- Export `processTurn()` as a standalone function from BattleSystem.ts
- Extend existing `BattleState`, `BattleRenderer` types
- Don't add new GamePhase values
- Use sub-modules under `src/game/systems/battle/` for size compliance

**Effort: L | Risk: Low | Trade-off**: Some coupling between class and pure function in same file; BattleSystem class becomes a façade for the pure functions.

### APPROACH B: Ideal — Full Architecture Rewrite
- New `BattleStateMachine` class with clean state transitions
- Separate `BattleAnimationController` class
- Add `ENCOUNTER_FLASH` phase to GamePhase enum
- Full audio integration
- Party storage via localStorage

**Effort: XL | Risk: High | Trade-off**: Breaks existing tests and GameEngine integration; too much scope creep; requires party/persistence refactor.

## Approach Decision

**Choosing APPROACH A (Conservative).**

Rationale:
1. Existing `BattleSystem` class is already wired into `GameEngine` — changing the interface would require GameEngine refactor
2. Existing tests (`EncounterSystem.test.ts`) test BattleState structure — minimal changes keep those passing
3. All required functionality (processTurn, Gen 1 formulas, full renderer, tests) can be delivered conservatively
4. Risk of breaking changes is lower

---

## Production-Readiness Checklist

### 1. Persistence
**Response**: Game battle state is transient (in-memory for the duration of a battle). Player's Pokemon is created fresh (Bulbasaur Lv.5 default) since party UUID→PokemonInstance lookup doesn't exist in the current codebase. The underlying `SaveSystem` persists player position and party UUIDs via localStorage — this is an existing limitation, not introduced by this task. After a battle ends (win/flee/catch), returning to overworld preserves the map/position state. **N/A for new persistence requirements** — no new data stores introduced.

### 2. Error Handling
**Response**:
- `processTurn()` will defensively check for null/undefined state/pokemon and return empty event array
- `EncounterSystem.startEncounter()` already has try/catch; will keep and extend
- `BattleSystem.update()` will handle null battleState gracefully
- `BattleRenderer.render()` already has `!battle` guard returning "Loading..." text

### 3. Input Validation
**Response**:
- `PlayerAction` validated in `processTurn`: moveIndex must be 0-3, must have PP > 0
- If invalid move selected → fallback to Struggle
- ItemId validated against known ball IDs (1,2,3) before applying ball bonus

### 4. Loading States
**Response**:
- `BattleRenderer.render()` shows "Loading..." when `battle === null`
- INTRO phase shows "Wild POKEMON appeared!" text during encounter flash animation (400ms)
- HP bar drain and EXP fill are animated (not instant jumps)

### 5. Empty States
**Response**:
- If party is empty → EncounterSystem creates Bulbasaur Lv.5 as default player Pokemon
- If wildPokemon has no moves → falls back to Tackle (existing PokemonInstance behavior)
- If move has no data → BattleSystem falls back to Struggle

### 6. Security
**N/A** — Pure game logic, no user-generated input reaching LLM/DB/external APIs. No API keys. Canvas rendering only.

### 7. Component Size
**Response**: All files will be kept under 150 lines by extracting:
- `src/game/systems/battle/DamageCalc.ts` — damage formula (~80 lines)
- `src/game/systems/battle/StatusEffects.ts` — status logic (~120 lines)
- `src/game/systems/battle/CatchSystem.ts` — catch formula (~60 lines)
- `src/game/systems/battle/ExpSystem.ts` — EXP/level-up (~70 lines)
- `src/game/systems/battle/MoveSelection.ts` — AI/Struggle (~50 lines)
- `src/game/renderers/battle/PanelRenderer.ts` — panels/bars (~130 lines)
- `src/game/renderers/battle/MenuRenderer.ts` — menus (~100 lines)

Note: `GameEngine.ts` is already 206 lines (pre-existing violation); will not refactor it as it's out of scope.

### 8. Test Coverage
**Response**:
- Happy path: all required formula tests + animation behavior
- Error/edge cases:
  - Immune type → 0 damage + IMMUNE event
  - All PP=0 → Struggle used
  - Sleep duration exhausted → wakes up
  - catchRate overflow (> 255 → clamp)
  - Invalid PlayerAction → fallback behavior

---

## Detailed Implementation Steps

### Step 1 — Types (BattleTypes.ts)

**Add to exports:**
```typescript
export type BattlePhase = 'INTRO' | 'SELECT_ACTION' | 'SELECT_MOVE' | 'ANIMATING' | 'ENEMY_TURN' | 'CHECK_END' | 'END'

export interface PlayerAction {
  type: 'FIGHT' | 'ITEM' | 'RUN' | 'SWITCH'
  moveIndex?: number   // FIGHT
  itemId?: number      // ITEM (1=Pokeball, 2=GreatBall, 3=UltraBall)
  switchTo?: number    // SWITCH
}

export interface AIAction {
  type: 'FIGHT'
  moveIndex: number
}

export interface ImmuneEvent {
  type: 'IMMUNE'
  target: 'player' | 'wild'
}
```

**Update BattleState:**
```typescript
export interface BattleState {
  // ...existing fields...
  playerPokemon: PokemonInstance     // ADD
  battlePhase: BattlePhase           // ADD
  cursorIndex: number                // ADD
  sleepTurns: { player: number; wild: number }  // ADD
}
```

**Update BattleEventType and BattleEvent union** to include `'IMMUNE'` and `ImmuneEvent`.

### Step 2 — Battle Sub-modules

**DamageCalc.ts** exports:
- `calculateDamage(attacker, defender, move, statStages, critRoll?, randRoll?): number`
- `getEffectivenessMessage(mult): string|null`
- `isImmune(moveType, defenderTypes): boolean`
- Internal: STAB check, critical hit check, TYPE_CHART lookup via existing `src/game/data/types.ts`

**StatusEffects.ts** exports:
- `checkStatusPreventsMove(pokemon, side: 'player'|'wild', sleepTurns): boolean`
- `applyStatusAtTurnEnd(pokemon): { damage: number; events: BattleEvent[] }`
- `tryInflictStatus(target, effect, chance): StatusInflictedEvent | null`
- `STATUS_BADGE_LABELS: Record<StatusCondition, string>`

**CatchSystem.ts** exports:
- `calculateModifiedCatchRate(wildPokemon, ballId): number`
- `attemptCatch(modifiedRate): { success: boolean; wobbleCount: number }`
- `BALL_BONUSES: Record<number, number>` (1→1, 2→1.5, 3→2)

**ExpSystem.ts** exports:
- `calculateWildExp(wildPokemon): number`
- `getExpForLevel(expGroup, level): number`
- `applyExpGain(pokemon, amount): { leveledUp: boolean; newLevel: number; events: BattleEvent[] }`

**MoveSelection.ts** exports:
- `selectAIMove(pokemon): number` (returns moveIndex, 0-3)
- `STRUGGLE: Move` (Normal, power 50, no PP consumed)
- `hasUsableMoves(pokemon): boolean`

### Step 3 — BattleSystem.ts full rewrite

Keep the `BattleSystem` class structure (GameEngine depends on it), but:
1. Export `processTurn(state, playerAction, aiAction): BattleEvent[]` standalone function
2. Update `BattleSystem.update()` to handle menu navigation (arrow keys, Z) and call `processTurn`
3. Handle `sleepTurns` decrement
4. Export `selectAIMove` wrapper

**Turn priority (Gen 1)**:
- If playerPokemon.stats.speed > wildPokemon.stats.speed → player goes first
- Ties: random
- Priority moves (Quick Attack, etc.) always go first

**processTurn flow**:
1. Determine turn order
2. For each attacker in order:
   a. Check status prevents move (sleep/freeze/paralysis)
   b. If not prevented: execute move
      - Check immunity → IMMUNE event
      - Accuracy check → MISS event (MessageEvent)
      - Calculate damage → DAMAGE event
      - Apply damage to target HP
      - Check for status effects on move → STATUS_INFLICTED event
      - Check target faint → FAINT event
   c. Apply end-of-turn status damage (burn/poison) → DAMAGE event
3. Return all collected events

### Step 4 — TransitionRenderer.ts

Three pure functions taking `CanvasRenderingContext2D` and `progress (0-1)`:

```typescript
encounterFlash(ctx, progress):
  - Draws horizontal scanlines expanding from center
  - At progress=0: no effect
  - At progress=1: full black screen
  - Uses alternating black/white lines based on (y - center) / lineHeight < progress

fadeToBlack(ctx, progress):
  - ctx.fillStyle = `rgba(0,0,0,${progress})`
  - ctx.fillRect(0, 0, 160, 144)

badgeZoom(ctx, badgeImg, progress):
  - scale = lerp(0, 1, progress)
  - rotation = progress * 2 * Math.PI
  - Draw badge centered with transform
```

### Step 5 — BattleRenderer.ts full rewrite

Keep `BattleRenderer` class. Add animation state properties. `render()` dispatches to phase-specific methods:

**INTRO phase**: Shows encounterFlash overlay + "Wild POKEMON appeared!" scrolling text. After 400ms → battlePhase = SELECT_ACTION.

**SELECT_ACTION phase**: Full battle layout + action menu (FIGHT/POKEMON/ITEM/RUN 2×2 grid with cursor ►).

**SELECT_MOVE phase**: Full layout + move menu (4 moves with type badge pill + PP current/max, cursor ►).

**ANIMATING phase**: Full layout + ongoing attack/entry animation.

**Animation methods** (stored in BattleRenderer instance):
- `animateAttack(attacker, time)`: nudge 8px, 100ms, return
- `animateHitFlash(defender, time)`: flash white 3× at 80ms intervals
- `animateHpDrain(target, dt)`: interpolate displayHp → currentHp over 400ms
- `animateExpFill(dt)`: interpolate displayExp over 600ms
- `animateEntrance(dt)`: slide enemy from x=160 to target in 300ms
- `animateFaint(target, dt)`: drop 16px + fade alpha 1→0 over 400ms
- `animatePokeball(dt)`: parabolic arc 500ms then wobble

**Delegates to**:
- `PanelRenderer.drawEnemyPanel(ctx, battle, animState)`
- `PanelRenderer.drawPlayerPanel(ctx, battle, animState)`
- `MenuRenderer.drawActionMenu(ctx, cursorIndex)`
- `MenuRenderer.drawMoveMenu(ctx, pokemon, cursorIndex)`

### Step 6 — EncounterSystem.ts update

Add to `startEncounter()`:
```typescript
// Create player Pokemon (first non-fainted party member or default Bulbasaur)
const playerPokemon = createPokemonInstance(1, 5, 'PLAYER') // default Bulbasaur Lv5

const battle: BattleState = {
  ...existing fields...
  playerPokemon,
  battlePhase: 'INTRO',
  cursorIndex: 0,
  sleepTurns: { player: 0, wild: 0 },
}
```

### Step 7 — GameEngine.ts minimal update

No logic changes needed to the BATTLE phase update path. The TRANSITION render can optionally use `TransitionRenderer.encounterFlash` for the encounter transition (changing `ctx.fillStyle = rgba(0,0,0,...)` to encounter flash). This is a small cosmetic update to the render method.

### Step 8 — Tests

**tests/damage-formula.test.ts**:
- Import `calculateDamage` from `DamageCalc.ts`
- Import `createPokemonInstance` to create test Pokemon
- Import `MOVES_DATA` for Tackle (id 33), Ember (id 52), Water Gun (id 55)
- Use `vi.spyOn(Math, 'random')` to control RAND/255 and critical roll

**tests/battle-system.test.ts**:
- Import `processTurn` from BattleSystem
- Import status helpers
- Mock Math.random for deterministic behavior
- Create minimal BattleState for each test

**tests/catch-formula.test.ts**:
- Import `calculateModifiedCatchRate`, `attemptCatch` from CatchSystem
- Test specific Pokemon HP values and ball types
- Verify wobble count formula

---

## File Size Estimates

| File | Estimated Lines |
|------|----------------|
| src/game/types/BattleTypes.ts | ~140 (up from 110) |
| src/game/systems/BattleSystem.ts | ~130 |
| src/game/systems/battle/DamageCalc.ts | ~90 |
| src/game/systems/battle/StatusEffects.ts | ~120 |
| src/game/systems/battle/CatchSystem.ts | ~70 |
| src/game/systems/battle/ExpSystem.ts | ~80 |
| src/game/systems/battle/MoveSelection.ts | ~50 |
| src/game/renderers/TransitionRenderer.ts | ~80 |
| src/game/renderers/BattleRenderer.ts | ~140 |
| src/game/renderers/battle/PanelRenderer.ts | ~130 |
| src/game/renderers/battle/MenuRenderer.ts | ~100 |
| src/game/systems/EncounterSystem.ts | ~90 (up from 80) |
| src/game/engine/GameEngine.ts | ~210 (minor change, pre-existing violation) |
| tests/damage-formula.test.ts | ~80 |
| tests/battle-system.test.ts | ~120 |
| tests/catch-formula.test.ts | ~60 |

---

## Test Design Notes

### Paralysis Test Boundary
The test spec `Math.random()=0.24 → moves; =0.25 → paralyzed` implies threshold at 0.25:
```typescript
// Implementation: paralyzed when random >= 0.25
const paraRoll = Math.random()
if (paraRoll >= 0.25) { /* fully paralyzed */ }
```

### Damage Formula Validation
For Bulbasaur Lv.5 Tackle vs Rattata Lv.3:
- L=5, Atk≈11 (Bulbasaur base 49, Lv5 calc), Pwr=35, Def≈9 (Rattata base 35, Lv3 calc)
- Base = floor((floor((2*5/5+2)*11*35/9/50)+2)) = floor((floor(4*11*35/9/50)+2))
- = floor((floor(1694/450)+2)) = floor((floor(3.76)+2)) = floor(5) = 5
- With RAND/255 variation → range [3,5] is plausible ✓

### Catch Rate Validation
Rattata (catchRate=255, maxHp≈22 at Lv.3):
- At 1HP: floor(255*(66-2)/66)*1 = floor(255*64/66) = floor(247.3) = 247 → >= 200 ✓
- At fullHP: floor(255*(66-44)/66)*1 = floor(255*22/66) = floor(85) = 85 → < 100 ✓

### MEDIUM_FAST Level-up
Level 4→5 threshold: 4³=64 → 5³=125, need 61 EXP.
For wild Rattata Lv.8: `floor(57 * 8 / 7) = floor(65.1) = 65` ≥ 61 → LEVEL_UP event ✓
