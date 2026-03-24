## Summary
- Implemented complete in-game menu system with slide-in START menu
- Built party management, inventory bag screen, and PC box screen
- Added localStorage save system with 3 slots and private browsing fallback

## Changes
- `src/game/systems/SaveSystem.ts`: Save/load with 3 slots, version validation, storage availability detection
- `src/game/systems/InventorySystem.ts`: Item effects (Potion, Super Potion, Full Restore, etc.), bag management
- `src/game/systems/MenuSystem.ts`: State machine for menu navigation, delegates to renderers
- `src/game/renderers/MenuRenderer.ts`: START menu, save slot screen, options screen, badge case
- `src/game/renderers/UIRenderer.ts`: Barrel re-export for ui/ sub-renderers
- `src/game/renderers/ui/PartyRenderer.ts`: Party screen with HP bars
- `src/game/renderers/ui/SummaryRenderer.ts`: Pokemon summary with moves and types
- `src/game/renderers/ui/BagRenderer.ts`: Bag/item screen with category tabs and sub-menu
- `src/game/renderers/ui/PCRenderer.ts`: PC storage, saving animation, toast notification
- `src/game/engine/GameEngine.ts`: MENU phase, key routing, delegates to MenuSystem
- `src/game/types/GameState.ts`: Extended with partyPokemon, inventory, activeSlot, new type aliases
- `app/page.tsx`: Storage warning overlay via useStorageWarning hook
- `tests/save-system.test.ts`: Tests for save/load, slot independence, version validation, storage availability, all item effects

## Testing
- All tests pass with `npm test` (85 tests, 17 new)
- TypeScript compiles without errors
