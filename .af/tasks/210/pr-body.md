## Summary
- Fixes a visible flash of the storage-warning banner on every page load caused by SSR/hydration mismatch in `useStorageWarning()`.
- The hook previously initialised state via `useState(() => isAvailable())`, which returns `false` during SSR (no `localStorage`), causing the warning banner to appear in server-rendered HTML before disappearing on hydration.
- Changed the initialiser to `useState(true)` and moved the `isAvailable()` check into a `useEffect`, so the SSR render never shows the warning and the browser only reveals it if storage is genuinely blocked after mount.

## Changes
- **`src/game/systems/SaveSystem.ts`**
  - Added `useEffect` to the React import.
  - Changed `useStorageWarning` from `useState(() => isAvailable())` to `useState(true)` + `useEffect(() => { setStorageOk(isAvailable()) }, [])`.
  - Added `eslint-disable-next-line react-hooks/set-state-in-effect` comment for the intentional setState-in-effect pattern.
- **`tests/save-system.test.ts`**
  - Imported `renderHook`, `act`, and `useStorageWarning` to support new hook tests.
  - Added `useStorageWarning` describe block with three tests: initial render returns `available: true`, reports available when localStorage is accessible, and reports unavailable when localStorage throws.

## Testing
- All 218 existing tests continue to pass (`npm test`).
- Three new tests verify the hook's SSR-safe behaviour: default-true initial state, available-after-mount, and unavailable-after-mount when storage throws.
- `tsc --noEmit` passes with zero errors.
- `eslint .` passes with zero errors (one pre-existing unrelated warning in `layout.tsx`).
