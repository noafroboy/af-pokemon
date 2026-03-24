import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EncounterSystem } from '../systems/EncounterSystem'
import { createInitialGameState } from '../types/GameState'

describe('EncounterSystem', () => {
  let system: EncounterSystem

  beforeEach(() => {
    system = new EncounterSystem()
  })

  it('selectWildPokemon picks a species from the table', () => {
    const table = [
      { speciesId: 19, minLevel: 2, maxLevel: 5, weight: 100 },
      { speciesId: 16, minLevel: 2, maxLevel: 5, weight: 80 },
    ]
    const result = system.selectWildPokemon(table)
    expect([19, 16]).toContain(result.speciesId)
    expect(result.level).toBeGreaterThanOrEqual(2)
    expect(result.level).toBeLessThanOrEqual(5)
  })

  it('selectWildPokemon selects proportionally by weight', () => {
    // With Math.random mocked to 0, should pick first entry
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const table = [
      { speciesId: 19, minLevel: 3, maxLevel: 3, weight: 100 },
      { speciesId: 16, minLevel: 3, maxLevel: 3, weight: 80 },
    ]
    const result = system.selectWildPokemon(table)
    expect(result.speciesId).toBe(19)
    vi.restoreAllMocks()
  })

  it('throws when table is empty', () => {
    expect(() => system.selectWildPokemon([])).toThrow('empty encounter table')
  })

  it('startEncounter returns a BattleState with correct wild pokemon', () => {
    const table = [
      { speciesId: 19, minLevel: 3, maxLevel: 3, weight: 100 },
    ]
    const state = createInitialGameState()
    const battle = system.startEncounter(table, state)
    expect(battle).not.toBeNull()
    expect(battle!.wildPokemon.speciesId).toBe(19)
    expect(battle!.wildPokemon.level).toBe(3)
    expect(battle!.currentMessage).toContain('RATTATA')
    expect(battle!.awaitingInput).toBe(true)
  })

  it('startEncounter returns null for empty table and logs warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = createInitialGameState()
    const battle = system.startEncounter([], state)
    expect(battle).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('empty encounter table'))
    vi.restoreAllMocks()
  })
})
