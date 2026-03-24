export enum GamePhase {
  TITLE = 'TITLE',
  OVERWORLD = 'OVERWORLD',
  BATTLE = 'BATTLE',
  DIALOG = 'DIALOG',
  MENU = 'MENU',
  TRANSITION = 'TRANSITION',
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

export interface GameState {
  phase: GamePhase
  currentMap: string
  playerTileX: number
  playerTileY: number
  party: string[]
  flags: Record<string, boolean | number | string>
  transitionTimer: number
  transitionTarget: {
    map: string
    tileX: number
    tileY: number
  } | null
  dialogLines: string[]
  dialogIndex: number
}

export function createInitialGameState(): GameState {
  return {
    phase: GamePhase.OVERWORLD,
    currentMap: 'pallet-town',
    playerTileX: 10,
    playerTileY: 10,
    party: [],
    flags: {},
    transitionTimer: 0,
    transitionTarget: null,
    dialogLines: [],
    dialogIndex: 0,
  }
}
