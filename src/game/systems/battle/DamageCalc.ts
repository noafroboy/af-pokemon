import type { PokemonInstance } from '../../types/PokemonTypes'
import type { Move } from '../../data/moves'
import { TYPE_CHART } from '../../data/types'
import type { PokemonType } from '../../data/types'
import { POKEMON_DATA } from '../../data/pokemon'

// Stat stage multiplier table: index 0=stage-6, index 6=stage0, index 12=stage+6
export const STAGE_MULTIPLIERS = [0.25, 0.28, 0.33, 0.40, 0.50, 0.66, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]

export function getStageMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage))
  return STAGE_MULTIPLIERS[clamped + 6]
}

export function getPokemonTypes(pokemon: PokemonInstance): string[] {
  const species = POKEMON_DATA[pokemon.speciesId]
  return species ? (species.types as string[]) : ['Normal']
}

export function isImmune(moveType: string, defenderTypes: string[]): boolean {
  return defenderTypes.some(dt => {
    const chart = TYPE_CHART[moveType as PokemonType]
    return chart ? (chart[dt as PokemonType] ?? 1) === 0 : false
  })
}

export function getTypeEffectivenessMultiplier(moveType: string, defenderTypes: string[]): number {
  return defenderTypes.reduce((mult, dt) => {
    const chart = TYPE_CHART[moveType as PokemonType]
    return mult * (chart ? (chart[dt as PokemonType] ?? 1) : 1)
  }, 1)
}

export function getEffectivenessMessage(multiplier: number): string | null {
  if (multiplier === 0) return 'no effect'
  if (multiplier > 1) return 'super effective'
  if (multiplier < 1) return 'not very effective'
  return null
}

export interface DamageOptions {
  critRoll?: number  // 0-255, if provided skip random crit roll
  randRoll?: number  // 217-255, if provided skip random damage roll
}

export function calculateDamage(
  attacker: PokemonInstance,
  defender: PokemonInstance,
  move: Move,
  attackerStatStages: Record<string, number>,
  defenderStatStages: Record<string, number>,
  opts: DamageOptions = {}
): { damage: number; effectiveness: number; isCrit: boolean } {
  if (move.power === 0) return { damage: 0, effectiveness: 1, isCrit: false }

  const defenderTypes = getPokemonTypes(defender)

  if (isImmune(move.type, defenderTypes)) {
    return { damage: 0, effectiveness: 0, isCrit: false }
  }

  const effectiveness = getTypeEffectivenessMultiplier(move.type, defenderTypes)

  // Critical hit check: Gen 1 speed-based
  const critThreshold = move.highCrit
    ? Math.floor(attacker.stats.speed / 64)
    : Math.floor(attacker.stats.speed / 512)
  const critRoll = opts.critRoll ?? Math.floor(Math.random() * 256)
  const isCrit = critRoll < Math.max(1, critThreshold)

  // Gen 1: crits ignore bad attack stages and good defense stages
  const rawAtkStage = attackerStatStages['attack'] ?? 0
  const rawDefStage = defenderStatStages['defense'] ?? 0
  const atkStage = isCrit ? Math.max(0, rawAtkStage) : rawAtkStage
  const defStage = isCrit ? Math.min(0, rawDefStage) : rawDefStage

  let atk = attacker.stats.attack * getStageMultiplier(atkStage)
  const def = Math.max(1, defender.stats.defense * getStageMultiplier(defStage))

  // Burn halves attack
  if (attacker.status === 'BURN') atk = Math.floor(atk / 2)

  // STAB check
  const attackerTypes = getPokemonTypes(attacker)
  const stab = attackerTypes.includes(move.type) ? 1.5 : 1

  const L = attacker.level

  // Gen 1 damage formula
  const baseDamage = Math.floor(
    (Math.floor((2 * L / 5 + 2) * Math.max(1, atk) * move.power / def / 50) + 2)
    * stab * effectiveness * (isCrit ? 2 : 1)
  )

  // Random factor: 217-255
  const randVal = opts.randRoll ?? (217 + Math.floor(Math.random() * 39))
  const damage = Math.max(1, Math.floor(baseDamage * randVal / 255))

  return { damage, effectiveness, isCrit }
}
