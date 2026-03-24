# Task 204 Plan: Dialog System, NPC/Trainer Battles, Gym, Onboarding + All Maps

## Assumption Audit

### Assumptions Made
1. **Warp JSON inconsistency**: Existing `pallet-town.json` uses `targetTileX`/`targetTileY` but the TypeScript `WarpDefinition` interface uses `targetX`/`targetY`. New maps will use `targetX`/`targetY` (matching the TS type). The pallet-town.json update step will also fix this existing bug.
2. **Species IDs**: Bulbasaur=1, Charmander=4, Squirtle=7, Geodude=74, Onix=95 (standard Gen 1 Pokédex order).
3. **TM34 = Body Slam** (Gen 1). Added to inventory on Brock defeat.
4. **Boulder Badge = badges[0]** (first slot in the 8-badge array).
5. **Name entry input**: Grid cells are navigated with arrow keys (not mouse click), confirmed with z/Enter. The game is keyboard-only.
6. **"TITLE" phase** is not yet in `GamePhase` enum — must be added.
7. **Trainer walk animation**: Full pixel-by-pixel walk (like Player.ts) is implemented for NPCs. Each NPC frame advances `walkPixelOffset` by 2px/frame; at 16px snaps to next tile. This matches the Player entity pattern.
8. **Badge ceremony**: Uses the existing `badgeZoom()` function in `TransitionRenderer.ts`. The engine drives `badgeCeremonyTimer` from 0→90 (1.5s at 60fps), normalized to 0→1 for `badgeZoom`.
9. **Blackout default**: If `lastPokemonCenter` is not yet set in flags, fall back to Pallet Town (tileX=7, tileY=5).
10. **Money halving on blackout**: `Math.floor(money / 2)` is deducted; minimum 0.
11. **Auto-save** triggers after: starter obtained, Nurse Joy heal, gym badge ceremony, and rival battle completion.
12. **`pewter-city` map** does not exist yet; pewter-gym.json warp uses `viridian-city` as the exit stand-in (as stated in task spec).
13. **Font**: `Press Start 2P` is referenced throughout the codebase. Assumed already loaded via CSS.

### What the Task Does NOT Specify (Defaults Chosen)
- **Sound effects** for text crawl: Not implemented (no AudioManager wiring in scope).
- **Animated trainer sprites**: Trainers use the same colored-rect fallback as NPCs (no sprite sheets).
- **Route-2 map**: Not created. Viridian City north warp shows a "ROAD CLOSED" dialog from the blocking NPC.
- **Oak's Lab as a separate interior map**: The task says "simplified: use script zone in pallet-town.json at that tile" — so no separate oak-interior.json is created.
- **Pokemon cries**: The task says "plays cry (via AudioManager)" but no AudioManager class exists yet. A stub/no-op is called; cry visually implies flash effect only.
- **PC Box screen**: The task mentions PC terminal at (12,2) in the Pokemon Center. A stub scriptZone is defined but the PC screen is not fully implemented (deferred to a future task).

### Risks & Open Questions
1. **GameEngine.ts is already 247 lines** (over the 200-line Iron Law limit). Strategy: extract all new logic to `OnboardingSystem.ts` and keep the GameEngine diff ≤60 lines.
2. **Trainer battle party cycling**: The current `BattleState` only tracks one `wildPokemon`. For multi-Pokemon trainers (Brock), the engine must detect faint events and swap in the next party Pokemon before continuing the battle.
3. **Script zone vs NPC interaction priority**: If both are active at the same position, NPC interaction (A-press) takes priority over script zones.
4. **Dialog choice callbacks contain GameState mutations**: The script factory receives a `GameState` reference at call time — scripts mutate `state.flags` directly. This is consistent with how `MenuSystem` mutates state.

---

## Approach Alternatives

### Approach A: Conservative
Extend the existing `GameState.dialogLines: string[]` / `dialogIndex: number` into a minimal dialog runner. NPCs are rendered directly from `map.npcs` data, no entity classes. Trainer battles are handled by a flag in `GameState`. Scripts are simple hardcoded if/else blocks in `OverworldSystem`.

- **Effort**: M
- **Risk**: Low
- **Trade-off**: Faster to implement but creates untestable god-methods in `OverworldSystem` and makes it impossible to extend (choices, name entry, LOS animations cannot be added cleanly). Violates Iron Law 3 (will push OverworldSystem far beyond 200 lines).

