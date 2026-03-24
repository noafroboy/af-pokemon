# [AF #204] Dialog System, NPC/Trainer Battles, Gym & Onboarding

## Summary

- **DialogSystem**: Text-crawl state machine with SLOW/NORMAL/FAST speeds, page advance, choice cursor, and name-entry sub-mode. Keeps under 200 lines.
- **DialogRenderer**: Bottom 48px box with 2-line text reveal, blinking cursor, choice pop-up, and full-screen name-entry keyboard UI.
- **NPC / TrainerNPC entities**: Base NPC with facing/dialog/defeated state. TrainerNPC adds LOS cone detection (3-tile default), approach phases (EXCLAIM → WALK → DONE), exclamation bubble rendering, money/badge reward fields.
- **Trainer.ts**: `TrainerDefinition` and `GymLeaderDefinition` interfaces, `buildTrainerParty` / `buildPartyFromEntries` factories.
- **NPCSystem**: Loads NPCs from map definitions, runs per-frame LOS checks, handles A-press interaction dispatch, script-zone detection, and NPC-as-collision.
- **OnboardingSystem**: TITLE screen with blinking PRESS ENTER, orchestrates OAK_INTRO dialog → player name entry → rival name entry → OVERWORLD handoff via `NEW_GAME_STARTED` flag.
- **pallet-town-scripts.ts**: Script registry: OAK_INTRO (3 pages), MOM_DIALOG, STARTER_TABLE_TRIGGER (choice), starter-obtained sequences, RIVAL_COUNTER, NURSE_JOY_HEAL (YES/NO choice).
- **New maps**: `viridian-city.json` (30×30, 2 trainers, Pokemart/PokéCenter warps), `pokemon-center.json` (15×10 interior, Nurse Joy NPC, PC terminal script zone), `pewter-gym.json` (15×15, blocking youngster + Brock gym leader with BOULDER badge reward).
- **GameState / MapTypes updates**: Added `TRAINER_BATTLE_INTRO` and `BADGE_CEREMONY` phases; `DialogState` interface; trainer fields on `NPCDefinition`; `autoTrigger` on `ScriptZone`; optional fields `dialogState`, `trainerBattleNpcId`, `lastPokemonCenter`, `badgeCeremonyTimer`.
- **OverworldSystem**: Injected NPCSystem for interaction dispatch, NPC collision, script zone checks, TRAINER_SPOTTED result type.
- **GameEngine**: Registers all 5 maps, wires DialogSystem/NPCSystem/OnboardingSystem, routes new phases (TITLE, DIALOG, TRAINER_BATTLE_INTRO, BADGE_CEREMONY), blackout-to-last-Pokemon-Center logic.
- **OverworldRenderer**: Accepts optional NPCSystem; renders NPC instances with exclamation bubble and defeated-trainer grey tint.
- **pallet-town.json**: Fixed warp `targetTileX→targetX` / `targetTileY→targetY` keys; added MOM_DIALOG_ZONE and STARTER_TABLE_TRIGGER script zones.

## Test plan

- [ ] `npm test` — all 121 tests pass (20 new dialog-system + 16 new npc-trainer)
- [ ] `npx tsc --noEmit` — zero type errors
- [ ] Dialog text crawl at SLOW/NORMAL/FAST speeds verified by unit tests
- [ ] handleConfirm page-advance and choice cursor up/down verified
- [ ] Name entry add/delete/confirm/max-length verified
- [ ] TrainerNPC LOS cone (south/north/east/west), range cutoff, defeated-flag block all verified
- [ ] buildTrainerParty factory creates correct species+level instances

🤖 Generated with [Claude Code](https://claude.com/claude-code)
