export enum StatusCondition {
  NONE = 'NONE',
  BURN = 'BURN',
  FREEZE = 'FREEZE',
  PARALYSIS = 'PARALYSIS',
  POISON = 'POISON',
  BAD_POISON = 'BAD_POISON',
  SLEEP = 'SLEEP',
}

export enum ExpGroup {
  FAST = 'FAST',
  MEDIUM_FAST = 'MEDIUM_FAST',
  MEDIUM_SLOW = 'MEDIUM_SLOW',
  SLOW = 'SLOW',
  ERRATIC = 'ERRATIC',
  FLUCTUATING = 'FLUCTUATING',
}

export interface CryParams {
  pitch: number
  length: number
  volume: number
}

export interface LearnsetEntry {
  level: number
  moveId: number
}

export interface EvolutionEntry {
  method: 'level' | 'item' | 'trade'
  value: number
  intoSpeciesId: number
}

export interface PokemonSpecies {
  id: number
  name: string
  types: [string] | [string, string]
  baseStats: {
    hp: number
    attack: number
    defense: number
    speed: number
    special: number
  }
  catchRate: number
  baseExp: number
  expGroup: ExpGroup
  learnset: LearnsetEntry[]
  evolutions: EvolutionEntry[]
  cry: CryParams
}

export interface PokemonIVs {
  hp: number
  attack: number
  defense: number
  speed: number
  special: number
}

export interface PokemonEVs {
  hp: number
  attack: number
  defense: number
  speed: number
  special: number
}

export interface MoveSlot {
  moveId: number
  currentPP: number
  maxPP: number
}

export interface PokemonInstance {
  uuid: string
  speciesId: number
  nickname: string | null
  level: number
  experience: number
  currentHp: number
  maxHp: number
  stats: {
    attack: number
    defense: number
    speed: number
    special: number
  }
  ivs: PokemonIVs
  evs: PokemonEVs
  status: StatusCondition
  moves: MoveSlot[]
  originalTrainer: string
  caughtAt: string | null
}