### Approach B: Ideal ✅ CHOSEN
Create proper system classes: `DialogSystem` (with renderer), `NPC`/`TrainerNPC` entity classes, `NPCSystem` manager, `OnboardingSystem` for new-game flow. Scripts are data-driven (array of `DialogPage` objects in a registry file). The engine delegates to these systems.

- **Effort**: L
- **Risk**: Medium
- **Trade-off**: Significantly more new files but each file is small and testable. Trainer LOS, name entry, walk animations, and choice menus all have clean homes. Long-term this is the only viable architecture for a growing game.

## Approach Decision
**Approach B** is chosen because:
1. The task specification explicitly lists `DialogSystem.ts`, `NPC.ts`, and `Trainer.ts` as files to create — the architecture is prescribed.
2. The 150-line file limit cannot be met with approach A once dialog rendering, NPC logic, and trainer LOS are all packed into OverworldSystem.
3. The 16 test scenarios require pure functions that are only possible with proper class separation.

---

## Production-Readiness Checklist

### 1. Persistence
All durable game state lives in `GameState.flags: Record<string, boolean | number | string>`, persisted to `localStorage` via the existing `SaveSystem` (`pokebrowser_save_v1`). Specifically:
- `flags.playerName` = entered name (e.g. `'ASH'`)
- `flags.rivalName` = entered rival name (e.g. `'GARY'`)
- `flags.TRAINER_[id]_DEFEATED` = `true` when trainer beaten
- `flags.badges` = `boolean[]` (8 elements)
- `flags.lastPokemonCenterMap` / `lastPokemonCenterX` / `lastPokemonCenterY` = blackout respawn
- `flags.money` = current money (synced on save)
- `flags.MOM_DIALOG_DONE`, `flags.STARTER_CHOSEN`, `flags.NEW_GAME_STARTED` = one-shot triggers
NPC defeated state is reconstructed from flags on every map load — no in-memory-only NPC state.

### 2. Error Handling
- **Map loading**: `GameEngine.loadMap()` already logs `console.warn` and falls back gracefully. New maps added to registry with same pattern.
- **Dialog scripts**: Pure data arrays — no IO, no errors possible.
- **NPCSystem.loadFromMap()**: Wraps NPC construction in try/catch; logs warning and skips malformed NPC definitions.
- **BattleSystem**: All battle logic is wrapped in `GameEngine.loop()` try/catch (already exists).
- **Badge ceremony**: Validates badge index 0-7; clamps and logs on out-of-range.
- **Blackout**: Defaults to safe position if `lastPokemonCenter` not set. Never soft-locks.

### 3. Input Validation
- **Name entry**: Maximum 7 characters enforced; only uppercase A-Z, 0-9, space allowed. Validated in `DialogSystem.addNameChar()`.
- **Rival name entry**: Same 7-char, uppercase-only validation.
- **Choice cursor**: Clamped to `[0, choices.length - 1]` in handleUp/handleDown.
- **All other input** goes through `InputManager` which already whitelists specific keys.
- No server-side validation needed (local browser game).

### 4. Loading States
- **Map transitions**: Existing fade-to-black transition (TRANSITION phase) already provides visual feedback.
- **Save operations**: Existing `renderSavingAnimation()` spinner plays during auto-save.
- **Badge ceremony**: `BADGE_CEREMONY` phase renders the `badgeZoom()` animation (1.5s) before returning to overworld.
- **Trainer intro**: `TRAINER_BATTLE_INTRO` phase renders exclamation bubble + walk animation (visually indicates something is happening before battle begins).

### 5. Empty States
- **No dialog**: `DialogSystem.isActive()` returns false; nothing rendered. Overworld resumes.
- **No party Pokémon**: Blackout triggers immediately after first battle loss. `'You blacked out!'` dialog shown before warp.
- **Empty badge case**: Existing `renderBadgeCase()` already handles `badges=[]` — shows 8 greyed circles.
- **Empty inventory**: `renderBagScreen()` already shows empty category states.

### 6. Security
N/A — This is a local browser game with no server, no API keys, no authentication, and no user-generated content sent externally. All data stays in `localStorage`.

