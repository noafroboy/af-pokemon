import type { GameState } from '../types/GameState'
import { GamePhase } from '../types/GameState'
import type { DialogSystem } from '../systems/DialogSystem'
import { VIEWPORT_W, VIEWPORT_H } from './Camera'

const TITLE_BLINK_MS = 600

export class OnboardingSystem {
  private blinkTimer = 0
  private blinkOn = true
  private phase: 'TITLE' | 'OAK_INTRO' | 'PLAYER_NAME' | 'RIVAL_NAME' | 'DONE' = 'TITLE'
  private dialogStarted = false

  isNewGame(state: GameState): boolean {
    return !state.flags['NEW_GAME_STARTED']
  }

  update(dt: number, state: GameState, dialog: DialogSystem, input: { wasJustPressed(k: string): boolean }): void {
    if (state.phase === GamePhase.TITLE) {
      this.blinkTimer += dt
      if (this.blinkTimer >= TITLE_BLINK_MS) {
        this.blinkTimer -= TITLE_BLINK_MS
        this.blinkOn = !this.blinkOn
      }

      if (input.wasJustPressed('Enter') || input.wasJustPressed(' ')) {
        this.phase = 'OAK_INTRO'
        this.dialogStarted = false
        state.phase = GamePhase.DIALOG
      }
      return
    }

    if (state.phase !== GamePhase.DIALOG) return

    if (this.phase === 'OAK_INTRO') {
      if (!this.dialogStarted) {
        this.dialogStarted = true
        dialog.startDialog([
          { lines: ["Hello there! Welcome to", "the world of POKeMON!"] },
          { lines: ["My name is OAK!", "People call me the POKeMON PROF!"] },
          { lines: ["This world is inhabited by creatures", "called POKeMON!"] },
        ])
      }
      if (!dialog.isActive()) {
        this.phase = 'PLAYER_NAME'
        this.dialogStarted = false
      }
      return
    }

    if (this.phase === 'PLAYER_NAME') {
      if (!this.dialogStarted) {
        this.dialogStarted = true
        dialog.startNameEntry('player', 'RED', (name) => {
          state.flags['playerName'] = name
          this.phase = 'RIVAL_NAME'
          this.dialogStarted = false
        })
      }
      return
    }

    if (this.phase === 'RIVAL_NAME') {
      if (!this.dialogStarted) {
        this.dialogStarted = true
        dialog.startNameEntry('rival', 'BLUE', (name) => {
          state.flags['rivalName'] = name
          this.phase = 'DONE'
        })
      }
      return
    }

    if (this.phase === 'DONE') {
      state.flags['NEW_GAME_STARTED'] = true
      state.phase = GamePhase.OVERWORLD
      state.currentMap = 'pallet-town'
      state.playerTileX = 10
      state.playerTileY = 10
      this.phase = 'TITLE'
    }
  }

  renderTitle(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1a1c2c'
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

    ctx.fillStyle = '#e8e8e8'
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('POKeMON', VIEWPORT_W / 2, VIEWPORT_H / 3)

    ctx.font = '6px monospace'
    ctx.fillStyle = '#aaaaaa'
    ctx.fillText('BROWSER EDITION', VIEWPORT_W / 2, VIEWPORT_H / 3 + 16)

    if (this.blinkOn) {
      ctx.fillStyle = '#ffffff'
      ctx.font = '7px monospace'
      ctx.fillText('PRESS ENTER', VIEWPORT_W / 2, VIEWPORT_H * 2 / 3)
    }

    ctx.textAlign = 'left'
  }

  isInOnboarding(): boolean {
    return this.phase !== 'TITLE' && this.phase !== 'DONE'
  }
}
