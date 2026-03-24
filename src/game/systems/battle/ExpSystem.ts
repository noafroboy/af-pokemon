import type { PokemonInstance } from '../../types/PokemonTypes'
import { ExpGroup } from '../../types/PokemonTypes'
import type { BattleEvent } from '../../types/BattleTypes'
import { POKEMON_DATA } from '../../data/pokemon'

/** EXP required to be at the start of the given level. */
export function getExpForLevel(expGroup: ExpGroup | string, level: number): number {
  if (level <= 1) return 0
  switch (expGroup) {
    case ExpGroup.FAST:
      return Math.floor(4 * Math.pow(level, 3) / 5)
    case ExpGroup.MEDIUM_FAST:
      return Math.pow(level, 3)
    case ExpGroup.MEDIUM_SLOW:
      return Math.max(0, Math.floor(6 / 5 * Math.pow(level, 3) - 15 * Math.pow(level, 2) + 100 * level - 140))
    case ExpGroup.SLOW:
      return Math.floor(5 * Math.pow(level, 3) / 4)
    default:
      return Math.pow(level, 3)
  }
}

/** Wild EXP gain formula: floor(baseExp * level / 7) */
export function calculateWildExp(wildPokemon: PokemonInstance): number {
  const species = POKEMON_DATA[wildPokemon.speciesId]
  const baseExp = species?.baseExp ?? 50
  return Math.floor(baseExp * wildPokemon.level / 7)
}

/** Trainer EXP gain formula: floor(baseExp * level / 7 * 1.5) */
export function calculateTrainerExp(wildPokemon: PokemonInstance): number {
  return Math.floor(calculateWildExp(wildPokemon) * 1.5)
}

/**
 * Apply EXP to a pokemon, handling level-up checks.
 * Returns events: EXP_GAIN, and optionally LEVEL_UP.
 */
export function applyExpGain(
  pokemon: PokemonInstance,
  amount: number,
  partyIndex: number
): { leveledUp: boolean; newLevel: number; events: BattleEvent[] } {
  const events: BattleEvent[] = []
  events.push({ type: 'EXP_GAIN', partyIndex, amount })

  pokemon.experience += amount

  const species = POKEMON_DATA[pokemon.speciesId]
  const expGroup = species?.expGroup ?? ExpGroup.MEDIUM_FAST

  let leveledUp = false
  while (pokemon.level < 100) {
    const nextLevelExp = getExpForLevel(expGroup, pokemon.level + 1)
    if (pokemon.experience >= nextLevelExp) {
      pokemon.level++
      leveledUp = true
      events.push({ type: 'LEVEL_UP', partyIndex, newLevel: pokemon.level })
    } else {
      break
    }
  }

  return { leveledUp, newLevel: pokemon.level, events }
}