### 7. Component Size (≤150 lines each)
Planned file sizes (estimated):
| File | Estimated Lines |
|------|----------------|
| `DialogSystem.ts` | ~130 |
| `DialogRenderer.ts` | ~130 |
| `NPC.ts` | ~140 |
| `Trainer.ts` | ~80 |
| `NPCSystem.ts` | ~130 |
| `OnboardingSystem.ts` | ~110 |
| `pallet-town-scripts.ts` | ~130 |
| `OverworldSystem.ts` (updated) | ~155 |
| `GameEngine.ts` delta | ~+55 lines |

`GameEngine.ts` is already at 247 lines (pre-existing violation). The delta is kept ≤60 lines by delegating all new logic to `OnboardingSystem`, `NPCSystem`, and `DialogSystem`. A note is left for future cleanup.

### 8. Test Coverage
Tests cover:
- **Happy path**: Dialog text crawl works, page advance, choice selection, name entry
- **Error/edge cases**: Choice cursor wraps, name entry respects max length, defeated trainer doesn't re-trigger, LOS blocked at >3 tiles
- **Dialog system lifecycle**: `isActive()` true during dialog, false after completion, `onComplete` fires once
- **Trainer data**: `buildTrainerParty` creates correct species/level, `RIVAL_COUNTER` mapping correct

---

## Step-by-Step Implementation Plan

### Phase 1 — Type Foundations
**Step 1**: `src/game/types/GameState.ts`
- Add `TITLE`, `TRAINER_BATTLE_INTRO`, `BADGE_CEREMONY` to `GamePhase` enum
- Add to `GameState`:
  - `dialogState: DialogState | null` (the active dialog, replaces simple `dialogLines`)
  - `trainerBattleNpcId: string | null` (which trainer NPC triggered the battle)
  - `badgeCeremonyTimer: number` (0-90 frames for badge zoom)
  - `badgeCeremonyIndex: number` (which badge, 0-7)
- Keep existing `dialogLines`/`dialogIndex` for backwards compat (MenuSystem uses them)

**Step 2**: `src/game/types/MapTypes.ts`
- Extend `NPCDefinition` with optional trainer fields: `isTrainer?`, `trainerId?`, `party?`, `moneyBase?`, `losRange?`, `preBattleDialog?`, `postBattleDialog?`, `badgeReward?`, `tmReward?`
- Add `autoTrigger?: boolean` to `ScriptZone` (for zones that fire when player steps on them, not on A-press)

### Phase 2 — Dialog Engine
**Step 3**: `src/game/systems/DialogSystem.ts`
```
DialogPage = { text: string; choices?: { label: string; onSelect: () => void }[] }
DialogSpeed = SLOW(50ms) | NORMAL(30ms) | FAST(10ms)

Class DialogSystem:
  - pages: DialogPage[], currentPage, charIndex, charTimer, speed
  - choiceCursor
  - onComplete callback
  - nameEntryMode, currentName, maxNameLen, nameEntryCursor {row, col}

  startDialog(pages, onComplete?): void
  update(dt: number): void  // advances charIndex
  handleConfirm(): void     // advance page / select choice / confirm name char
  handleUp/Down(): void
  isActive(): boolean
  isPageComplete(): boolean
  getCurrentText(): string
  isNameEntry(): boolean
  startNameEntry(maxLen, onDone): void
  addNameChar(c): void
  deleteNameChar(): void
  confirmNameEntry(): void
  getChoices(): DialogPage['choices']
```

**Step 4**: `src/game/renderers/DialogRenderer.ts`
- `renderDialog(ctx, system)`: bottom-48px box (160×48 at y=96), 2px border, 4px padding, 2-line text window, blinking ▼ cursor when page complete, choice list with ► cursor
- `renderNameEntry(ctx, system)`: full-screen overlay, name display box at top showing typed chars, uppercase grid (A-Z row 1, 0-9 row 2, DEL/END/SPACE row 3), selected cell highlighted yellow

