## Summary

- Bootstraps the entire Next.js 15 TypeScript project from a blank repo with all config, types, data, engine, and UI files needed for the minimal playable vertical slice.
- Delivers a working tile-based overworld: player walks with 3-frame animation, camera follows and clamps to map edges, map warps trigger a 300ms fade-to-black transition, and walking on Route 1 tall grass rolls wild encounters that show a "Wild RATTATA appeared!" dialog.
- All game state persists across page refresh via localStorage (`pokebrowser_save_N`); all PNG assets have graceful colored-rect fallbacks so the game runs with zero art files.

## Changes

### Configuration
- `package.json` — Next.js 15, TypeScript strict, Tailwind, Tone.js, Howler, Vitest, Playwright
- `tsconfig.json` — strict mode, `@/game/*` path alias
- `tailwind.config.ts`, `postcss.config.js`, `next.config.ts` — unoptimized images, pixel font
- `vitest.config.ts` — jsdom environment, path aliases, e2e exclusion
- `playwright.config.ts` — Chromium, baseURL localhost:3000

### App Shell
- `app/layout.tsx` — Press Start 2P Google Font link, dark `#1a1c2c` body
- `app/globals.css` — Tailwind base, pixelated canvas rendering
- `app/page.tsx` — SSR-disabled dynamic GameCanvas, desktop keyboard hint footer
- `app/api/maps/[mapId]/route.ts` — serves bundled map JSON with 404/500 error handling

### Type Definitions
- `src/game/types/GameState.ts` — `GamePhase` enum (TITLE|OVERWORLD|BATTLE|DIALOG|MENU|TRANSITION), `SaveSlot`, `GameState`
- `src/game/types/PokemonTypes.ts` — `PokemonSpecies`, `PokemonInstance`, `StatusCondition`, `ExpGroup`, `CryParams`
- `src/game/types/BattleTypes.ts` — `BattleState`, 11-variant discriminated union `BattleEvent`
- `src/game/types/MapTypes.ts` — `GameMap`, `TileLayer`, `EncounterConfig`, `WarpDefinition`, `NPCDefinition`, `ScriptZone`

### Game Data
- `src/game/data/types.ts` — `PokemonType` union, full 18×18 `TYPE_CHART` (Gen 1 Ghost→Psychic=0, Bug→Psychic=0.5 quirks)
- `src/game/data/pokemon.ts` — `POKEMON_DATA` for species #1–20 + #25 with correct base stats, types, catch rates, exp groups, learnsets, evolution chains
- `src/game/data/moves.ts` — `MOVES_DATA` ~40 moves covering all starter learnsets through Lv.20
- `src/game/data/items.ts` — `ITEMS_DATA` 11 items (Pokéballs, potions, status heals, Revive, TM34)
- `src/game/data/maps/pallet-town.json` — 20×20 tile map with buildings, path, NPCs, warp north to Route 1
- `src/game/data/maps/route-1.json` — 20×30 tile map with tall grass encounter zones, Rattata/Pidgey table

### Entities
- `src/game/entities/Player.ts` — `Player` class with tileX/Y, facing, walkFrame, pixelOffset, moveQueue (max 2), stepCount; serialize/deserialize
- `src/game/entities/PokemonInstance.ts` — `createPokemonInstance` using Gen 1 HP/stat formula, random IVs 0–15, learnset-based move assignment

### Engine Infrastructure
- `src/game/engine/AssetLoader.ts` — PNG loading with `drawFallback()` colored rects keyed by tile index, `loadProgress` 0–1, font preload
- `src/game/engine/Camera.ts` — 160×144 viewport, player centering, map-edge clamping, `worldToScreen`, visible tile range
- `src/game/engine/InputManager.ts` — Arrow/Z/X/Enter/Escape; justPressed/heldFrames/justReleased per key; touch button registration
- `src/game/engine/SaveSystem.ts` — `saveGame`/`loadGame`/`hasSave`/`deleteSave` via localStorage `pokebrowser_save_N`; defensive JSON parsing + shape validation
- `src/game/engine/GameEngine.ts` — RAF fixed 16.67ms timestep accumulator; phase dispatch to systems/renderers; error overlay on crash; bundled map preload

### Systems
- `src/game/systems/OverworldSystem.ts` — tile movement (8px/frame), collision lookup, warp detection, encounter roll (`Math.random() < encounterRate/255`) on tall grass
- `src/game/systems/EncounterSystem.ts` — weight-proportional species selection, `createPokemonInstance`, returns `BattleState` with "Wild X appeared!" message
- `src/game/systems/BattleSystem.ts` — stub: renders encounter message, A-press returns to OVERWORLD

### Renderers
- `src/game/renderers/OverworldRenderer.ts` — terrain/objects/NPCs drawn tile-by-tile from tileset PNG or fallback rects; player drawn at interpolated pixel position with walk animation; `ctx.imageSmoothingEnabled=false` throughout
- `src/game/renderers/BattleRenderer.ts` — wild Pokémon info box, HP bar, word-wrapped dialog box, blinking ▶ prompt

### React Components
- `src/components/GameCanvas.tsx` — canvas ref, GameEngine lifecycle, loading overlay, error state, 3× CSS scale (480×432px), `data-testid="game-canvas"`
- `src/components/MobileControls.tsx` — touch d-pad + A/B buttons using pointer events and InputManager hook

### Asset Stubs
- `public/assets/sprites/pokemon/front/.gitkeep`
- `public/assets/sprites/pokemon/back/.gitkeep`

## Testing

- **43 Vitest unit tests — all passing** (`npm test`)
  - `Player.test.ts` (8 tests): init, queue depth, movement, offset, serialize
  - `Camera.test.ts` (7 tests): clamping, centering, worldToScreen, visibility, tile range
  - `InputManager.test.ts` (7 tests): pressed/justPressed/heldFrames/justReleased lifecycle
  - `SaveSystem.test.ts` (7 tests): save/load round-trip, missing slot, corrupt JSON, delete
  - `PokemonInstance.test.ts` (9 tests): stat formula, IVs, moves, unknown species error
  - `EncounterSystem.test.ts` (5 tests): species selection, weight proportionality, empty table error, BattleState shape
- **TypeScript**: `tsc --noEmit` — zero errors
- **Build**: `next build` — zero errors, all routes compiled successfully
- **E2E**: `e2e/overworld.spec.ts` — Playwright tests for canvas presence (480×432px), no JS errors, pixelated rendering style
