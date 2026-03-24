# Task 201: Project Foundation + Playable Overworld Slice — Plan

## Overview

Bootstrap a Next.js 15 TypeScript game from zero and deliver a player that walks on a tile-based world map with a wild encounter flash. This is the minimal playable vertical slice of a browser-based Pokémon-style game.

The working directory contains only `README.md` and `AGENTS.md` — this is a fully greenfield project.

---

## Assumption Audit

| # | Ambiguity | Assumption Made |
|---|-----------|-----------------|
| 1 | Tileset PNG location/format | No PNG provided. AssetLoader will always use `drawFallback()` colored rects for this task. Sprite file stubs (`.gitkeep`) are created but no actual art is required. |
| 2 | Player sprite | No sprite PNG listed in files to create. Player renders as a colored rectangle with facing direction indicator. |
| 3 | `SaveSystem.ts` not in explicit file list | GameEngine.ts spec says "initializes from SaveSystem or new-game state." I will create `SaveSystem.ts` using localStorage as the implied infrastructure. |
| 4 | `BattleSystem.ts` not in explicit file list | GameEngine dispatches to `BattleSystem` based on `GamePhase`. I will create a minimal stub that shows "Wild X appeared!" and returns to OVERWORLD on A-press. |
| 5 | `BattleRenderer.ts` not in explicit file list | Required to render the dialog box from EncounterSystem. Will create minimal stub. |
| 6 | `MobileControls.tsx` referenced in InputManager | Not in files to create list. Will create a minimal stub with touch d-pad buttons that call `registerTouchButton`. |
| 7 | `encounterRate` in EncounterConfig | Spec says `Math.random() < encounterRate/255`. JSON maps will use value 20 (~7.8% per step), giving ~8–16 steps average. |
| 8 | Walk animation frames | "3-frame walk animation" — frames 0, 1, 2 cycling every 2 tiles of movement (4 ticks). |
| 9 | Warp tile fade duration | "300ms fade-to-black" — implemented as linear alpha overlay animated over 18 frames (300ms at 60fps). |
| 10 | Test for game canvas | Playwright E2E will check canvas existence and size; arrow-key movement test is included but may be limited in headless Chromium without rendering. |
| 11 | `pokemon.ts` / `moves.ts` file size | These are pure data tables for 20+ species and 40+ moves. They will exceed 150 lines. This is an acceptable exception for static data — NOT a component. |
| 12 | `data/maps/*.json` vs import | Maps will be imported as static JSON via Next.js (supported natively). AssetLoader will fetch them via `fetch('/api/maps/...')` OR import directly since they're bundled with the app. Given Next.js, direct `import` is simpler and avoids runtime fetch. |

### Risks & Open Questions

1. **Canvas rendering in jsdom**: Vitest's jsdom does not implement `CanvasRenderingContext2D`. Unit tests will mock canvas and test pure logic only. GameCanvas React component is tested via Playwright E2E instead.
2. **requestAnimationFrame in jsdom**: RAF does not execute in jsdom. GameEngine cannot be integration-tested in Vitest. Individual systems and entities are tested in isolation.
3. **Google Fonts availability**: If network is unavailable (CI), Press Start 2P won't load. The FontFace preload is non-blocking — game renders with fallback monospace. Not a crash risk.
4. **TYPE_CHART quirks**: Gen 1 had documented bugs: Ghost→Psychic = 0 (not super-effective as intended), Bug→Psychic = 0.5 (not super-effective). These are hardcoded in the matrix.
5. **Large data files**: `pokemon.ts` (~350 lines) and `moves.ts` (~200 lines) will exceed 150-line guideline. These are pure data constants, equivalent to JSON — not logic or components.

---

## Approach Alternatives

### Approach A: Conservative (CHOSEN)

Implement exactly what the spec requires. Use the fallback drawing system throughout (no real sprites). Create stub BattleSystem/BattleRenderer. Test pure logic in Vitest, basic rendering checks in Playwright.

- **Effort**: L (large — 35+ new files, complex game loop)
- **Risk**: Low — well-scoped, no external dependencies beyond npm packages
- **Trade-off**: No real art/sprites; game is functional but visually uses colored rectangles

### Approach B: Ideal

Full implementation with real tileset sprites (generated procedurally via canvas), complete save/load screen with slot picker UI, full battle sequence implementation, comprehensive E2E test suite with visual regression snapshots.

- **Effort**: XL (would double scope)
- **Risk**: High — art generation complexity, longer timeline, more failure points
- **Trade-off**: More polished but goes well beyond the "minimal playable slice" requirement

## Approach Decision

