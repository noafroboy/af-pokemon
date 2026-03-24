import type { PokemonInstance } from '../../types/PokemonTypes'
import { POKEMON_DATA } from '../../data/pokemon'

export const BALL_BONUSES: Record<number, number> = {
  1: 1,    // Pokeball
  2: 1.5,  // Great Ball
  3: 2,    // Ultra Ball
}

/**
 * Gen 1 modified catch rate.
 * Formula: floor(catchRate * (3*maxHp - 2*currentHp) / (3*maxHp)) * ballBonus
 */
export function calculateModifiedCatchRate(
  wildPokemon: PokemonInstance,
  ballId: number
): number {
  const species = POKEMON_DATA[wildPokemon.speciesId]
  const baseCatchRate = species?.catchRate ?? 45
  const ballBonus = BALL_BONUSES[ballId] ?? 1

  const numerator = 3 * wildPokemon.maxHp - 2 * wildPokemon.currentHp
  const denominator = 3 * wildPokemon.maxHp

  const modifiedRate = Math.floor(baseCatchRate * numerator / denominator) * ballBonus
  return Math.min(255, Math.max(1, modifiedRate))
}

/**
 * Gen 1 catch attempt using 4-shake algorithm.
 * Returns success flag and wobble count (0-4).
 */
export function attemptCatch(modifiedCatchRate: number): { success: boolean; wobbleCount: number } {
  // wobble count = floor(catchRate / 12) but capped at 4
  // More precisely: Gen 1 uses the catch rate to determine each shake
  const wobbleThreshold = Math.floor(modifiedCatchRate / 12)

  let wobbleCount = 0
  for (let i = 0; i < 4; i++) {
    const roll = Math.floor(Math.random() * 256)
    if (roll < wobbleThreshold) {
      wobbleCount++
    } else {
      break
    }
  }

  const success = wobbleCount === 4
  return { success, wobbleCount }
}

/**
 * High-level catch attempt that returns full result including catch rate value.
 */
export function performCatchAttempt(
  wildPokemon: PokemonInstance,
  ballId: number
): { success: boolean; wobbleCount: number; modifiedCatchRate: number } {
  const modifiedCatchRate = calculateModifiedCatchRate(wildPokemon, ballId)
  const { success, wobbleCount } = attemptCatch(modifiedCatchRate)
  return { success, wobbleCount, modifiedCatchRate }
}
