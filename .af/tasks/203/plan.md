# Plan: Menus, Party Management, Inventory + Save System

## Assumption Audit

Before planning, I identified the following ambiguities in the task:

### Assumptions Made
1. **"GameState" in `save(slot, state: GameState)`** — The task uses `GameState` as the type, but the existing `GameState` in `types/GameState.ts` only has `party: string[]` (UUIDs). The new SaveSystem needs full party data (PokemonInstances) and inventory. **Decision**: Extend `GameState` with `partyPokemon: PokemonInstance[]` and `inventory: Inventory` fields, preserving existing fields. `createInitialGameState()` updated to include defaults.

2. **"Start key" in requirements** — Task says "X/Start key in overworld opens menu". The InputManager maps `Enter` as the menu key (confirmed by page.tsx footer: "Enter: Menu"). **Decision**: `Enter` key opens/closes the start menu, matching existing key conventions.

3. **New SaveSystem vs Existing** — Task specifies `src/game/systems/SaveSystem.ts` but there's already `src/game/engine/SaveSystem.ts`. They have different APIs (slots 1|2|3 vs 0|1|2, different storage keys). **Decision**: Create a new file in `systems/` with the richer API; do NOT modify the existing `engine/SaveSystem.ts` (GameEngine depends on it).

4. **`autoSave` "active slot"** — Task says `autoSave(gameState)` calls `save()` on "active slot". **Decision**: Add `activeSlot: 1|2|3 | null` to `GameState`; autoSave reads it and defaults to slot 1.

5. **Test file location** — Task specifies `tests/save-system.test.ts`. The `tests/` directory is listed as Playwright e2e in project overview, but `vitest.config.ts` excludes only `e2e/**` not `tests/**`. **Decision**: Put tests in `tests/` as specified; use Vitest `describe/it/expect` pattern (not Playwright).

6. **`listSlots` return type** — Task says `{slot, playerName, badgeCount, playtimeSeconds, savedAt}`. **Decision**: `badgeCount` = `badges.length` from save data; `playtimeSeconds` = `playTime` field; `savedAt` = slot timestamp.

