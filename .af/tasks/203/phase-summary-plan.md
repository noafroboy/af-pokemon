## Plan Summary
Files to modify: [object Object], [object Object], [object Object]
Files to create: [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object], [object Object]
Approach: Conservative — minimal changes to existing code; new files for new features; barrel exports for renderer splitting
Steps:
- 1. Create branch af/203-menus-party-management-inventory-save-sy/1
- 2. Extend src/game/types/GameState.ts with new type definitions
- 3. Create src/game/systems/InventorySystem.ts
- 4. Create src/game/systems/SaveSystem.ts with useStorageWarning hook
- 5. Create src/game/renderers/ui/PartyRenderer.ts
- 6. Create src/game/renderers/ui/SummaryRenderer.ts
- 7. Create src/game/renderers/ui/BagRenderer.ts
- 8. Create src/game/renderers/ui/PCRenderer.ts
- 9. Create src/game/renderers/UIRenderer.ts (barrel)
- 10. Create src/game/renderers/MenuRenderer.ts
- 11. Update src/game/engine/GameEngine.ts — add MENU phase
- 12. Update app/page.tsx — add storage warning overlay
- 13. Write tests/save-system.test.ts
- 14. Run npm test — verify all tests pass
- 15. Commit and push
- 16. Write .af/tasks/203/pr-body.md, commit and push