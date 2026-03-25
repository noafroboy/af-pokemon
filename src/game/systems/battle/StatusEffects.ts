import type { PokemonInstance } from '../../types/PokemonTypes'
import { StatusCondition } from '../../types/PokemonTypes'
import type { BattleEvent, StatusInflictedEvent } from '../../types/BattleTypes'

export const STATUS_BADGE_LABELS: Record<string, string> = {
  [StatusCondition.BURN]: 'BRN',
  [StatusCondition.FREEZE]: 'FRZ',
  [StatusCondition.PARALYSIS]: 'PAR',
  [StatusCondition.POISON]: 'PSN',
  [StatusCondition.BAD_POISON]: 'PSN',
  [StatusCondition.SLEEP]: 'SLP',
  [StatusCondition.NONE]: '',
}

/** Returns true if the status prevents the pokemon from acting this turn.
 *  Also handles sleep counter decrement. */
export function checkStatusPreventsMove(
  pokemon: PokemonInstance,
  side: 'player' | 'wild',
  sleepTurns: { player: number; wild: number }
): { prevented: boolean; events: BattleEvent[] } {
  const events: BattleEvent[] = []

  if (pokemon.status === StatusCondition.SLEEP) {
    if (sleepTurns[side] > 0) {
      sleepTurns[side]--
      events.push({ type: 'MESSAGE', text: `${side === 'player' ? 'Your' : 'The wild'} Pokemon is fast asleep!` })
      return { prevented: true, events }
    } else {
      pokemon.status = StatusCondition.NONE
      events.push({ type: 'MESSAGE', text: `${side === 'player' ? 'Your' : 'The wild'} Pokemon woke up!` })
      return { prevented: false, events }
    }
  }

  if (pokemon.status === StatusCondition.FREEZE) {
    events.push({ type: 'MESSAGE', text: `${side === 'player' ? 'Your' : 'The wild'} Pokemon is frozen solid!` })
    return { prevented: true, events }
  }

  if (pokemon.status === StatusCondition.PARALYSIS) {
    // < 0.25 means paralyzed (25% chance of being unable to move)
    if (Math.random() < 0.25) {
      events.push({ type: 'MESSAGE', text: `${side === 'player' ? 'Your' : 'The wild'} Pokemon is fully paralyzed!` })
      return { prevented: true, events }
    }
  }

  return { prevented: false, events }
}

/** Apply end-of-turn status damage (burn/poison). Returns damage dealt and events. */
export function applyStatusAtTurnEnd(
  pokemon: PokemonInstance,
  target: 'player' | 'wild'
): { damage: number; events: BattleEvent[] } {
  const events: BattleEvent[] = []

  if (pokemon.status === StatusCondition.BURN || pokemon.status === StatusCondition.POISON) {
    const damage = Math.max(1, Math.floor(pokemon.maxHp / 16))
    pokemon.currentHp = Math.max(0, pokemon.currentHp - damage)
    events.push({ type: 'DAMAGE', target, amount: damage, effectiveness: 1 })
    const label = pokemon.status === StatusCondition.BURN ? 'burned' : 'poisoned'
    events.push({ type: 'MESSAGE', text: `${target === 'player' ? 'Your' : 'The wild'} Pokemon is hurt by its ${label} status!` })
    return { damage, events }
  }

  return { damage: 0, events }
}

/** Try to inflict a status condition with a given chance (0.0 - 1.0). */
export function tryInflictStatus(
  target: PokemonInstance,
  targetSide: 'player' | 'wild',
  effect: StatusCondition,
  chance: number,
  sleepTurns: { player: number; wild: number }
): StatusInflictedEvent | null {
  // Can't inflict if already has a status
  if (target.status !== StatusCondition.NONE) return null

  if (Math.random() < chance) {
    target.status = effect
    if (effect === StatusCondition.SLEEP) {
      // Gen 1 sleep duration: 1-6 turns
      sleepTurns[targetSide] = 1 + Math.floor(Math.random() * 6)
    }
    return { type: 'STATUS_INFLICTED', target: targetSide, status: effect }
  }

  return null
}

/** Parse move effect string and return status infliction info. */
export function getMoveStatusEffect(effect: string): { status: StatusCondition; chance: number } | null {
  if (effect === 'paralysis' || effect === 'paralysis_100') return { status: StatusCondition.PARALYSIS, chance: 1.0 }
  if (effect === 'paralysis_30') return { status: StatusCondition.PARALYSIS, chance: 0.3 }
  if (effect === 'paralysis_10') return { status: StatusCondition.PARALYSIS, chance: 0.1 }
  if (effect === 'burn_10') return { status: StatusCondition.BURN, chance: 0.1 }
  if (effect === 'burn_30') return { status: StatusCondition.BURN, chance: 0.3 }
  if (effect === 'poison' || effect === 'poison_100') return { status: StatusCondition.POISON, chance: 1.0 }
  if (effect === 'poison_30') return { status: StatusCondition.POISON, chance: 0.3 }
  if (effect === 'poison_20') return { status: StatusCondition.POISON, chance: 0.2 }
  if (effect === 'sleep') return { status: StatusCondition.SLEEP, chance: 1.0 }
  return null
}

/** Thaw a frozen pokemon when hit by a Fire-type move. */
export function checkFireThaw(
  target: PokemonInstance,
  targetSide: 'player' | 'wild',
  moveType: string
): BattleEvent[] {
  if (target.status === StatusCondition.FREEZE && moveType === 'Fire') {
    target.status = StatusCondition.NONE
    return [{ type: 'MESSAGE', text: `${targetSide === 'player' ? 'Your' : 'The wild'} Pokemon thawed out!` }]
  }
  return []
}