### Phase 3 — NPC Entities
**Step 5**: `src/game/entities/NPC.ts`
```
Direction = 'north'|'south'|'east'|'west'
ApproachPhase = 'IDLE'|'EXCLAIM'|'WALK'|'TRIGGER'

Class NPC:
  tileX, tileY, facing: Direction
  spriteId: number
  dialogPages: string[]    // simple string[] from map JSON
  dialogScriptId: string   // key into PALLET_SCRIPTS registry
  defeated: boolean
  id: string

Class TrainerNPC extends NPC:
  party: { speciesId, level }[]
  moneyReward: number
  trainerId: string
  losRange: number = 3
  preBattleDialog: string[]
  postBattleDialog: string[]
  badgeReward: string | null
  tmReward: number | null

  // approach animation state
  approachPhase: ApproachPhase = 'IDLE'
  exclaimFrames: number = 0
  walkPixelOffset: number = 0
  walkDir: Direction | null = null
  walkTarget: { tileX, tileY } | null = null

  checkLOS(playerTileX, playerTileY, map): boolean
  update(dt, player): ApproachPhase  // returns current phase
```

**Step 6**: `src/game/entities/Trainer.ts`
```typescript
interface TrainerPartySlot { speciesId: number; level: number }
interface TrainerDefinition {
  id: string
  name: string
  spriteId: number
  party: TrainerPartySlot[]
  moneyBase: number
  preBattleDialog: string[]
  postBattleDialog: string[]
  badgeReward?: string
  tmReward?: number
}
interface GymLeaderDefinition extends TrainerDefinition {
  gymLeaderName: string
  badgeId: string
}

function buildTrainerParty(def: TrainerDefinition, ot?: string): PokemonInstance[]
```

### Phase 4 — NPC Runtime Management
**Step 7**: `src/game/systems/NPCSystem.ts`
```
Class NPCSystem:
  npcs: NPC[]

  loadFromMap(map: GameMap, state: GameState): void
    // instantiate NPC or TrainerNPC from each NPCDefinition
    // restore defeated state from state.flags['TRAINER_[id]_DEFEATED']

  update(dt, player, map): NPCUpdateResult
    // NPCUpdateResult = {type:'NONE'} | {type:'TRAINER_LOS', npc: TrainerNPC} | {type:'TRAINER_WALK_DONE', npc: TrainerNPC}
    // Checks LOS for all TrainerNPC instances that are IDLE+not defeated
    // Advances approach animation for EXCLAIM/WALK phases

  handleInteraction(player): NPC | null
    // Returns NPC if player facing direction aligns with adjacent NPC and A pressed

  checkScriptZone(player, map): ScriptZone | null
    // Returns matching script zone if player stepped on autoTrigger zone

  isNPCBlocking(tileX, tileY): boolean
    // For collision detection

  getNPCs(): NPC[]
```

### Phase 5 — Scripts
**Step 8**: `src/game/data/scripts/pallet-town-scripts.ts`
```typescript
// Factory: all scripts receive GameState by reference (mutations go to flags)
export function makeOakIntro(state: GameState): DialogPage[]
  // 3 pages: "Hello there! I am Prof. Oak...", "This world is inhabited...", "Now tell me. What is your name?"

export function makeMomDialog(): DialogPage[]
  // "It's your dream, isn't it? To be a Pokemon master!"

export function makeStarterTableTrigger(state: GameState): DialogPage[]
  // Choices: [BULBASAUR] [CHARMANDER] [SQUIRTLE]
  // onSelect → sets state.flags.STARTER_CHOSEN = speciesId, triggers STARTER_OBTAINED

export function makeStarterObtained(state: GameState, speciesId: number): DialogPage[]
  // "[POKEMON] was obtained!" + rival reaction + rival takes counter-type

export function makeNurseJoyHeal(state: GameState): DialogPage[]
  // "Shall I restore your Pokemon? YES/NO"
  // YES → heal all party, auto-save

export const RIVAL_COUNTER: Record<number, number> = {
  1: 4,   // Bulbasaur → Rival gets Charmander
  4: 7,   // Charmander → Rival gets Squirtle
  7: 1,   // Squirtle → Rival gets Bulbasaur
}

export const BADGE_NAMES = ['BOULDER','CASCADE','THUNDER','RAINBOW','SOUL','MARSH','VOLCANO','EARTH']
```

