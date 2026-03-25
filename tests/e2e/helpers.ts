/** Pre-seeded save state builder for E2E tests */

export function buildSave(overrides: {
  map?: string
  tileX?: number
  tileY?: number
  party?: object[]
  inventory?: { itemId: number; quantity: number }[]
  flags?: Record<string, unknown>
  slot?: 1 | 2 | 3
}) {
  const slot = overrides.slot ?? 1
  return {
    [String(slot)]: {
      slot,
      schemaVersion: 1,
      playerName: 'RED',
      badges: [],
      playtimeSeconds: 0,
      savedAt: Date.now(),
      gameState: {
        currentMap: overrides.map ?? 'pallet-town',
        playerTileX: overrides.tileX ?? 10,
        playerTileY: overrides.tileY ?? 10,
        party: (overrides.party ?? []).map((p: unknown) => (p as { uuid: string }).uuid),
        partyPokemon: overrides.party ?? [],
        inventory: overrides.inventory ?? [],
        flags: { NEW_GAME_STARTED: true, playerName: 'RED', ...(overrides.flags ?? {}) },
        activeSlot: slot,
      },
    },
  }
}

/** Bulbasaur Lv.5 for seeding */
export const BULBASAUR_LV5 = {
  uuid: 'test-bulbasaur-uuid-001',
  speciesId: 1,
  nickname: null,
  level: 5,
  experience: 135,
  currentHp: 22,
  maxHp: 22,
  stats: { attack: 11, defense: 11, speed: 10, special: 14 },
  ivs: { hp: 8, attack: 8, defense: 8, speed: 8, special: 8 },
  evs: { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 },
  status: 'NONE',
  moves: [
    { moveId: 33, currentPP: 35, maxPP: 35 },
    { moveId: 45, currentPP: 20, maxPP: 20 },
  ],
  originalTrainer: 'RED',
  caughtAt: null,
}

/** Squirtle Lv.15 for gym test */
export const SQUIRTLE_LV15 = {
  uuid: 'test-squirtle-uuid-001',
  speciesId: 7,
  nickname: null,
  level: 15,
  experience: 1500,
  currentHp: 45,
  maxHp: 45,
  stats: { attack: 23, defense: 30, speed: 20, special: 22 },
  ivs: { hp: 8, attack: 8, defense: 8, speed: 8, special: 8 },
  evs: { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 },
  status: 'NONE',
  moves: [
    { moveId: 33, currentPP: 35, maxPP: 35 },
    { moveId: 55, currentPP: 25, maxPP: 25 },
  ],
  originalTrainer: 'RED',
  caughtAt: null,
}

/** Two pokemon for team management test */
export const CHARMANDER_LV5 = {
  uuid: 'test-charmander-uuid-001',
  speciesId: 4,
  nickname: null,
  level: 5,
  experience: 125,
  currentHp: 5,  // Low HP for potion test
  maxHp: 21,
  stats: { attack: 13, defense: 11, speed: 15, special: 12 },
  ivs: { hp: 8, attack: 8, defense: 8, speed: 8, special: 8 },
  evs: { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 },
  status: 'NONE',
  moves: [{ moveId: 10, currentPP: 35, maxPP: 35 }, { moveId: 45, currentPP: 20, maxPP: 20 }],
  originalTrainer: 'RED',
  caughtAt: null,
}
