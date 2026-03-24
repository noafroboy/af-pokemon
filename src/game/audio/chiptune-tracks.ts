export interface NoteEvent {
  pitch: string | null
  duration: string
}

export interface TrackDefinition {
  bpm: number
  loop: boolean
  instrument: 'square' | 'triangle' | 'sawtooth' | 'pulse'
  notes: NoteEvent[]
}

import { TITLE_THEME, PALLET_TOWN, ROUTE_1, POKEMON_CENTER, VICTORY_FANFARE, BADGE_FANFARE } from './tracks/overworld-tracks'
import { WILD_BATTLE, TRAINER_BATTLE, GYM_BATTLE } from './tracks/battle-tracks'

export const CHIPTUNE_TRACKS: Record<string, TrackDefinition> = {
  'title-theme':    TITLE_THEME,
  'pallet-town':    PALLET_TOWN,
  'route-1':        ROUTE_1,
  'pokemon-center': POKEMON_CENTER,
  'victory-fanfare': VICTORY_FANFARE,
  'badge-fanfare':  BADGE_FANFARE,
  'wild-battle':    WILD_BATTLE,
  'trainer-battle': TRAINER_BATTLE,
  'gym-battle':     GYM_BATTLE,
}

export const TRACK_IDS = Object.keys(CHIPTUNE_TRACKS) as readonly string[]
