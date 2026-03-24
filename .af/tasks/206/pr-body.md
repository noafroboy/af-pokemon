## Summary

- Generates all 49 game visual assets (21 front sprites, 21 back sprites, player sheet, NPC sheet, 3 tilesets, 2 UI elements) via DALL-E 3 using a dedicated `scripts/generate-assets.mjs` script with rate-limiting and retry logic.
- Updates `AssetLoader.ts` with typed API for Pokemon sprites (`loadPokemonSprite`/`getPokemonSprite`), tilesets (`loadTileset`/`getCachedTileset`), `AssetManifest`, `SPRITE_SHEET_META`, and `preloadAllAssets()` — all with null-return on failure so the game never crashes on missing assets.
- Wires the new assets into `BattleRenderer` (Pokemon sprites with colored-rect fallback) and `OverworldRenderer` (16×16 grid tileset formula, resolution-adaptive).

## Changes

### New assets (generated via DALL-E 3)
- `public/assets/sprites/pokemon/front/[1-20,25].png` — 21 front battle sprites (1024×1024)
- `public/assets/sprites/pokemon/back/[1-20,25].png` — 21 back battle sprites (1024×1024)
- `public/assets/sprites/overworld/player.png` — 4-directional player walk sprite sheet
- `public/assets/sprites/overworld/npcs.png` — 4 NPC type sprite sheets side-by-side
- `public/assets/tiles/overworld.png` — overworld tileset (16×16 grid, 1024×1024)
- `public/assets/tiles/interior.png` — interior tileset
- `public/assets/tiles/gym.png` — gym tileset
- `public/assets/ui/pokeball-icon.png` — pokeball icon
- `public/assets/ui/badges.png` — 8 gym badge sprite sheet

### `src/game/engine/AssetLoader.ts`
- Added `AssetManifest` with all expected asset paths and pokemon ID list
- Added `SPRITE_SHEET_META` with frame dimensions and direction indices for player/NPC walk animations
- Added `loadPokemonSprite(id, side)` / `getPokemonSprite(id, side)` — async load + sync cache lookup
- Added `loadTileset(id)` / `getCachedTileset(id)` — load by logical ID (`overworld`/`interior`/`gym`)
- Added `preloadAllAssets()` — non-blocking startup preload of all manifest assets

### `src/game/renderers/BattleRenderer.ts`
- Enemy (front) and player (back) Pokemon sprites rendered via `getPokemonSprite()`
- Graceful fallback: colored rect + `#id` label when sprite not yet loaded

### `src/game/renderers/OverworldRenderer.ts`
- Tileset tile drawing updated from horizontal-strip formula to 16×16 grid formula
- Source tile size computed from `tileset.naturalWidth / 16` — works for any resolution

### `src/game/engine/GameEngine.ts`
- Calls `preloadAllAssets()` at construction (non-blocking)
- Calls `loadImage(map.tilesetPath)` in `loadMap()` to eagerly cache tilesets

### `src/game/data/maps/*.json`
- Updated all 5 maps: `tilesetPath` changed from `assets/tilesets/` to `assets/tiles/` to match generated asset locations

### `scripts/generate-assets.mjs`
- DALL-E 3 generation script: 13s rate limiting, 3-attempt retry with back-off, idempotent (skips existing files)

### `src/game/__tests__/AssetLoader.test.ts`
- 22 new tests covering: AssetManifest contents, SPRITE_SHEET_META, loadPokemonSprite (success + null on failure), getPokemonSprite cache lookup, loadTileset (success + null on failure), getCachedTileset, preloadAllAssets

## Testing

- All 182 tests pass (`npm test`)
- TypeScript: zero errors (`npm run typecheck`)
- ESLint: zero errors (`npm run lint`)
- Assets verified: all PNG files >1KB (not error responses)