### Phase 6 — Map Data
**Step 9**: `src/game/data/maps/viridian-city.json`
- 30×30 tiles (tileSize: 16)
- Layout: border tiles (4) around edges, path tiles (2) through center, 4 building footprints (tiles 5/6)
- Pokemon Center building with warp at entrance
- Pokemart building with warp at entrance
- 2 trainer NPCs: Youngster (tileX=8, tileY=15, facing south, Rattata Lv3), Lass (tileX=20, tileY=10, facing south, Pidgey Lv5)
- Warps: `[{tileX:15, tileY:29, targetMap:"route-1", targetX:15, targetY:1, direction:"south"}, {tileX:10, tileY:8, targetMap:"pokemon-center", targetX:7, targetY:8, direction:"north"}, {tileX:14, tileY:0, targetMap:"route-2-blocked", targetX:7, targetY:7, direction:"north"}]`
- Music: "viridian"

**Step 10**: `src/game/data/maps/pokemon-center.json`
- 15×10 tiles
- Floor tile (2) everywhere, counter tiles (5) at y=2-3, walls (4) at border
- NPCs: Nurse Joy at (7,3), facing south, dialogScriptId: "NURSE_JOY_HEAL", isTrainer: false
- scriptZones: `[{id:"NURSE_JOY_HEAL", tileX:6, tileY:4, width:3, height:1, scriptId:"NURSE_JOY_HEAL", triggerOnce:false, autoTrigger:false}, {id:"PC_TERMINAL", tileX:12, tileY:3, width:1, height:1, scriptId:"PC_BOX", triggerOnce:false, autoTrigger:false}]`
- Warps: `[{tileX:7, tileY:9, targetMap:"viridian-city", targetX:10, targetY:9, direction:"south"}]`
- Music: "pokemoncenter"

**Step 11**: `src/game/data/maps/pewter-gym.json`
- 15×15 tiles
- Checkerboard floor (tiles 2 and 8 alternating)
- Trainer NPC: Youngster at (7,8), facing south, trainerId:"GYM_GRUNT_1", party:[{speciesId:74, level:10}]
- Brock NPC: (7,2), facing south, trainerId:"BROCK", party:[{speciesId:74, level:12},{speciesId:95, level:14}], badgeReward:"BOULDER", tmReward:34
- Warp: `[{tileX:7, tileY:14, targetMap:"viridian-city", targetX:12, targetY:15, direction:"south"}]`
- Music: "gym"

### Phase 7 — System Updates
**Step 12**: `src/game/systems/OverworldSystem.ts` updates
- Add `npcSystem: NPCSystem` parameter to constructor (or inject via setter)
- In `update()`: call `npcSystem.update()` and return `{type:'TRAINER_LOS', npc}` if triggered
- Add A-press NPC interaction: if player pressed z/Enter while facing an NPC adjacently, return `{type:'NPC_INTERACT', npc}`
- Add `isNPCBlocking()` call in `tryMove()` collision check
- Add `checkScriptZone()` after tile movement completes
- Extend `OverworldResult` union type with new cases

**Step 13**: `src/game/engine/OnboardingSystem.ts`
- `isNewGame(state)`: returns true if `!state.flags.NEW_GAME_STARTED`
- `renderTitle(ctx, frame)`: draws 'POKÉBROWSER' and blinking 'PRESS ENTER' text on black canvas
- `handleTitleInput(input, state, dialogSystem)`: on Enter press → start OAK_INTRO dialog, set phase DIALOG
- `handleNameEntryDone(nameType, name, state)`: stores playerName or rivalName in flags, returns next step
- `onboardingComplete(state)`: sets NEW_GAME_STARTED=true, positions player at (7,17) on pallet-town, triggers MOM_DIALOG

**Step 14**: `src/game/engine/GameEngine.ts` updates (delta only)
```
New members:
  dialogSystem: DialogSystem
  npcSystem: NPCSystem
  onboardingSystem: OnboardingSystem

loadMap() update:
  + add viridian-city, pokemon-center, pewter-gym to map registry
  + call npcSystem.loadFromMap() on map load

update() additions:
  + TITLE phase → onboardingSystem.handleTitleInput()
  + DIALOG phase → dialogSystem.update(dt) + input handling (z→handleConfirm, up/down→cursor)
  + TRAINER_BATTLE_INTRO phase → drive NPC walk animation, transition to BATTLE when walk done
  + BADGE_CEREMONY phase → increment badgeCeremonyTimer, at 90 → set badge flag, addItem TM34, phase→OVERWORLD
  + Overworld result 'TRAINER_LOS' → set phase=TRAINER_BATTLE_INTRO
  + Overworld result 'NPC_INTERACT' → start NPC dialog → set phase=DIALOG
  + Battle end check: if all party fainted → BLACKOUT flow
  + Pokemon Center map entry → update lastPokemonCenter in flags

render() additions:
  + TITLE phase → onboardingSystem.renderTitle()
  + DIALOG phase → renderOverworld then renderDialog() on top
  + BADGE_CEREMONY phase → renderBadgeZoom()
```

