import type { EncounterTableEntry } from '../types/MapTypes'
import type { GameState } from '../types/GameState'
import type { BattleState } from '../types/BattleTypes'
import type { PokemonInstance } from '../types/PokemonTypes'
import { createPokemonInstance } from '../entities/PokemonInstance'
import { POKEMON_DATA } from '../data/pokemon'

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

  startEncounter(table: EncounterTableEntry[], state: GameState): BattleState | null {
    if (!table || table.length === 0) {
      console.warn('EncounterSystem: empty encounter table, skipping encounter')
      return null
    }

    try {
      const { speciesId, level } = this.selectWildPokemon(table)
      const wildPokemon = createPokemonInstance(speciesId, level, 'WILD')
      const wildName = POKEMON_DATA[speciesId]?.name?.toUpperCase() ?? `#${speciesId}`

      // Use first party Pokemon if available, otherwise create default
      let playerPokemon: PokemonInstance
      if (state.partyPokemon.length > 0) {
        playerPokemon = JSON.parse(JSON.stringify(state.partyPokemon[0])) as PokemonInstance
      } else {
        playerPokemon = createPokemonInstance(1, 5, 'PLAYER')
      }

      return {
        wildPokemon,
        playerPokemon,
        playerPartyIndex: 0,
        turn: 0,
        events: [],
        pendingEvents: [],
        currentMessage: `Wild ${wildName} appeared!`,
        awaitingInput: true,
        battleOver: false,
        playerFled: false,
        caughtPokemon: null,
        statStages: { player: {}, wild: {} },
        battlePhase: 'INTRO',
        cursorIndex: 0,
        sleepTurns: { player: 0, wild: 0 },
      }
    } catch (err) {
      console.error('EncounterSystem: failed to start encounter:', err)
      return null
    }
  }
}
