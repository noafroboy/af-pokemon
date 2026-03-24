import type { PokemonInstance } from './PokemonTypes'

export type BattleEventType =
  | 'DAMAGE'
  | 'STATUS_INFLICTED'
  | 'STAT_STAGE'
  | 'MOVE_USED'
  | 'FAINT'
  | 'CATCH_ATTEMPT'
  | 'CATCH_RESULT'
  | 'EXP_GAIN'
  | 'LEVEL_UP'
  | 'ESCAPE'
  | 'MESSAGE'

export interface DamageEvent {
  type: 'DAMAGE'
  target: 'player' | 'wild'
  amount: number
  effectiveness: number
}

export interface StatusInflictedEvent {
  type: 'STATUS_INFLICTED'
  target: 'player' | 'wild'
  status: string
}

export interface StatStageEvent {
  type: 'STAT_STAGE'
  target: 'player' | 'wild'
  stat: string
  stages: number
}

export interface MoveUsedEvent {
  type: 'MOVE_USED'
  user: 'player' | 'wild'
  moveId: number
  moveName: string
}

export interface FaintEvent {
  type: 'FAINT'
  who: 'player' | 'wild'
}

export interface CatchAttemptEvent {
  type: 'CATCH_ATTEMPT'
  ballId: number
  shakeCount: number
}

export interface CatchResultEvent {
  type: 'CATCH_RESULT'
  success: boolean
}

export interface ExpGainEvent {
  type: 'EXP_GAIN'
  partyIndex: number
  amount: number
}

export interface LevelUpEvent {
  type: 'LEVEL_UP'
  partyIndex: number
  newLevel: number
}

export interface EscapeEvent {
  type: 'ESCAPE'
  success: boolean
}

export interface MessageEvent {
  type: 'MESSAGE'
  text: string
}

export type BattleEvent =
  | DamageEvent
  | StatusInflictedEvent
  | StatStageEvent
  | MoveUsedEvent
  | FaintEvent
  | CatchAttemptEvent
  | CatchResultEvent
  | ExpGainEvent
  | LevelUpEvent
  | EscapeEvent
  | MessageEvent

export interface BattleState {
  wildPokemon: PokemonInstance
  playerPartyIndex: number
  turn: number
  events: BattleEvent[]
  pendingEvents: BattleEvent[]
  currentMessage: string
  awaitingInput: boolean
  battleOver: boolean
  playerFled: boolean
  caughtPokemon: PokemonInstance | null
  statStages: {
    player: Record<string, number>
    wild: Record<string, number>
  }
}