**Step 15**: `src/game/renderers/OverworldRenderer.ts` updates
- `render()` accepts optional `npcs: NPC[]` parameter
- `drawNPCs()` uses NPC instance array instead of `map.npcs`
- Adds `drawExclaimBubble(ctx, npc, camera)` for yellow '!' sprite above trainer
- Renders defeated trainer with flipped facing

**Step 16**: `src/game/data/maps/pallet-town.json` updates
- Fix `targetTileX`→`targetX`, `targetTileY`→`targetY` in warp
- Add `scriptZones`: MOM_DIALOG (7,17, 1×1, autoTrigger:true, triggerOnce:true), STARTER_TABLE_TRIGGER (6,3, 3×3, autoTrigger:true, triggerOnce:false)
- Update Oak NPC `dialogScriptId: "OAK_INTRO"` (add field to NPC definition)

### Phase 8 — Tests
**Step 17**: `tests/dialog-system.test.ts` (~80 lines)
**Step 18**: `tests/npc-trainer.test.ts` (~80 lines)

---

## File Size Summary

| File | Lines (est.) | Status |
|------|-------------|--------|
| `DialogSystem.ts` | ~130 | NEW |
| `DialogRenderer.ts` | ~130 | NEW |
| `NPC.ts` | ~140 | NEW |
| `Trainer.ts` | ~80 | NEW |
| `NPCSystem.ts` | ~130 | NEW |
| `OnboardingSystem.ts` | ~110 | NEW |
| `pallet-town-scripts.ts` | ~130 | NEW |
| `viridian-city.json` | data | NEW |
| `pokemon-center.json` | data | NEW |
| `pewter-gym.json` | data | NEW |
| `GameState.ts` | ~120 | MODIFY (+25) |
| `MapTypes.ts` | ~90 | MODIFY (+30) |
| `OverworldSystem.ts` | ~155 | MODIFY (+28) |
| `GameEngine.ts` | ~305 | MODIFY (+58) ⚠️ |
| `OverworldRenderer.ts` | ~175 | MODIFY (+26) |
| `tests/dialog-system.test.ts` | ~90 | NEW |
| `tests/npc-trainer.test.ts` | ~90 | NEW |

> ⚠️ `GameEngine.ts` starts at 247 lines and will reach ~305 with changes. This remains above the 150-line target but the delta is kept minimal. A follow-up task should extract the engine into sub-controllers. All **new** files are under 150 lines.

---

## Dependency Graph

```
DialogPage (MapTypes) ← pallet-town-scripts.ts
                      ← DialogSystem.ts
DialogSystem.ts ← DialogRenderer.ts
NPC.ts ← NPCSystem.ts ← OverworldSystem.ts
Trainer.ts ← NPC.ts (TrainerNPC)
           ← pallet-town-scripts.ts (party building)
NPCSystem.ts ← GameEngine.ts
DialogSystem.ts ← GameEngine.ts
OnboardingSystem.ts ← GameEngine.ts
pallet-town-scripts.ts ← GameEngine.ts (script registry)
New maps ← GameEngine.loadMap() registry
```

## Integration Test Scenarios (manual verification)
1. New game → title screen → Enter → Oak 3-page dialog → name entry → rival name → Pallet Town fade-in
2. Walk to script zone → Choose Charmander → 'CHARMANDER was obtained!' → rival takes Squirtle → rival battle
3. Viridian City → walk into Youngster's LOS → '!' → walk → battle with Rattata Lv3
4. Viridian City → Pokemon Center → talk to Nurse Joy → YES → party healed → auto-save
5. Pewter Gym → Brock → battle (2 Pokemon) → badge ceremony → Boulder Badge in case → TM34 in bag
6. Lose all battles → 'You blacked out!' → fade to Pokemon Center → healed → half money lost
7. Re-enter Viridian City after defeating trainer → trainer faces away → post-defeat dialog shown
8. Pallet Town ↔ Route 1 ↔ Viridian City warps → player repositioned correctly
