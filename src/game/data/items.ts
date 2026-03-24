export type ItemCategory = 'pokeball' | 'medicine' | 'tm' | 'key'

export interface Item {
  id: number
  name: string
  category: ItemCategory
  description: string
  price: number
  effect: string
  value: number
}

export const ITEMS_DATA: Record<number, Item> = {
  1: {
    id: 1, name: 'Poké Ball', category: 'pokeball',
    description: 'A device for catching wild Pokémon.',
    price: 200, effect: 'catch', value: 1,
  },
  2: {
    id: 2, name: 'Great Ball', category: 'pokeball',
    description: 'A good, high-performance Ball.',
    price: 600, effect: 'catch', value: 1.5,
  },
  3: {
    id: 3, name: 'Ultra Ball', category: 'pokeball',
    description: 'An ultra-high-performance Ball.',
    price: 1200, effect: 'catch', value: 2,
  },
  4: {
    id: 4, name: 'Potion', category: 'medicine',
    description: 'Restores 20 HP.',
    price: 300, effect: 'heal_hp', value: 20,
  },
  5: {
    id: 5, name: 'Super Potion', category: 'medicine',
    description: 'Restores 50 HP.',
    price: 700, effect: 'heal_hp', value: 50,
  },
  6: {
    id: 6, name: 'Full Restore', category: 'medicine',
    description: 'Fully restores HP and cures status.',
    price: 3000, effect: 'full_restore', value: 999,
  },
  7: {
    id: 7, name: 'Antidote', category: 'medicine',
    description: 'Cures poison.',
    price: 100, effect: 'cure_poison', value: 1,
  },
  8: {
    id: 8, name: 'Parlyz Heal', category: 'medicine',
    description: 'Cures paralysis.',
    price: 200, effect: 'cure_paralysis', value: 1,
  },
  9: {
    id: 9, name: 'Full Heal', category: 'medicine',
    description: 'Cures any status condition.',
    price: 600, effect: 'cure_status', value: 1,
  },
  10: {
    id: 10, name: 'Revive', category: 'medicine',
    description: 'Revives a fainted Pokémon with half HP.',
    price: 1500, effect: 'revive', value: 0.5,
  },
  134: {
    id: 134, name: 'TM34 Bide', category: 'tm',
    description: 'Teaches a Pokémon Bide.',
    price: 3000, effect: 'teach_move', value: 117,
  },
}
