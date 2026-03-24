import type { PokemonInstance } from '../types/PokemonTypes'
import { StatusCondition } from '../types/PokemonTypes'
import type { Inventory } from '../types/GameState'
import { ITEMS_DATA } from '../data/items'

export interface ItemResult {
  success: boolean
  message: string
  action?: 'CATCH_ATTEMPT'
  ballBonus?: number
  updatedPokemon?: PokemonInstance
}

export function useItem(
  itemId: number,
  target: PokemonInstance,
  context: 'field' | 'battle'
): ItemResult {
  const item = ITEMS_DATA[itemId]
  if (!item) return { success: false, message: 'Unknown item.' }

  if (item.category === 'pokeball') {
    if (context !== 'battle') return { success: false, message: 'Can only use Balls in battle.' }
    return { success: true, message: `Threw ${item.name}!`, action: 'CATCH_ATTEMPT', ballBonus: item.value }
  }

  const isFainted = target.currentHp <= 0

  if (item.effect === 'revive') {
    if (!isFainted) return { success: false, message: `${target.nickname ?? target.speciesId} is not fainted.` }
    const reviveHp = Math.floor(target.maxHp / 2)
    return { success: true, message: `${target.nickname ?? target.speciesId} was revived!`, updatedPokemon: { ...target, currentHp: reviveHp, status: StatusCondition.NONE } }
  }

  if (isFainted) return { success: false, message: `${target.nickname ?? target.speciesId} has fainted.` }

  if (item.effect === 'heal_hp') {
    if (target.currentHp >= target.maxHp) return { success: false, message: 'HP is already full.' }
    const newHp = Math.min(target.maxHp, target.currentHp + item.value)
    return { success: true, message: `Restored ${newHp - target.currentHp} HP.`, updatedPokemon: { ...target, currentHp: newHp } }
  }

  if (item.effect === 'full_restore') {
    const wasMaxHp = target.currentHp >= target.maxHp
    const wasNoStatus = target.status === StatusCondition.NONE
    if (wasMaxHp && wasNoStatus) return { success: false, message: 'No effect.' }
    return { success: true, message: 'Fully restored!', updatedPokemon: { ...target, currentHp: target.maxHp, status: StatusCondition.NONE } }
  }

  if (item.effect === 'cure_poison') {
    if (target.status !== StatusCondition.POISON && target.status !== StatusCondition.BAD_POISON) {
      return { success: false, message: 'Not poisoned.' }
    }
    return { success: true, message: 'Cured poison!', updatedPokemon: { ...target, status: StatusCondition.NONE } }
  }

  if (item.effect === 'cure_paralysis') {
    if (target.status !== StatusCondition.PARALYSIS) return { success: false, message: 'Not paralyzed.' }
    return { success: true, message: 'Cured paralysis!', updatedPokemon: { ...target, status: StatusCondition.NONE } }
  }

  if (item.effect === 'cure_status') {
    if (target.status === StatusCondition.NONE) return { success: false, message: 'No status to cure.' }
    return { success: true, message: 'Status cured!', updatedPokemon: { ...target, status: StatusCondition.NONE } }
  }

  return { success: false, message: 'Cannot use that here.' }
}

export function addItem(inventory: Inventory, itemId: number, quantity: number): Inventory {
  const existing = inventory.find(e => e.itemId === itemId)
  if (existing) {
    return inventory.map(e => e.itemId === itemId ? { ...e, quantity: e.quantity + quantity } : e)
  }
  return [...inventory, { itemId, quantity }]
}

export function removeItem(inventory: Inventory, itemId: number, quantity: number): Inventory {
  if (quantity <= 0) throw new Error('Quantity must be positive')
  const existing = inventory.find(e => e.itemId === itemId)
  if (!existing || existing.quantity < quantity) throw new Error('Insufficient quantity')
  if (existing.quantity === quantity) return inventory.filter(e => e.itemId !== itemId)
  return inventory.map(e => e.itemId === itemId ? { ...e, quantity: e.quantity - quantity } : e)
}

export function getItemCount(inventory: Inventory, itemId: number): number {
  return inventory.find(e => e.itemId === itemId)?.quantity ?? 0
}