**Choosing Approach A.** The task explicitly says "minimal playable vertical slice." The requirements specify fallback behavior for missing PNGs. A conservative approach delivers every listed requirement without gold-plating. The spec even says "if any PNG asset is missing, game still runs with colored placeholder rectangles" — meaning the fallback IS the expected behavior for this task.

---

## Production-Readiness Checklist

1. **Persistence** — Save slots stored in `localStorage` via `SaveSystem.ts` under keys `pokebrowser_save_0`, `pokebrowser_save_1`, `pokebrowser_save_2`. Game state survives page refresh. Map data is static JSON bundled with the app (no runtime persistence needed). ✅

2. **Error handling** — AssetLoader wraps all `Image.onload`/fetch in try/catch with fallback rects. GameEngine wraps `update()` and `render()` in try/catch and renders an error overlay on canvas crash. GameCanvas React component has error state displaying a styled message if engine init fails. ✅

3. **Input validation** — No user-facing text input in this task (pure game controls). Key presses are validated against an allowed-keys allowlist in InputManager. Save data loaded from localStorage is JSON-parsed with try/catch and validated against expected shape before use. ✅

4. **Loading states** — AssetLoader exposes `loadProgress` (0–1). While `loadProgress < 1`, GameCanvas shows a "Loading…" text drawn on the canvas. React component shows a loading spinner before canvas mounts. ✅

5. **Empty states** — If no save exists, GameEngine starts a new game at Pallet Town with default player state. If encounter table is empty (misconfigured map), EncounterSystem logs a warning and does not trigger. ✅

6. **Security** — No API keys in this task. No user-generated content. LocalStorage save data is parsed defensively. No LLM involved. ✅

7. **Component size** — Plan upfront:
   - `GameCanvas.tsx` ~80 lines ✅
   - `MobileControls.tsx` ~60 lines ✅
   - `GameEngine.ts` ~140 lines (at limit — delegates to systems immediately) ✅
   - `OverworldSystem.ts` ~130 lines ✅
   - `OverworldRenderer.ts` ~120 lines ✅
   - `AssetLoader.ts` ~110 lines ✅
   - `InputManager.ts` ~100 lines ✅
   - `pokemon.ts` ~350 lines ⚠️ **Exception: pure data table, not a component**
   - `moves.ts` ~200 lines ⚠️ **Exception: pure data table, not a component**

8. **Test coverage** — Vitest unit tests for: Player (6 cases), PokemonInstance (7 cases), EncounterSystem (4 cases), Camera (4 cases), InputManager (5 cases), SaveSystem (5 cases). Playwright E2E: canvas presence and size (3 cases). All happy paths covered; error paths tested for SaveSystem (missing slot) and EncounterSystem (empty table). ✅

---

## Architecture Overview

```
app/
  layout.tsx          — HTML shell, Google Fonts, dark body
  globals.css         — Tailwind base + canvas reset
  page.tsx            — 'use client'; renders <GameCanvas>

src/game/
  types/              — Pure TS interfaces/enums (no imports)
    GameState.ts
    PokemonTypes.ts
    BattleTypes.ts
    MapTypes.ts
  data/               — Static lookup tables
    types.ts          — TYPE_CHART 18×18
    pokemon.ts        — POKEMON_DATA #1–20 + #25
    moves.ts          — MOVES_DATA ~40 moves
    items.ts          — ITEMS_DATA 11 items
    maps/
      pallet-town.json
      route-1.json
  entities/           — Stateful game objects
    Player.ts
    PokemonInstance.ts
  engine/             — Core infrastructure
    AssetLoader.ts    — PNG loading with fallback rects
    Camera.ts         — Viewport, world-to-screen
    InputManager.ts   — Keyboard + touch hooks
    SaveSystem.ts     — localStorage persistence
    GameEngine.ts     — Main RAF loop, phase dispatch
  systems/            — Per-phase update logic
    OverworldSystem.ts
    EncounterSystem.ts
    BattleSystem.ts   — Stub
  renderers/          — Per-phase draw logic
    OverworldRenderer.ts
    BattleRenderer.ts — Stub dialog box

src/components/
  GameCanvas.tsx      — React wrapper, canvas ref, engine lifecycle
  MobileControls.tsx  — Touch d-pad

public/assets/sprites/pokemon/front/.gitkeep
public/assets/sprites/pokemon/back/.gitkeep
```

---

## Key Design Decisions

### Game Loop (GameEngine.ts)
- Fixed 16.67ms timestep with accumulator pattern
- `accumulator += dt; while (accumulator >= TIMESTEP) { update(TIMESTEP); accumulator -= TIMESTEP; }`
- Render receives `interpolation = accumulator / TIMESTEP` for smooth pixel offset
- Phase dispatch: `OVERWORLD` → `OverworldSystem.update()` + `OverworldRenderer.render()`; `BATTLE` → `BattleSystem.update()` + `BattleRenderer.render()`; `TRANSITION` → fade overlay