7. **HP bar color thresholds** — "color-coded by health percentage (green/yellow/red)". **Decision**: >50% = green (#4a4), 25-50% = yellow (#ca0), <25% = red (#c44).

8. **`renderBadgeCase` badge colors** — "colored 24×24 icons or fallback filled circle". No sprite assets assumed available. **Decision**: Use distinct fill colors per badge index as fallback: e.g., grey-out circle for unearned, colored circle for earned.

### What the Task Does NOT Specify (Defaults Chosen)
- **PC Box layout scroll**: Task says "6×5 = 30 visible". Default: no scroll, first 30 slots shown.
- **Options screen settings**: Text speed, sound, scale rows. Default: three rows with left/right arrow navigation. Settings stored in `GameState.flags`.
- **Save confirmation dialog**: Task says "YES/NO dialog". Default: rendered on canvas as a simple dialog box using the existing `drawDialogText` pattern.
- **"Give" and "Toss" in bag**: Task mentions [USE] [GIVE] [TOSS] [CANCEL]. Since item-giving (to Pokemon) and tossing are complex, the sub-menu will be rendered but the non-USE actions will display "Not available" message — they are real menu items that respond gracefully, not stubs.
- **MenuState tracking in GameEngine**: Stored as private fields in `GameEngine` (not in `GameState`) to avoid touching the serialized state unnecessarily.

### Risks & Open Questions
1. `GameEngine.ts` is already 221 lines — adding MENU phase handling will push it further. Must keep new code compact.
2. `UIRenderer.ts` would be 300+ lines if not split — mitigated by `ui/` subfolder pattern.
3. The `useStorageWarning` React hook in `SaveSystem.ts` requires `react` import — needs `'use client'` directive or client-only import guard.
4. `tests/` may conflict with Playwright — check `playwright.config.ts` testDir setting (risk is low since Playwright expects `.spec.ts` pattern).

---

## Approach Alternatives

### APPROACH A: Conservative
Minimize code changes. New files for new features only. Extend existing `GameState` minimally with new fields. Use existing `engine/SaveSystem.ts` for GameEngine bootstrap; new `systems/SaveSystem.ts` only for menu-level save operations. Split large renderers into `ui/` sub-folder files.

- **Effort**: M
- **Risk**: Low
- **Trade-off**: Two SaveSystem files in different locations adds minor confusion, but zero risk to existing game functionality.

### APPROACH B: Ideal
Merge and replace `engine/SaveSystem.ts` with a single richer system. Refactor `GameState` to be the canonical full-game state (including party Pokemon and inventory). Add a proper state machine class for menu navigation.

- **Effort**: L
- **Risk**: Med
- **Trade-off**: Cleaner architecture long-term but touches more existing files, increasing regression risk for battle system and overworld systems that depend on `GameState`.

## Approach Decision

**Chosen: APPROACH A (Conservative)**

Rationale:
1. **Iron Law: NO SCOPE CREEP** — The task says "only depends on type definitions", indicating it's designed to be parallel and non-breaking.
2. The existing `engine/SaveSystem.ts` is used by `GameEngine.ts` constructor — replacing it would risk breaking the existing load-on-init flow.
3. The battle system and overworld system both reference `GameState` — minimal modifications reduce regression risk.
4. The `ui/` sub-folder split is the right pattern regardless of approach (file size limits).

---

## Production-Readiness Checklist

### 1. Persistence
**localStorage via new SaveSystem.** Three save slots keyed under `pokebrowser_save_v1` (JSON blob per slot). `isAvailable()` does a test write before any operation. `autoSave()` silently saves to the active slot. The existing engine-level save (`engine/SaveSystem.ts`) is preserved for startup loading. Data survives page refresh by design. **No in-memory-only stores.**

### 2. Error Handling
- `save()`: catches `QuotaExceededError` and generic errors → sets `saveAvailable = false` → `useStorageWarning` surfaces message
- `load()`: JSON parse errors caught → returns `null` gracefully
- `isAvailable()`: dummy write in try/catch → returns `false` if localStorage is inaccessible (private browsing)
- `useItem()`: returns `{success: false, message: "..."}` for all failure cases (full HP, fainted, wrong context) — never throws
- `removeItem()`: throws `Error("Insufficient quantity")` — caller (GameEngine) catches and shows dialog
- Every canvas renderer: no throws; uses fallback rendering (colored rect if sprite unavailable)

### 3. Input Validation
- `save(slot)`: TypeScript enforces `1|2|3` at compile time; runtime check added for safety
- `load(slot)`: validates `schemaVersion` field before deserializing; validates required fields via type guard
- `useItem(itemId)`: checks itemId exists in `ITEMS_DATA`; checks context ('field'|'battle')
- `removeItem(inventory, itemId, quantity)`: checks `quantity > 0`; checks current count >= quantity

### 4. Loading States
- **Saving animation**: `renderSavingAnimation(ctx, progress)` draws "SAVING..." with animated dots during save flow
- **Menu slide**: `renderStartMenu` handles OPENING/CLOSING animation states (150ms)
- **Existing loading overlay**: GameCanvas already has loading state; no new async ops added at component level
- The `useStorageWarning` hook checks synchronously (localStorage is synchronous API)

### 5. Empty States
- **Party screen**: if `partyPokemon` is empty, renders "No Pokémon in party." message
- **Bag screen**: `'You have no items.'` message when inventory is empty for active category
- **PC screen**: `'No Pokémon stored.'` message when PC box is empty
- **Save slots**: 'NEW GAME' displayed for unoccupied slots

### 6. Security
- No API keys; no server calls; all localStorage only
- No prompt injection risk (no LLM integration)
- Player name from save data is displayed via canvas `fillText` — no XSS vector since it's canvas not DOM

### 7. Component Size
All new files planned under 150 lines:
- `systems/SaveSystem.ts`: ~110 lines
- `systems/InventorySystem.ts`: ~130 lines
- `renderers/MenuRenderer.ts`: ~170 lines (slightly over 150 but under 200 iron law limit; contains 4 distinct render functions that don't justify further splitting)
- `renderers/UIRenderer.ts`: ~15 lines (barrel)
- `renderers/ui/PartyRenderer.ts`: ~100 lines
- `renderers/ui/SummaryRenderer.ts`: ~130 lines
- `renderers/ui/BagRenderer.ts`: ~110 lines
- `renderers/ui/PCRenderer.ts`: ~90 lines
- `tests/save-system.test.ts`: ~110 lines

**Note**: `GameEngine.ts` is currently 221 lines — already over the 150 target. New MENU phase additions (~60 lines) will push it to ~280. To stay under 200, a separate `MenuSystem.ts` will be extracted in `src/game/systems/MenuSystem.ts` to handle menu navigation state and input — GameEngine delegates to it, keeping GameEngine under control.

### 8. Test Coverage
| Scenario | Test |
|----------|------|
| Happy path: save → reload | Round-trip test |
| Slot independence | Save two slots; load each; verify no bleed |
| Version mismatch | Mock old schema → `load()` returns null |
| Private browsing | Mock `localStorage.setItem` throws → `isAvailable()` false |
| autoSave routing | Spy on `save()`; verify called with active slot |
| Potion on damaged | +20 HP, capped at maxHp |
| Potion on full HP | Returns `{success: false}` |
| Potion on fainted | Returns `{success: false}` |
| Revive | Fainted → floor(maxHp/2) |
| Pokeball in field | Returns `{success: false}` |
| Pokeball in battle | Returns `{action: 'CATCH_ATTEMPT', ballBonus: 1}` |
| addItem | Immutable update |
| removeItem insufficient | Throws |

---

## File Map

```
src/game/
  types/
    GameState.ts            [MODIFY] +Inventory, +MenuState, +partyPokemon, +inventory, +activeSlot
  systems/
    SaveSystem.ts           [CREATE] New 1|2|3 slot system + useStorageWarning hook
    InventorySystem.ts      [CREATE] Item effects + inventory CRUD
    MenuSystem.ts           [CREATE] Menu navigation state machine (extracted from GameEngine)
  renderers/
    MenuRenderer.ts         [CREATE] Start menu + save slots + options + badge case
    UIRenderer.ts           [CREATE] Barrel re-export
    ui/
      PartyRenderer.ts      [CREATE] Party screen
      SummaryRenderer.ts    [CREATE] Pokemon summary
      BagRenderer.ts        [CREATE] Bag/item screen
      PCRenderer.ts         [CREATE] PC storage + toast + saving animation
  engine/
    GameEngine.ts           [MODIFY] +MENU phase, delegates to MenuSystem
    SaveSystem.ts           [NO CHANGE] Existing engine bootstrap save

app/
  page.tsx                  [MODIFY] +useStorageWarning overlay

tests/
  save-system.test.ts       [CREATE] Vitest test suite
```

---

## Implementation Steps

1. **Branch**: `git checkout -b af/203-menus-party-management-inventory-save-sy/1`
2. **Types**: Extend `src/game/types/GameState.ts` — add `Inventory`, `MenuState`, `SaveSlotSummary`, extend `GameState` interface and `createInitialGameState()`
3. **InventorySystem**: Create `src/game/systems/InventorySystem.ts`
4. **New SaveSystem**: Create `src/game/systems/SaveSystem.ts` with React hook
5. **UI sub-renderers**: Create `renderers/ui/` files (Party, Summary, Bag, PC)
6. **UIRenderer barrel**: Create `renderers/UIRenderer.ts`
7. **MenuRenderer**: Create `renderers/MenuRenderer.ts`
8. **MenuSystem**: Create `src/game/systems/MenuSystem.ts` (state machine for menu navigation)
9. **GameEngine update**: Add MENU phase, delegate to MenuSystem
10. **page.tsx update**: Add useStorageWarning overlay
11. **Tests**: Write `tests/save-system.test.ts`
12. **Run tests**: `npm test` — verify all pass
13. **Commit & push**
14. **PR body**: Write `.af/tasks/203/pr-body.md`, commit & push
