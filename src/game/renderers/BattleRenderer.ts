import type { BattleState } from '../types/BattleTypes'
import type { GameState } from '../types/GameState'
import { encounterFlash } from './TransitionRenderer'
import { drawEnemyPanel, drawPlayerPanel } from './battle/PanelRenderer'
import type { AnimState } from './battle/PanelRenderer'
import { drawActionMenu, drawMoveMenu, drawDialogText } from './battle/MenuRenderer'

const VIEWPORT_W = 160
const VIEWPORT_H = 144

export class BattleRenderer {
  private anim: AnimState = { playerDisplayHp: 0, wildDisplayHp: 0, playerDisplayExp: 0 }
  private introProgress = 0
  private introStartTime = 0
  private introDone = false
  private lastRenderTime = 0

  render(ctx: CanvasRenderingContext2D, battle: BattleState | null, _state: GameState): void {
    ctx.imageSmoothingEnabled = false
    const now = Date.now()
    const dt = this.lastRenderTime > 0 ? now - this.lastRenderTime : 0
    this.lastRenderTime = now

    if (!battle) {
      ctx.fillStyle = '#1a1c2c'
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
      ctx.fillStyle = '#f4f4f4'
      ctx.font = '6px "Press Start 2P", monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Loading...', VIEWPORT_W / 2, VIEWPORT_H / 2)
      return
    }

    // Sync display HP toward actual HP
    this.anim.wildDisplayHp = this.lerp(this.anim.wildDisplayHp, battle.wildPokemon.currentHp, dt, 400)
    this.anim.playerDisplayHp = this.lerp(this.anim.playerDisplayHp, battle.playerPokemon.currentHp, dt, 400)

    // Draw battle background
    ctx.fillStyle = '#c8e8c8'
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H - 48)

    // Enemy sprite placeholder (front)
    ctx.fillStyle = '#666688'
    ctx.fillRect(88, 16, 48, 48)

    // Player sprite placeholder (back)
    ctx.fillStyle = '#886666'
    ctx.fillRect(16, 56, 48, 40)

    drawEnemyPanel(ctx, battle, this.anim)
    drawPlayerPanel(ctx, battle, this.anim)

    this.renderPhase(ctx, battle, now)

    // INTRO phase overlay
    if (battle.battlePhase === 'INTRO') {
      this.renderIntro(ctx, battle, now)
    }
  }

  private renderIntro(ctx: CanvasRenderingContext2D, battle: BattleState, now: number): void {
    if (!this.introDone) {
      if (this.introStartTime === 0) this.introStartTime = now
      this.introProgress = Math.min(1, (now - this.introStartTime) / 400)
      encounterFlash(ctx, this.introProgress)
      if (this.introProgress >= 1) {
        this.introDone = true
        battle.battlePhase = 'SELECT_ACTION'
        // Initialize display HP
        this.anim.wildDisplayHp = battle.wildPokemon.currentHp
        this.anim.playerDisplayHp = battle.playerPokemon.currentHp
      } else {
        drawDialogText(ctx, battle.currentMessage, false)
      }
    }
  }

  private renderPhase(ctx: CanvasRenderingContext2D, battle: BattleState, _now: number): void {
    if (battle.battlePhase === 'SELECT_ACTION') {
      drawDialogText(ctx, 'What will', false)
      drawActionMenu(ctx, battle.cursorIndex)
    } else if (battle.battlePhase === 'SELECT_MOVE') {
      drawMoveMenu(ctx, battle.playerPokemon, battle.cursorIndex)
    } else if (battle.battlePhase === 'END') {
      drawDialogText(ctx, battle.currentMessage || 'Battle ended.', battle.awaitingInput)
    } else {
      drawDialogText(ctx, battle.currentMessage, battle.awaitingInput)
    }
  }

  private lerp(current: number, target: number, dt: number, duration: number): number {
    if (duration <= 0 || current === target) return target
    const speed = Math.abs(target - current) / (duration / dt)
    if (current < target) return Math.min(target, current + speed)
    return Math.max(target, current - speed)
  }

  /** Reset animation state for a new battle */
  reset(battle: BattleState): void {
    this.anim.wildDisplayHp = battle.wildPokemon.currentHp
    this.anim.playerDisplayHp = battle.playerPokemon.currentHp
    this.anim.playerDisplayExp = battle.playerPokemon.experience
    this.introProgress = 0
    this.introStartTime = 0
    this.introDone = false
    this.lastRenderTime = 0
  }
}
