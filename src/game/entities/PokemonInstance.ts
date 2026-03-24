import { v4 as uuidv4 } from 'uuid'
import type { PokemonInstance, PokemonIVs, PokemonEVs } from '../types/PokemonTypes'
import { StatusCondition } from '../types/PokemonTypes'
import { POKEMON_DATA } from '../data/pokemon'
import { MOVES_DATA } from '../data/moves'

function randomIV(): number {
  return Math.floor(Math.random() * 16)
}

function calcHp(base: number, iv: number, ev: number, level: number): number {
  const evBonus = Math.floor(Math.ceil(Math.sqrt(ev)) / 4)
  return Math.floor(((base + iv) * 2 + evBonus) * level / 100) + level + 10
}

function calcStat(base: number, iv: number, ev: number, level: number): number {
  const evBonus = Math.floor(Math.ceil(Math.sqrt(ev)) / 4)
  return Math.floor(((base + iv) * 2 + evBonus) * level / 100) + 5
}

function calcExpForLevel(expGroup: string, level: number): number {
  switch (expGroup) {
    case 'FAST':
      return Math.floor(4 * level ** 3 / 5)
    case 'MEDIUM_FAST':
      return level ** 3
    case 'MEDIUM_SLOW':
      return Math.floor(6 / 5 * level ** 3 - 15 * level ** 2 + 100 * level - 140)
    case 'SLOW':
      return Math.floor(5 * level ** 3 / 4)
    default:
      return level ** 3
  }
}

export function createPokemonInstance(
  speciesId: number,
  level: number,
  ot: string = 'WILD'
): PokemonInstance {
  const species = POKEMON_DATA[speciesId]
  if (!species) {
    throw new Error(`Unknown species ID: ${speciesId}`)
  }

  const ivs: PokemonIVs = {
    hp: randomIV(),
    attack: randomIV(),
    defense: randomIV(),
    speed: randomIV(),
    special: randomIV(),
  }

  const evs: PokemonEVs = {
    hp: 0,
    attack: 0,
    defense: 0,
    speed: 0,
    special: 0,
  }

  const maxHp = calcHp(species.baseStats.hp, ivs.hp, evs.hp, level)
  const stats = {
    attack: calcStat(species.baseStats.attack, ivs.attack, evs.attack, level),
    defense: calcStat(species.baseStats.defense, ivs.defense, evs.defense, level),
    speed: calcStat(species.baseStats.speed, ivs.speed, evs.speed, level),
    special: calcStat(species.baseStats.special, ivs.special, evs.special, level),
  }

  // Build starting moves from learnset (all moves at or below current level)
  const learnedMoves = species.learnset
    .filter(entry => entry.level <= level)
    .slice(-4) // keep last 4 learned

  const moves = learnedMoves.map(entry => {
    const move = MOVES_DATA[entry.moveId]
    return {
      moveId: entry.moveId,
      currentPP: move?.pp ?? 10,
      maxPP: move?.pp ?? 10,
    }
  })

  // Ensure at least Tackle if no moves found
  if (moves.length === 0) {
    const tackle = MOVES_DATA[33]
    moves.push({
      moveId: 33,
      currentPP: tackle?.pp ?? 35,
      maxPP: tackle?.pp ?? 35,
    })
  }

  const experience = calcExpForLevel(species.expGroup, level)

  return {
    uuid: uuidv4(),
    speciesId,
    nickname: null,
    level,
    experience,
    currentHp: maxHp,
    maxHp,
    stats,
    ivs,
    evs,
    status: StatusCondition.NONE,
    moves,
    originalTrainer: ot,
    caughtAt: null,
  }
}

export function getPokemonName(instance: PokemonInstance): string {
  if (instance.nickname) return instance.nickname
  return POKEMON_DATA[instance.speciesId]?.name ?? `#${instance.speciesId}`
}
