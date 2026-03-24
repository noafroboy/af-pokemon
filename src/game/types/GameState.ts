export enum GamePhase {
  TITLE = 'TITLE',
  OVERWORLD = 'OVERWORLD',
  BATTLE = 'BATTLE',
  DIALOG = 'DIALOG',
  MENU = 'MENU',
  TRANSITION = 'TRANSITION',
  TRAINER_BATTLE_INTRO = 'TRAINER_BATTLE_INTRO',
  BADGE_CEREMONY = 'BADGE_CEREMONY',
}

export interface DialogState {
  pages: string[][]
  currentPage: number
  charIndex: number
  charTimer: number
  choiceCursor: number
  isNameEntry: boolean
  currentName: string
  nameEntryFor: 'player' | 'rival' | null
}

export interface SaveSlotData {
  playerName: string
  tileX: number
  tileY: number
  currentMap: string
  partyIds: string[]
  badges: number[]
  money: number
  playTime: number
  flags: Record<string, boolean | number | string>
}

export interface SaveSlot {
  slot: 0 | 1 | 2
  state: SaveSlotData
  timestamp: number
}

// New types for menus, inventory, and save system
export interface InventoryEntry {
  itemId: number
  quantity: number
}

export type Inventory = InventoryEntry[]

export interface SaveSlotSummary {
  slot: 1 | 2 | 3
  playerName: string
  badgeCount: number
  playtimeSeconds: number
  savedAt: number
}

export interface NewSaveSlot {
  slot: 1 | 2 | 3
  schemaVersion: number
  playerName: string
  badges: boolean[]
  playtimeSeconds: number
  savedAt: number
  gameState: Partial<GameState>
}

import type { PokemonInstance } from './PokemonTypes'

export interface GameState {
  phase: GamePhase
  currentMap: string
  playerTileX: number
  playerTileY: number
  party: string[]
  partyPokemon: PokemonInstance[]
  inventory: Inventory
  activeSlot: 1 | 2 | 3 | null
  flags: Record<string, boolean | number | string>
  transitionTimer: number
  transitionTarget: {
    map: string
    tileX: number
    tileY: number
  } | null
  dialogLines: string[]
  dialogIndex: number
  dialogState?: DialogState
  trainerBattleNpcId?: string
  lastPokemonCenter?: { map: string; tileX: number; tileY: number }
  badgeCeremonyTimer?: number
}

export function createInitialGameState(): GameState {
  return {
    phase: GamePhase.OVERWORLD,
    currentMap: 'pallet-town',
    playerTileX: 10,
    playerTileY: 10,
    party: [],
    partyPokemon: [],
    inventory: [],
    activeSlot: null,
    flags: {},
    transitionTimer: 0,
    transitionTarget: null,
    dialogLines: [],
    dialogIndex: 0,
  }
}
