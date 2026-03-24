import { describe, it, expect } from 'vitest'
import { createPokemonInstance, getPokemonName } from '../entities/PokemonInstance'
import { StatusCondition } from '../types/PokemonTypes'

describe('createPokemonInstance', () => {
  it('creates a Bulbasaur at level 5 with correct species', () => {
    const pokemon = createPokemonInstance(1, 5)
    expect(pokemon.speciesId).toBe(1)
    expect(pokemon.level).toBe(5)
    expect(pokemon.nickname).toBeNull()
    expect(pokemon.status).toBe(StatusCondition.NONE)
  })

  it('maxHp is calculated correctly using Gen 1 formula', () => {
    // HP = floor(((base + iv) * 2 + floor(sqrt(ev)) * 0.25) * level / 100) + level + 10
    // Bulbasaur base HP = 45; at level 1 with iv=0, ev=0:
    // HP = floor((45*2) * 1/100) + 1 + 10 = floor(0.9) + 11 = 11
    const pokemon = createPokemonInstance(1, 1)
    // With random IVs 0-15, HP at level 1 should be in range 11-12
    expect(pokemon.maxHp).toBeGreaterThanOrEqual(11)
    expect(pokemon.maxHp).toBeLessThanOrEqual(12)
    expect(pokemon.currentHp).toBe(pokemon.maxHp)
  })

  it('stats are calculated at level 20', () => {
    const pokemon = createPokemonInstance(4, 20) // Charmander
    expect(pokemon.stats.attack).toBeGreaterThan(0)
    expect(pokemon.stats.defense).toBeGreaterThan(0)
    expect(pokemon.stats.speed).toBeGreaterThan(0)
    expect(pokemon.stats.special).toBeGreaterThan(0)
  })

  it('has at least one move', () => {
    const pokemon = createPokemonInstance(19, 3) // Rattata
    expect(pokemon.moves.length).toBeGreaterThanOrEqual(1)
  })

  it('moves have valid PP values', () => {
    const pokemon = createPokemonInstance(1, 10) // Bulbasaur
    for (const move of pokemon.moves) {
      expect(move.currentPP).toBeGreaterThan(0)
      expect(move.maxPP).toBeGreaterThan(0)
      expect(move.currentPP).toBeLessThanOrEqual(move.maxPP)
    }
  })

  it('IVs are in range 0-15', () => {
    const pokemon = createPokemonInstance(25, 10) // Pikachu
    const { ivs } = pokemon
    expect(ivs.hp).toBeGreaterThanOrEqual(0)
    expect(ivs.hp).toBeLessThanOrEqual(15)
    expect(ivs.attack).toBeGreaterThanOrEqual(0)
    expect(ivs.attack).toBeLessThanOrEqual(15)
  })

  it('throws for unknown species ID', () => {
    expect(() => createPokemonInstance(999, 5)).toThrow('Unknown species ID: 999')
  })
})

describe('getPokemonName', () => {
  it('returns species name when no nickname', () => {
    const pokemon = createPokemonInstance(25, 5)
    expect(getPokemonName(pokemon)).toBe('Pikachu')
  })

  it('returns nickname when set', () => {
    const pokemon = createPokemonInstance(7, 5)
    pokemon.nickname = 'Squirt'
    expect(getPokemonName(pokemon)).toBe('Squirt')
  })
})
