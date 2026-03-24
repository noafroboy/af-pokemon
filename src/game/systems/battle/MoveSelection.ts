import type { PokemonInstance } from '../../types/PokemonTypes'
import type { Move } from '../../data/moves'
import { MOVES_DATA } from '../../data/moves'

export const STRUGGLE: Move = {
  id: 0,
  name: 'Struggle',
  type: 'Normal',
  category: 'physical',
  power: 50,
  accuracy: 100,
  pp: 1,
  effect: 'struggle_recoil',
  priority: 0,
  highCrit: false,
}

export function hasUsableMoves(pokemon: PokemonInstance): boolean {
  return pokemon.moves.some(slot => slot.currentPP > 0)
}

/** Gen 1 AI: picks a random move that has PP remaining; uses Struggle if none. */
export function selectAIMove(pokemon: PokemonInstance): number {
  const usable = pokemon.moves
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot }) => slot.currentPP > 0)

  if (usable.length === 0) return -1  // -1 signals Struggle

  const pick = usable[Math.floor(Math.random() * usable.length)]
  return pick.i
}

/** Get the Move object for a given move slot index. Returns STRUGGLE if index -1 or no PP. */
export function getMoveForSlot(pokemon: PokemonInstance, slotIndex: number): Move {
  if (slotIndex < 0 || slotIndex >= pokemon.moves.length) return STRUGGLE

  const slot = pokemon.moves[slotIndex]
  if (!slot || slot.currentPP <= 0) return STRUGGLE

  const move = MOVES_DATA[slot.moveId]
  return move ?? STRUGGLE
}

/** Consume PP for a move slot. Does nothing for Struggle (index -1). */
export function consumePP(pokemon: PokemonInstance, slotIndex: number): void {
  if (slotIndex < 0 || slotIndex >= pokemon.moves.length) return
  const slot = pokemon.moves[slotIndex]
  if (slot && slot.currentPP > 0) {
    slot.currentPP--
  }
}
