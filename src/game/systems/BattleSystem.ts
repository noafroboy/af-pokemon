import type { BattleState, PlayerAction, AIAction, BattleEvent } from '../types/BattleTypes'
import type { GameState } from '../types/GameState'
import type { PokemonInstance } from '../types/PokemonTypes'
import type { InputManager } from '../engine/InputManager'
import { POKEMON_DATA } from '../data/pokemon'
import { processTurn } from './battle/BattleSystemCore'
import { selectAIMove } from './battle/MoveSelection'
import { AudioManager } from '../engine/AudioManager'

export { processTurn } from './battle/BattleSystemCore'
export { selectAIMove } from './battle/MoveSelection'

export class BattleSystem {
  private input: InputManager
  private battleState: BattleState | null = null
  private lastPlayerPokemon: PokemonInstance | null = null
  private lastCaughtPokemon: PokemonInstance | null = null

  constructor(input: InputManager) { this.input = input }

  setBattleState(state: BattleState): void {
    this.battleState = state
    this.lastPlayerPokemon = null
    this.lastCaughtPokemon = null
  }

  getBattleState(): BattleState | null { return this.battleState }
  getLastPlayerPokemon(): PokemonInstance | null { return this.lastPlayerPokemon }
  getLastCaughtPokemon(): PokemonInstance | null { return this.lastCaughtPokemon }

  update(state: GameState): 'DONE' | 'CONTINUE' {
    if (!this.battleState) return 'DONE'
    const battle = this.battleState

    if (battle.battlePhase === 'END' || battle.battleOver) {
      this.lastPlayerPokemon = battle.playerPokemon
      this.lastCaughtPokemon = battle.caughtPokemon
      this.battleState = null
      return 'DONE'
    }
    if (battle.battlePhase === 'SELECT_ACTION') return this.handleActionMenu(battle, state)
    if (battle.battlePhase === 'SELECT_MOVE') return this.handleMoveMenu(battle)
    if (battle.awaitingInput) {
      if (this.input.wasJustPressed('z') || this.input.wasJustPressed('Enter')) {
        battle.awaitingInput = false
        battle.battlePhase = 'SELECT_ACTION'
      }
    }
    return 'CONTINUE'
  }

  private handleActionMenu(battle: BattleState, state: GameState): 'DONE' | 'CONTINUE' {
    if (this.input.wasJustPressed('ArrowRight') || this.input.wasJustPressed('ArrowDown')) {
      battle.cursorIndex = (battle.cursorIndex + 1) % 4
    }
    if (this.input.wasJustPressed('ArrowLeft') || this.input.wasJustPressed('ArrowUp')) {
      battle.cursorIndex = (battle.cursorIndex + 3) % 4
    }
    if (this.input.wasJustPressed('z') || this.input.wasJustPressed('Enter')) {
      const actions = ['FIGHT', 'POKEMON', 'ITEM', 'RUN'] as const
      const choice = actions[battle.cursorIndex]
      if (choice === 'FIGHT') {
        battle.battlePhase = 'SELECT_MOVE'; battle.cursorIndex = 0
      } else if (choice === 'ITEM') {
        const ballEntry = state.inventory.find(e => e.itemId >= 1 && e.itemId <= 3)
        if (ballEntry) {
          const playerAction: PlayerAction = { type: 'ITEM', itemId: ballEntry.itemId }
          ballEntry.quantity--
          if (ballEntry.quantity <= 0) state.inventory = state.inventory.filter(e => e !== ballEntry)
          const aiAction: AIAction = { type: 'FIGHT', moveIndex: selectAIMove(battle.wildPokemon) }
          const events = processTurn(battle, playerAction, aiAction)
          battle.events.push(...events)
          this.playBattleEventSFX(events)
          battle.battlePhase = battle.battleOver ? 'END' : 'SELECT_ACTION'
          battle.cursorIndex = 0
        }
      } else if (choice === 'RUN') {
        const playerAction: PlayerAction = { type: 'RUN' }
        const aiAction: AIAction = { type: 'FIGHT', moveIndex: selectAIMove(battle.wildPokemon) }
        const events = processTurn(battle, playerAction, aiAction)
        battle.events.push(...events)
        battle.battlePhase = 'END'
      }
    }
    return 'CONTINUE'
  }

  private handleMoveMenu(battle: BattleState): 'DONE' | 'CONTINUE' {
    if (this.input.wasJustPressed('ArrowRight') || this.input.wasJustPressed('ArrowDown')) {
      battle.cursorIndex = (battle.cursorIndex + 1) % 4
    }
    if (this.input.wasJustPressed('ArrowLeft') || this.input.wasJustPressed('ArrowUp')) {
      battle.cursorIndex = (battle.cursorIndex + 3) % 4
    }
    if (this.input.wasJustPressed('x') || this.input.wasJustPressed('Escape')) {
      battle.battlePhase = 'SELECT_ACTION'; battle.cursorIndex = 0; return 'CONTINUE'
    }
    if (this.input.wasJustPressed('z') || this.input.wasJustPressed('Enter')) {
      const playerAction: PlayerAction = { type: 'FIGHT', moveIndex: battle.cursorIndex }
      const aiAction: AIAction = { type: 'FIGHT', moveIndex: selectAIMove(battle.wildPokemon) }
      const events = processTurn(battle, playerAction, aiAction)
      battle.events.push(...events)
      this.playBattleEventSFX(events)
      battle.battlePhase = battle.battleOver ? 'END' : 'SELECT_ACTION'
      battle.cursorIndex = 0
    }
    return 'CONTINUE'
  }

  private playBattleEventSFX(events: BattleEvent[]): void {
    const audio = AudioManager.getInstance()
    for (const ev of events) {
      if (ev.type === 'DAMAGE') {
        if (ev.effectiveness > 1) audio.playSFX('hit-super')
        else if (ev.effectiveness > 0 && ev.effectiveness < 1) audio.playSFX('hit-not-very')
        else audio.playSFX('hit-normal')
      } else if (ev.type === 'IMMUNE') { audio.playSFX('no-effect')
      } else if (ev.type === 'FAINT') { audio.playSFX('pokemon-faint')
      } else if (ev.type === 'EXP_GAIN') { audio.playSFX('exp-gain')
      } else if (ev.type === 'LEVEL_UP') { audio.playSFX('level-up')
      } else if (ev.type === 'CATCH_ATTEMPT') {
        for (let i = 0; i < ev.shakeCount; i++) audio.playSFX('pokeball-shake')
      } else if (ev.type === 'CATCH_RESULT' && ev.success) { audio.playSFX('catch-success') }
    }
  }

  getWildPokemonName(): string {
    if (!this.battleState) return ''
    return POKEMON_DATA[this.battleState.wildPokemon.speciesId]?.name?.toUpperCase() ?? `#${this.battleState.wildPokemon.speciesId}`
  }
}
