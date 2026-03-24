import type { PokemonInstance } from '../types/PokemonTypes'
import type { TrainerPartyEntry } from '../types/MapTypes'
import { createPokemonInstance } from './PokemonInstance'

export interface TrainerDefinition {
  id: string
  name: string
  spriteId: number
  party: TrainerPartyEntry[]
  moneyBase: number
  preBattleDialog: string[]
  postBattleDialog: string[]
  losRange?: number
}

export interface GymLeaderDefinition extends TrainerDefinition {
  gymName: string
  badgeName: string
  badgeIndex: number
  specialtyType: string
}

export function isGymLeader(def: TrainerDefinition): def is GymLeaderDefinition {
  return 'badgeName' in def
}

export function buildTrainerParty(def: TrainerDefinition, ot: string): PokemonInstance[] {
  return def.party.map(entry => createPokemonInstance(entry.speciesId, entry.level, ot))
}

// Convenience: build party directly from TrainerPartyEntry array
export function buildPartyFromEntries(
  entries: TrainerPartyEntry[],
  ot: string
): PokemonInstance[] {
  return entries.map(entry => createPokemonInstance(entry.speciesId, entry.level, ot))
}

// Predefined trainer data
export const TRAINER_DEFS: Record<string, TrainerDefinition> = {
  'youngster-viridian': {
    id: 'youngster-viridian',
    name: 'Youngster Joey',
    spriteId: 10,
    party: [{ speciesId: 19, level: 4 }],
    moneyBase: 40,
    preBattleDialog: ['I wanna be the very best!'],
    postBattleDialog: ['Aww, you beat me!'],
    losRange: 3,
  },
  'lass-viridian': {
    id: 'lass-viridian',
    name: 'Lass Sally',
    spriteId: 11,
    party: [{ speciesId: 10, level: 3 }, { speciesId: 13, level: 3 }],
    moneyBase: 30,
    preBattleDialog: ['Do you like cute POKeMON?'],
    postBattleDialog: ['My POKeMON were so cute though...'],
    losRange: 3,
  },
  'brock': {
    id: 'brock',
    name: 'Brock',
    spriteId: 20,
    party: [{ speciesId: 1, level: 12 }, { speciesId: 4, level: 14 }],
    moneyBase: 1386,
    preBattleDialog: ['I am Brock! The Gym Leader of Pewter City!', 'My rock-hard willpower is evident even in my POKeMON!'],
    postBattleDialog: ['You deserve the BOULDER BADGE.'],
    losRange: 0,
  } as GymLeaderDefinition & {
    gymName: string
    badgeName: string
    badgeIndex: number
    specialtyType: string
  },
}

// Override brock as gym leader
;(TRAINER_DEFS['brock'] as GymLeaderDefinition).gymName = 'Pewter Gym'
;(TRAINER_DEFS['brock'] as GymLeaderDefinition).badgeName = 'BOULDER'
;(TRAINER_DEFS['brock'] as GymLeaderDefinition).badgeIndex = 0
;(TRAINER_DEFS['brock'] as GymLeaderDefinition).specialtyType = 'Rock'
