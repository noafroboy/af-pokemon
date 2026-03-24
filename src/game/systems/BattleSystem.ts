import type { BattleState, PlayerAction, AIAction } from '../types/BattleTypes'
import type { GameState } from '../types/GameState'
import type { InputManager } from '../engine/InputManager'
import { POKEMON_DATA } from '../data/pokemon'
import { processTurn } from './battle/BattleSystemCore'
import { selectAIMove } from './battle/MoveSelection'

// Re-export standalone functions for external use
export { processTurn } from './battle/BattleSystemCore'
export { selectAIMove } from './battle/MoveSelection'

export class BattleSystem {
  private input: InputManager
  private battleState: BattleState | null = null

  constructor(input: InputManager) {
    this.input = input
  }

  setBattleState(state: BattleState): void {
    this.battleState = state
  }

  getBattleState(): BattleState | null {
    return this.battleState
  }

  update(_state: GameState): 'DONE' | 'CONTINUE' {
    if (!this.battleState) return 'DONE'
    const battle = this.battleState

    if (battle.battlePhase === 'END' || battle.battleOver) {
      this.battleState = null
      return 'DONE'
    }

    if (battle.battlePhase === 'SELECT_ACTION') {
      return this.handleActionMenu(battle)
    }

    if (battle.battlePhase === 'SELECT_MOVE') {
      return this.handleMoveMenu(battle)
    }

    if (battle.awaitingInput) {
      if (this.input.wasJustPressed('z') || this.input.wasJustPressed('Enter')) {
        battle.awaitingInput = false
        battle.battlePhase = 'SELECT_ACTION'
      }
    }

    return 'CONTINUE'
  }

  private handleActionMenu(battle: BattleState): 'DONE' | 'CONTINUE' {
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
        battle.battlePhase = 'SELECT_MOVE'
        battle.cursorIndex = 0
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
      battle.battlePhase = 'SELECT_ACTION'
      battle.cursorIndex = 0
      return 'CONTINUE'
    }
    if (this.input.wasJustPressed('z') || this.input.wasJustPressed('Enter')) {
      const playerAction: PlayerAction = { type: 'FIGHT', moveIndex: battle.cursorIndex }
      const aiMoveIdx = selectAIMove(battle.wildPokemon)
      const aiAction: AIAction = { type: 'FIGHT', moveIndex: aiMoveIdx }
      const events = processTurn(battle, playerAction, aiAction)
      battle.events.push(...events)
      battle.battlePhase = battle.battleOver ? 'END' : 'SELECT_ACTION'
      battle.cursorIndex = 0
    }
    return 'CONTINUE'
  }

  private getSpeciesName(speciesId: number): string {
    return POKEMON_DATA[speciesId]?.name?.toUpperCase() ?? `#${speciesId}`
  }

  getWildPokemonName(): string {
    if (!this.battleState) return ''
    return this.getSpeciesName(this.battleState.wildPokemon.speciesId)
  }
}
