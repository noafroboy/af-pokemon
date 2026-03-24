import type { BattleState } from '../types/BattleTypes'
import type { GameState } from '../types/GameState'
import { POKEMON_DATA } from '../data/pokemon'

const VIEWPORT_W = 160
const VIEWPORT_H = 144
const DIALOG_H = 48
const FONT = '6px "Press Start 2P", monospace'

export class BattleRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    battle: BattleState | null,
    _state: GameState
  ): void {
    ctx.imageSmoothingEnabled = false

    // Background
    ctx.fillStyle = '#c8e8c8'
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H - DIALOG_H)

    ctx.fillStyle = '#1a1c2c'
    ctx.fillRect(0, VIEWPORT_H - DIALOG_H, VIEWPORT_W, DIALOG_H)

    if (!battle) {
      this.drawText(ctx, 'Loading...', 10, VIEWPORT_H - DIALOG_H + 14)
      return
    }

    this.drawWildPokemon(ctx, battle)
    this.drawDialogBox(ctx, battle)
  }

  private drawWildPokemon(ctx: CanvasRenderingContext2D, battle: BattleState): void {
    const species = POKEMON_DATA[battle.wildPokemon.speciesId]
    const name = species?.name?.toUpperCase() ?? `#${battle.wildPokemon.speciesId}`
    const level = battle.wildPokemon.level

    // Wild Pokémon placeholder sprite
    ctx.fillStyle = '#666688'
    ctx.fillRect(88, 20, 40, 40)

    // Wild Pokémon info box
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(4, 12, 80, 32)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(4, 12, 80, 32)

    ctx.fillStyle = '#000000'
    ctx.font = FONT
    ctx.textAlign = 'left'
    ctx.fillText(name, 8, 24)
    ctx.fillText(`Lv${level}`, 8, 36)

    // HP bar
    const hpPercent = battle.wildPokemon.currentHp / battle.wildPokemon.maxHp
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(8, 38, 72, 4)
    ctx.fillStyle = hpPercent > 0.5 ? '#44cc44' : hpPercent > 0.25 ? '#cccc00' : '#cc4444'
    ctx.fillRect(8, 38, Math.round(72 * hpPercent), 4)
  }

  private drawDialogBox(ctx: CanvasRenderingContext2D, battle: BattleState): void {
    const y0 = VIEWPORT_H - DIALOG_H

    // Dialog border
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 2
    ctx.strokeRect(2, y0 + 2, VIEWPORT_W - 4, DIALOG_H - 4)

    ctx.fillStyle = '#f4f4f4'
    ctx.font = FONT
    ctx.textAlign = 'left'

    // Word-wrap message
    const msg = battle.currentMessage
    const lines = wrapText(msg, 24)
    lines.forEach((line, i) => {
      ctx.fillText(line, 8, y0 + 14 + i * 12)
    })

    // Blinking A prompt
    if (battle.awaitingInput) {
      const frame = Math.floor(Date.now() / 400) % 2
      if (frame === 0) {
        ctx.fillText('▶', VIEWPORT_W - 14, VIEWPORT_H - 8)
      }
    }
  }

  private drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
    ctx.fillStyle = '#f4f4f4'
    ctx.font = FONT
    ctx.textAlign = 'left'
    ctx.fillText(text, x, y)
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}
