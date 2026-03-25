import type { PokemonSpecies } from '../types/PokemonTypes'
import { ExpGroup } from '../types/PokemonTypes'
import { POKEMON_DATA_EXT } from './pokemon-data'

const POKEMON_DATA_BASE: Record<number, PokemonSpecies> = {
  1: {
    id: 1, name: 'Bulbasaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 45, attack: 49, defense: 49, speed: 45, special: 65 },
    catchRate: 45, baseExp: 64, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 45 },
      { level: 7, moveId: 73 }, { level: 13, moveId: 22 }, { level: 20, moveId: 77 },
    ],
    evolutions: [{ method: 'level', value: 16, intoSpeciesId: 2 }],
    cry: { pitch: 120, length: 0.5, volume: 0.8 },
  },
  2: {
    id: 2, name: 'Ivysaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 60, attack: 62, defense: 63, speed: 60, special: 80 },
    catchRate: 45, baseExp: 141, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 45 },
      { level: 7, moveId: 73 }, { level: 13, moveId: 22 }, { level: 20, moveId: 77 },
    ],
    evolutions: [{ method: 'level', value: 32, intoSpeciesId: 3 }],
    cry: { pitch: 100, length: 0.6, volume: 0.8 },
  },
  3: {
    id: 3, name: 'Venusaur', types: ['Grass', 'Poison'],
    baseStats: { hp: 80, attack: 82, defense: 83, speed: 80, special: 100 },
    catchRate: 45, baseExp: 208, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 45 },
      { level: 7, moveId: 73 }, { level: 13, moveId: 22 }, { level: 20, moveId: 77 },
    ],
    evolutions: [],
    cry: { pitch: 80, length: 0.8, volume: 0.9 },
  },
  4: {
    id: 4, name: 'Charmander', types: ['Fire'],
    baseStats: { hp: 39, attack: 52, defense: 43, speed: 65, special: 50 },
    catchRate: 45, baseExp: 65, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 10 }, { level: 1, moveId: 45 },
      { level: 9, moveId: 52 }, { level: 15, moveId: 53 }, { level: 20, moveId: 99 },
    ],
    evolutions: [{ method: 'level', value: 16, intoSpeciesId: 5 }],
    cry: { pitch: 130, length: 0.4, volume: 0.8 },
  },
  5: {
    id: 5, name: 'Charmeleon', types: ['Fire'],
    baseStats: { hp: 58, attack: 64, defense: 58, speed: 80, special: 65 },
    catchRate: 45, baseExp: 142, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 10 }, { level: 1, moveId: 45 },
      { level: 9, moveId: 52 }, { level: 15, moveId: 53 }, { level: 20, moveId: 99 },
    ],
    evolutions: [{ method: 'level', value: 36, intoSpeciesId: 6 }],
    cry: { pitch: 110, length: 0.5, volume: 0.8 },
  },
  6: {
    id: 6, name: 'Charizard', types: ['Fire', 'Flying'],
    baseStats: { hp: 78, attack: 84, defense: 78, speed: 100, special: 85 },
    catchRate: 45, baseExp: 209, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 10 }, { level: 1, moveId: 45 },
      { level: 9, moveId: 52 }, { level: 15, moveId: 53 }, { level: 20, moveId: 99 },
    ],
    evolutions: [],
    cry: { pitch: 90, length: 0.7, volume: 0.9 },
  },
  7: {
    id: 7, name: 'Squirtle', types: ['Water'],
    baseStats: { hp: 44, attack: 48, defense: 65, speed: 43, special: 50 },
    catchRate: 45, baseExp: 66, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 110 },
      { level: 8, moveId: 55 }, { level: 15, moveId: 111 }, { level: 20, moveId: 34 },
    ],
    evolutions: [{ method: 'level', value: 16, intoSpeciesId: 8 }],
    cry: { pitch: 125, length: 0.4, volume: 0.8 },
  },
  8: {
    id: 8, name: 'Wartortle', types: ['Water'],
    baseStats: { hp: 59, attack: 63, defense: 80, speed: 58, special: 65 },
    catchRate: 45, baseExp: 143, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 110 },
      { level: 8, moveId: 55 }, { level: 15, moveId: 111 }, { level: 20, moveId: 34 },
    ],
    evolutions: [{ method: 'level', value: 36, intoSpeciesId: 9 }],
    cry: { pitch: 105, length: 0.5, volume: 0.8 },
  },
  9: {
    id: 9, name: 'Blastoise', types: ['Water'],
    baseStats: { hp: 79, attack: 83, defense: 100, speed: 78, special: 85 },
    catchRate: 45, baseExp: 210, expGroup: ExpGroup.MEDIUM_SLOW,
    learnset: [
      { level: 1, moveId: 33 }, { level: 1, moveId: 110 },
      { level: 8, moveId: 55 }, { level: 15, moveId: 111 }, { level: 20, moveId: 34 },
    ],
    evolutions: [],
    cry: { pitch: 85, length: 0.7, volume: 0.9 },
  },
  10: {
    id: 10, name: 'Caterpie', types: ['Bug'],
    baseStats: { hp: 45, attack: 30, defense: 35, speed: 45, special: 20 },
    catchRate: 255, baseExp: 53, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [{ level: 1, moveId: 33 }],
    evolutions: [{ method: 'level', value: 7, intoSpeciesId: 11 }],
    cry: { pitch: 140, length: 0.3, volume: 0.7 },
  },
  11: {
    id: 11, name: 'Metapod', types: ['Bug'],
    baseStats: { hp: 50, attack: 20, defense: 55, speed: 30, special: 25 },
    catchRate: 120, baseExp: 72, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [{ level: 1, moveId: 106 }],
    evolutions: [{ method: 'level', value: 10, intoSpeciesId: 12 }],
    cry: { pitch: 130, length: 0.3, volume: 0.7 },
  },
  12: {
    id: 12, name: 'Butterfree', types: ['Bug', 'Flying'],
    baseStats: { hp: 60, attack: 45, defense: 50, speed: 70, special: 80 },
    catchRate: 45, baseExp: 160, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [
      { level: 12, moveId: 93 }, { level: 15, moveId: 79 },
      { level: 16, moveId: 48 }, { level: 17, moveId: 77 },
    ],
    evolutions: [],
    cry: { pitch: 115, length: 0.5, volume: 0.8 },
  },
  13: {
    id: 13, name: 'Weedle', types: ['Bug', 'Poison'],
    baseStats: { hp: 40, attack: 35, defense: 30, speed: 50, special: 20 },
    catchRate: 255, baseExp: 52, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [{ level: 1, moveId: 40 }],
    evolutions: [{ method: 'level', value: 7, intoSpeciesId: 14 }],
    cry: { pitch: 145, length: 0.3, volume: 0.7 },
  },
  14: {
    id: 14, name: 'Kakuna', types: ['Bug', 'Poison'],
    baseStats: { hp: 45, attack: 25, defense: 50, speed: 35, special: 25 },
    catchRate: 120, baseExp: 71, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [{ level: 1, moveId: 106 }],
    evolutions: [{ method: 'level', value: 10, intoSpeciesId: 15 }],
    cry: { pitch: 135, length: 0.3, volume: 0.7 },
  },
  15: {
    id: 15, name: 'Beedrill', types: ['Bug', 'Poison'],
    baseStats: { hp: 65, attack: 80, defense: 40, speed: 75, special: 45 },
    catchRate: 45, baseExp: 159, expGroup: ExpGroup.MEDIUM_FAST,
    learnset: [
      { level: 12, moveId: 31 }, { level: 16, moveId: 41 }, { level: 20, moveId: 40 },
    ],
    evolutions: [],
    cry: { pitch: 120, length: 0.5, volume: 0.8 },
  },
}

export const POKEMON_DATA: Record<number, PokemonSpecies> = {
  ...POKEMON_DATA_BASE,
  ...POKEMON_DATA_EXT,
}
