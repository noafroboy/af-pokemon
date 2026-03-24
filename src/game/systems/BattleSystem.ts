import type { BattleState } from '../types/BattleTypes'
import type { GameState } from '../types/GameState'
import type { InputManager } from '../engine/InputManager'
import { POKEMON_DATA } from '../data/pokemon'

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

    if (this.battleState.awaitingInput) {
      if (this.input.wasJustPressed('z') || this.input.wasJustPressed('Enter')) {
        this.battleState.battleOver = true
        this.battleState.awaitingInput = false
      }
    }

    if (this.battleState.battleOver) {
      this.battleState = null
      return 'DONE'
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
