## Summary
- Implements the rival encounter that occurs after the player selects their starter Pokémon in Pallet Town's lab, triggering a trainer battle when the player walks north toward the exit.
- The rival's Pokémon is dynamically assigned as the type-counter to the player's starter (Bulbasaur → Charmander, Charmander → Squirtle, Squirtle → Bulbasaur) and is stored in state flags so it persists across saves.
- Fixes trainer battles system-wide by properly creating `BattleState` and showing pre-battle dialog in `TRAINER_BATTLE_INTRO`, previously trainer battles would instantly end without any actual battle UI.

## Changes

### `src/game/engine/ScriptHandler.ts`
- After starter selection in `handleStarterTable`'s `onChoice`, sets `state.flags['rivalStarterSpeciesId']` (counter-starter species ID) and `state.flags['rival_battle_pending'] = true`
- Adds `RIVAL_BATTLE_TRIGGER` case: checks `rival_battle_pending`, creates the rival Pokémon instance, shows the RIVAL_COUNTER_AFTER dialog, sets `rival_battle_pending = false` and `trainerBattleNpcId = 'rival'`

### `src/game/data/maps/pallet-town.json`
- Adds rival TrainerNPC at tile (10, 3) facing south with `activationFlag: "rival_battle_pending"`, LOS range 3, placeholder party, and pre/post-battle dialog

### `src/game/types/MapTypes.ts`
- Adds `activationFlag?: string` to `NPCDefinition` interface

### `src/game/systems/NPCSystem.ts`
- `loadFromMap`: respects `activationFlag` — if the referenced flag is falsy, the NPC is loaded as defeated (no LOS, no collision)
- `isCollision`: skips defeated NPCs so they no longer permanently block tile movement after a battle

### `src/game/engine/GamePhaseUpdater.ts`
- Adds `pendingTrainerBattle: boolean` to `PhaseUpdateCtx`
- Fixes `TRAINER_BATTLE_INTRO` handler: creates a proper `BattleState` from the TrainerNPC's party (reading `rivalStarterSpeciesId` flag for the rival), then shows `preBattleDialog` via the dialog system before transitioning to `TRANSITION`
- Fixes `DIALOG` handler: when `pendingTrainerBattle` is set, transitions to `TRANSITION` (battle) instead of `OVERWORLD` after dialog ends
- Adds blackout/respawn logic to trainer battle completion in `handleBattleDone` (previously only wild battles had this)

### `src/game/engine/GameEngine.ts`
- Initialises `pendingTrainerBattle: false` in `phaseCtx`

### `tests/rival-battle.test.ts`
- New test file with 25 tests covering: rival flag setting after starter selection, counter-starter species mapping, `RIVAL_BATTLE_TRIGGER` script behaviour, `activationFlag` NPC loading, collision bypass for defeated NPCs, and `pallet-town.json` rival NPC shape

## Testing
- `npm test`: 289 tests pass (0 failures)
- `npx tsc --noEmit`: no type errors
- `npm run lint`: no errors (1 pre-existing warning unrelated to this change)
- Rival NPC is inactive before starter selection, becomes active afterward, and is permanently deactivated after the battle (win or lose) via `trainer_defeated_rival` flag — survives map reload
