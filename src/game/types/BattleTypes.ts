import type { PokemonInstance } from './PokemonTypes'

export type BattlePhase =
  | 'INTRO'
  | 'SELECT_ACTION'
  | 'SELECT_MOVE'
  | 'ANIMATING'
  | 'ENEMY_TURN'
  | 'CHECK_END'
  | 'END'

export interface PlayerAction {
  type: 'FIGHT' | 'ITEM' | 'RUN' | 'SWITCH'
  moveIndex?: number   // FIGHT: 0-3
  itemId?: number      // ITEM: 1=Pokeball, 2=GreatBall, 3=UltraBall
  switchTo?: number    // SWITCH: party index
}

export interface AIAction {
  type: 'FIGHT'
  moveIndex: number
}

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
  | 'IMMUNE'
  | 'MISS'

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

export interface ImmuneEvent {
  type: 'IMMUNE'
  target: 'player' | 'wild'
}

export interface MissEvent {
  type: 'MISS'
  user: 'player' | 'wild'
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
  | ImmuneEvent
  | MissEvent

export interface BattleState {
  wildPokemon: PokemonInstance
  playerPokemon: PokemonInstance
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
  battlePhase: BattlePhase
  cursorIndex: number
  sleepTurns: { player: number; wild: number }
}
