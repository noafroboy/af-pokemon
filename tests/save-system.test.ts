import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { save, load, listSlots, deleteSlot, isAvailable, autoSave, SAVE_KEY, SCHEMA_VERSION } from '../src/game/systems/SaveSystem'
import { createInitialGameState } from '../src/game/types/GameState'
import { useItem, addItem, removeItem, getItemCount } from '../src/game/systems/InventorySystem'
import type { PokemonInstance } from '../src/game/types/PokemonTypes'
import { StatusCondition } from '../src/game/types/PokemonTypes'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
    _store: () => store,
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })

function makeState(name = 'RED', slot: 1 | 2 | 3 = 1) {
  const s = createInitialGameState()
  s.flags['playerName'] = name
  s.activeSlot = slot
  return s
}

function makePokemon(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    uuid: 'test-uuid',
    speciesId: 1,
    nickname: null,
    level: 10,
    experience: 0,
    currentHp: 35,
    maxHp: 45,
    stats: { attack: 10, defense: 10, speed: 10, special: 10 },
    ivs: { hp: 8, attack: 8, defense: 8, speed: 8, special: 8 },
    evs: { hp: 0, attack: 0, defense: 0, speed: 0, special: 0 },
    status: StatusCondition.NONE,
    moves: [],
    originalTrainer: 'RED',
    caughtAt: null,
    ...overrides,
  }
}

describe('SaveSystem', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('save/load round-trip: all fields match', () => {
    const state = makeState('ASH', 1)
    state.currentMap = 'route-1'
    state.playerTileX = 5
    state.playerTileY = 7

    save(1, state)
    const loaded = load(1)

    expect(loaded).not.toBeNull()
    expect(loaded!.playerName).toBe('ASH')
    expect(loaded!.gameState.currentMap).toBe('route-1')
    expect(loaded!.gameState.playerTileX).toBe(5)
    expect(loaded!.gameState.playerTileY).toBe(7)
    expect(loaded!.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('slot independence: saving slot 1 and slot 2 with different data', () => {
    const state1 = makeState('PLAYER1', 1)
    const state2 = makeState('PLAYER2', 2)
    state1.currentMap = 'pallet-town'
    state2.currentMap = 'route-1'

    save(1, state1)
    save(2, state2)

    const loaded1 = load(1)
    const loaded2 = load(2)

    expect(loaded1!.playerName).toBe('PLAYER1')
    expect(loaded1!.gameState.currentMap).toBe('pallet-town')
    expect(loaded2!.playerName).toBe('PLAYER2')
    expect(loaded2!.gameState.currentMap).toBe('route-1')
  })

  it('version mismatch: loading a save with old schema version returns null', () => {
    const state = makeState('OLDPLAYER', 1)
    save(1, state)

    // Tamper with the stored version
    const raw = localStorageMock.getItem(SAVE_KEY)
    const parsed = JSON.parse(raw!)
    parsed['1'].schemaVersion = 0
    localStorageMock.setItem(SAVE_KEY, JSON.stringify(parsed))

    const loaded = load(1)
    expect(loaded).toBeNull()
  })

  it('isAvailable returns false when localStorage throws', () => {
    localStorageMock.setItem.mockImplementationOnce(() => { throw new DOMException('Full', 'QuotaExceededError') })
    const result = isAvailable()
    expect(result).toBe(false)
  })

  it('autoSave calls save with active slot', () => {
    const state = makeState('AUTO', 2)
    state.activeSlot = 2
    autoSave(state)
    const loaded = load(2)
    expect(loaded).not.toBeNull()
    expect(loaded!.playerName).toBe('AUTO')
    expect(loaded!.slot).toBe(2)
  })

  it('deleteSlot removes the slot without affecting others', () => {
    save(1, makeState('S1', 1))
    save(2, makeState('S2', 2))
    deleteSlot(1)
    expect(load(1)).toBeNull()
    expect(load(2)).not.toBeNull()
  })

  it('listSlots returns only populated slots', () => {
    save(1, makeState('P1', 1))
    save(3, makeState('P3', 3))
    const slots = listSlots()
    expect(slots).toHaveLength(2)
    expect(slots.find(s => s.slot === 1)?.playerName).toBe('P1')
    expect(slots.find(s => s.slot === 3)?.playerName).toBe('P3')
    expect(slots.find(s => s.slot === 2)).toBeUndefined()
  })
})

describe('InventorySystem', () => {
  const fullHpPoke = makePokemon({ currentHp: 45, maxHp: 45 })
  const damagedPoke = makePokemon({ currentHp: 10, maxHp: 45 })
  const faintedPoke = makePokemon({ currentHp: 0, maxHp: 45 })
  const poisonedPoke = makePokemon({ currentHp: 30, maxHp: 45, status: StatusCondition.POISON })

  it('Potion restores 20 HP capped at maxHp', () => {
    const result = useItem(4, damagedPoke, 'field') // item 4 = Potion
    expect(result.success).toBe(true)
    expect(result.updatedPokemon!.currentHp).toBe(30)
  })

  it('Potion fails when HP is full', () => {
    const result = useItem(4, fullHpPoke, 'field')
    expect(result.success).toBe(false)
  })

  it('Potion fails on fainted Pokemon', () => {
    const result = useItem(4, faintedPoke, 'field')
    expect(result.success).toBe(false)
  })

  it('Revive works on fainted Pokemon at floor(maxHp/2)', () => {
    const result = useItem(10, faintedPoke, 'field') // item 10 = Revive
    expect(result.success).toBe(true)
    expect(result.updatedPokemon!.currentHp).toBe(22) // floor(45/2)
  })

  it('Pokeball fails in field context', () => {
    const result = useItem(1, damagedPoke, 'field') // item 1 = Pokeball
    expect(result.success).toBe(false)
  })

  it('Pokeball returns CATCH_ATTEMPT in battle', () => {
    const result = useItem(1, damagedPoke, 'battle')
    expect(result.success).toBe(true)
    expect(result.action).toBe('CATCH_ATTEMPT')
    expect(result.ballBonus).toBe(1)
  })

  it('Antidote clears Poison only', () => {
    const result = useItem(7, poisonedPoke, 'field') // item 7 = Antidote
    expect(result.success).toBe(true)
    expect(result.updatedPokemon!.status).toBe(StatusCondition.NONE)
  })

  it('addItem is an immutable update', () => {
    const inv = [{ itemId: 4, quantity: 3 }]
    const updated = addItem(inv, 4, 2)
    expect(updated[0].quantity).toBe(5)
    expect(inv[0].quantity).toBe(3) // original unchanged
  })

  it('removeItem throws when insufficient', () => {
    const inv = [{ itemId: 4, quantity: 1 }]
    expect(() => removeItem(inv, 4, 5)).toThrow('Insufficient quantity')
  })

  it('getItemCount returns 0 for missing item', () => {
    expect(getItemCount([], 999)).toBe(0)
  })
})