### Tile Movement (OverworldSystem.ts)
- Each tile = 16px
- Player moves at 8px/frame = 2 frames per tile (at 60fps = 33ms/tile)
- On keydown: direction pushed to `Player.moveQueue` (max depth 2)
- Each update tick: if `pixelOffset > 0`, decrement by 8; else if queue non-empty, check collision → if clear, set `pixelOffset = 16`, update `tileX/tileY`, pop queue
- Smooth rendering: `screenX = tileX * 16 - pixelOffset * dx` where dx is direction vector

### Encounter System (EncounterSystem.ts)
- Roll `Math.random() < encounterRate / 255` on each step onto a tall-grass tile (tile index 3)
- Weight-proportional species selection from `encounterTable`
- Creates `PokemonInstance` for rolled species+level
- Sets `GamePhase → TRANSITION` (18 frames), then `→ BATTLE` with minimal BattleState
- Battle stub: renders "Wild NAME appeared!" dialog; on A-press → `GamePhase → OVERWORLD`

### Persistence (SaveSystem.ts)
```typescript
interface SaveSlot { slot: 0 | 1 | 2; state: SaveSlotData; timestamp: number; }
// localStorage key: `pokebrowser_save_${slot}`
```
- `saveGame(slot, state)`: JSON.stringify → localStorage.setItem, wrapped in try/catch
- `loadGame(slot)`: JSON.parse with schema validation, returns null on failure
- `hasSave(slot)`: checks localStorage key existence

### AssetLoader Fallback
```typescript
// Tile fallback color map
const TILE_COLORS: Record<number, string> = {
  0: 'transparent',
  1: '#8B7355', // path
  2: '#5A8A3C', // grass
  3: '#3D6B29', // tall grass
  4: '#2D4A1E', // tree/wall
};
drawFallback(ctx, x, y, w, h, label) // paints colored rect + label text
```

### Camera (Camera.ts)
- Viewport: 160×144 pixels (10×9 tiles at 16px each)
- Camera position = `player.tileX * 16 - VIEWPORT_W / 2 + 8` (center on player)
- Clamp: `camX = clamp(camX, 0, mapW * 16 - VIEWPORT_W)`
- `worldToScreen(wx, wy) = { x: wx - camX, y: wy - camY }`

### TypeScript Paths
```json
{ "@/game/*": ["src/game/*"] }
```

---

## Map Data Format

### pallet-town.json (20×20 = 400 tiles per layer)
```json
{
  "id": "pallet-town",
  "width": 20, "height": 20,
  "tileSize": 16,
  "tilesetPath": "/assets/tilesets/overworld.png",
  "layers": {
    "terrain": [/* 400 tile indices */],
    "objects": [/* 400 tile indices, 0=empty */],
    "collision": [/* 400 booleans: 0=passable, 1=blocked */]
  },
  "warps": [
    { "tileX": 10, "tileY": 0, "targetMap": "route-1", "targetX": 10, "targetY": 28, "direction": "north" }
  ],
  "npcs": [...],
  "encounters": null,
  "music": "pallettown"
}
```

### route-1.json (20×30 = 600 tiles per layer)
```json
{
  "encounterConfig": {
    "encounterRate": 20,
    "table": [
      { "speciesId": 19, "minLevel": 2, "maxLevel": 5, "weight": 100 },
      { "speciesId": 16, "minLevel": 2, "maxLevel": 5, "weight": 80 }
    ]
  }
}
```
(Rattata = #19, Pidgey = #16)

---

## Gen 1 Stat Formula

```
HP  = floor((Base + IV) * 2 + floor(sqrt(EV)) * 0.25) * Level / 100) + Level + 10
Stat = floor((Base + IV) * 2 + floor(sqrt(EV)) * 0.25) * Level / 100) + 5
```
(EVs are 0 at creation for wild Pokémon)

---

## Implementation Order

1. Config files (package.json → tsconfig → tailwind → next → vitest → playwright)
2. App shell (layout → globals.css → page.tsx)
3. Type definitions (4 type files — no dependencies)
4. Data tables (types.ts → pokemon.ts → moves.ts → items.ts)
5. Map JSON files (pallet-town → route-1)
6. Entities (Player → PokemonInstance)
7. Engine infrastructure (AssetLoader → Camera → InputManager → SaveSystem)
8. GameEngine (depends on all above)
9. Systems (OverworldSystem → EncounterSystem → BattleSystem stub)
10. Renderers (OverworldRenderer → BattleRenderer stub)
11. React components (GameCanvas → MobileControls)
12. Asset stubs (.gitkeep)
13. Tests (Vitest unit → Playwright E2E)
14. npm install + npm test
15. Commit + push + PR body
