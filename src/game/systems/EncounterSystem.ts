import type { EncounterTableEntry } from '../types/MapTypes'
import type { GameState } from '../types/GameState'
import type { BattleState } from '../types/BattleTypes'
import { createPokemonInstance } from '../entities/PokemonInstance'

export class EncounterSystem {
  selectWildPokemon(table: EncounterTableEntry[]): { speciesId: number; level: number } {
    if (table.length === 0) {
      throw new Error('EncounterSystem: empty encounter table')
    }

    const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0)
    let roll = Math.random() * totalWeight

    for (const entry of table) {
      roll -= entry.weight
      if (roll <= 0) {
        const levelRange = entry.maxLevel - entry.minLevel
        const level = entry.minLevel + Math.floor(Math.random() * (levelRange + 1))
        return { speciesId: entry.speciesId, level }
      }
    }

    // Fallback: return last entry
    const last = table[table.length - 1]
    return {
      speciesId: last.speciesId,
      level: last.minLevel + Math.floor(Math.random() * (last.maxLevel - last.minLevel + 1)),
    }
  }

  startEncounter(table: EncounterTableEntry[], _state: GameState): BattleState | null {
    if (!table || table.length === 0) {
      console.warn('EncounterSystem: empty encounter table, skipping encounter')
      return null
    }

    try {
      const { speciesId, level } = this.selectWildPokemon(table)
      const wildPokemon = createPokemonInstance(speciesId, level, 'WILD')

      const battle: BattleState = {
        wildPokemon,
        playerPartyIndex: 0,
        turn: 0,
        events: [],
        pendingEvents: [],
        currentMessage: `Wild ${wildPokemon.nickname ?? getPokemonName(speciesId)} appeared!`,
        awaitingInput: true,
        battleOver: false,
        playerFled: false,
        caughtPokemon: null,
        statStages: {
          player: {},
          wild: {},
        },
      }

      return battle
    } catch (err) {
      console.error('EncounterSystem: failed to start encounter:', err)
      return null
    }
  }
}

function getPokemonName(speciesId: number): string {
  // Inline lookup to avoid circular dependency
  const names: Record<number, string> = {
    1: 'BULBASAUR', 2: 'IVYSAUR', 3: 'VENUSAUR',
    4: 'CHARMANDER', 5: 'CHARMELEON', 6: 'CHARIZARD',
    7: 'SQUIRTLE', 8: 'WARTORTLE', 9: 'BLASTOISE',
    10: 'CATERPIE', 11: 'METAPOD', 12: 'BUTTERFREE',
    13: 'WEEDLE', 14: 'KAKUNA', 15: 'BEEDRILL',
    16: 'PIDGEY', 17: 'PIDGEOTTO', 18: 'PIDGEOT',
    19: 'RATTATA', 20: 'RATICATE', 25: 'PIKACHU',
  }
  return names[speciesId] ?? `#${speciesId}`
}
