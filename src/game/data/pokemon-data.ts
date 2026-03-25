import type { PokemonSpecies } from '../types/PokemonTypes'
import { ExpGroup } from '../types/PokemonTypes'

/** Extended Pokemon data — species 16-20 and 25 */
export const POKEMON_DATA_EXT: Record<number, PokemonSpecies> = {
  16: {
    id: 16, name: 'Pidgey', types: ['Normal', 'Flying'],
    baseStats: { hp: 40, attack: 45, defense: 40, speed: 56, special: 35 },
    catchRate: 255, baseExp: 55, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 28 }, { level: 5, moveId: 45 },
      { level: 12, moveId: 98 }, { level: 19, moveId: 17 },
    ],
    evolutions: [{ method: 'level', value: 18, intoSpeciesId: 17 }],
    cry: { pitch: 135, length: 0.4, volume: 0.7 },
  },
  17: {
    id: 17, name: 'Pidgeotto', types: ['Normal', 'Flying'],
    baseStats: { hp: 63, attack: 60, defense: 55, speed: 71, special: 50 },
    catchRate: 120, baseExp: 113, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 28 }, { level: 5, moveId: 45 },
      { level: 12, moveId: 98 }, { level: 19, moveId: 17 },
    ],
    evolutions: [{ method: 'level', value: 36, intoSpeciesId: 18 }],
    cry: { pitch: 115, length: 0.5, volume: 0.8 },
  },
  18: {
    id: 18, name: 'Pidgeot', types: ['Normal', 'Flying'],
    baseStats: { hp: 83, attack: 80, defense: 75, speed: 91, special: 70 },
    catchRate: 45, baseExp: 172, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 28 }, { level: 5, moveId: 45 },
      { level: 12, moveId: 98 }, { level: 19, moveId: 17 },
    ],
    evolutions: [],
    cry: { pitch: 95, length: 0.6, volume: 0.9 },
  },
  19: {
    id: 19, name: 'Rattata', types: ['Normal'],
    baseStats: { hp: 30, attack: 56, defense: 35, speed: 72, special: 25 },
    catchRate: 255, baseExp: 57, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [
      { level: 1, moveId: 33 }, { level: 7, moveId: 28 },
      { level: 14, moveId: 44 }, { level: 20, moveId: 98 },
    ],
    evolutions: [{ method: 'level', value: 20, intoSpeciesId: 20 }],
    cry: { pitch: 150, length: 0.3, volume: 0.7 },
  },
  20: {
    id: 20, name: 'Raticate', types: ['Normal'],
    baseStats: { hp: 55, attack: 81, defense: 60, speed: 97, special: 50 },
    catchRate: 90, baseExp: 116, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [
      { level: 1, moveId: 33 }, { level: 7, moveId: 28 },
      { level: 14, moveId: 44 }, { level: 20, moveId: 98 },
    ],
    evolutions: [],
    cry: { pitch: 125, length: 0.5, volume: 0.8 },
  },
  25: {
    id: 25, name: 'Pikachu', types: ['Electric'],
    baseStats: { hp: 35, attack: 55, defense: 30, speed: 90, special: 50 },
    catchRate: 190, baseExp: 82, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 45 },
      { level: 9, moveId: 84 }, { level: 16, moveId: 86 },
      { level: 20, moveId: 85 },
    ],
    evolutions: [{ method: 'item', value: 83, intoSpeciesId: 26 }],
    cry: { pitch: 160, length: 0.4, volume: 0.9 },
  },
}
