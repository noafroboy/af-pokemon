## Summary
- Registers the 3 missing map JSON files (`viridian-city`, `pokemon-center`, `pewter-gym`) in the maps API route so `GET /api/maps/<id>` returns 200 instead of 404 for all existing game maps.
- Migrates the Press Start 2P font loading from raw `<link>` tags to Next.js `next/font/google`, eliminating the ESLint `@next/next/no-page-custom-font` warning and enabling font self-hosting.
- Adds `clean` and `prebuild` npm scripts to prevent stale `.next` cache issues during development and CI builds.

## Changes

### app/api/maps/[mapId]/route.ts
- Added `viridian-city`, `pokemon-center`, and `pewter-gym` entries to the `MAPS` lookup table so all 5 map JSON files in `src/game/data/maps/` are served by the API.

### app/layout.tsx
- Replaced 3 `<link>` tags (preconnect to fonts.googleapis.com, preconnect to fonts.gstatic.com, stylesheet link) with a `next/font/google` import and `Press_Start_2P` font instance using `variable: '--font-press-start'`.
- Applied `className={pressStart2P.variable}` to the `<html>` element; kept the viewport `<meta>` tag and `globals.css` import unchanged.

### package.json
- Added `"clean"` script to manually delete `.next` cache.
- Added `"prebuild"` hook that automatically clears `.next` before every `npm run build`.

## Testing
- `npm test` — all 289 tests pass with no regressions.
- `npm run lint` — exits 0, no ESLint warnings or errors.
- `npm run typecheck` — exits 0, no TypeScript errors.
- Maps API: all 5 map IDs now registered; `nonexistent` map still returns 404 with `{"error": "Map \"nonexistent\" not found"}`.
