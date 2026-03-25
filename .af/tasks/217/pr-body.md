## Summary
- Adds pixel-art battle sprites for Geodude (#74), Graveler (#75), and Onix (#95) so they display properly in the Pewter Gym battle instead of rendering as plain colored rectangles.
- Registers these three Pokémon in the asset manifest so the game loads and validates their sprites on startup.
- Provides a standalone script for future regeneration of these sprites.

## Changes

### New files
- `scripts/generate-gym-sprites.mjs`: Self-contained Node.js script using `pngjs` to programmatically draw pixel-art 80x80 battle sprites for Geodude, Graveler, and Onix (front and back views).
- `public/assets/sprites/pokemon/front/74.png`: Geodude front sprite (round grey boulder with eyes and arms)
- `public/assets/sprites/pokemon/front/75.png`: Graveler front sprite (larger rough boulder with bumps and 4 limbs)
- `public/assets/sprites/pokemon/front/95.png`: Onix front sprite (7-segment serpentine chain of circles)
- `public/assets/sprites/pokemon/back/74.png`: Geodude back sprite
- `public/assets/sprites/pokemon/back/75.png`: Graveler back sprite
- `public/assets/sprites/pokemon/back/95.png`: Onix back sprite

### Modified files
- `src/game/engine/AssetManifest.ts`: Added 74, 75, 95 to `pokemonIds` array (21 → 24 entries)
- `scripts/generate-assets.mjs`: Added Geodude, Graveler, Onix to POKEMON list for future DALL-E regeneration
- `package.json`: Added `pngjs` devDependency and `generate-gym-sprites` npm script
- `src/game/__tests__/AssetLoader.test.ts`: Updated hardcoded count assertions (21 → 24) and added assertions for the new IDs/paths

## Testing
- All 289 existing tests pass (`npm test`)
- ESLint passes with 0 new errors (`npm run lint`)
- All 6 PNG files generated and verified to be > 500 bytes each (1098–2109 bytes)
- `node scripts/generate-gym-sprites.mjs` runs successfully and produces all 6 sprites
