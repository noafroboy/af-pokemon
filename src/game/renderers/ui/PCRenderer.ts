import type { PokemonInstance } from '../../types/PokemonTypes'

const FONT = '6px "Press Start 2P", monospace'
const SMALL = '4px "Press Start 2P", monospace'
const VIEWPORT_W = 160
const VIEWPORT_H = 144
const COLS = 6
const ROWS = 5
const CELL_W = 24
const CELL_H = 24

export function renderPCScreen(
  ctx: CanvasRenderingContext2D,
  pc: PokemonInstance[],
  selectedIndex: number
): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.fillText('PC BOX', VIEWPORT_W / 2, 10)

  if (pc.length === 0) {
    ctx.fillStyle = '#566c86'
    ctx.fillText('No Pokemon stored.', VIEWPORT_W / 2, VIEWPORT_H / 2)
    return
  }

  const offsetX = (VIEWPORT_W - COLS * CELL_W) / 2
  const offsetY = 16

  for (let i = 0; i < ROWS * COLS; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = offsetX + col * CELL_W
    const y = offsetY + row * CELL_H
    const poke = pc[i]

    ctx.strokeStyle = i === selectedIndex ? '#f4f4f4' : '#334'
    ctx.lineWidth = i === selectedIndex ? 2 : 1
    ctx.fillStyle = poke ? '#2a3c5c' : '#1e2838'
    ctx.fillRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2)
    ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2)

    if (poke) {
      ctx.fillStyle = '#445'
      ctx.fillRect(x + 4, y + 4, 16, 16)
    }
  }
}

export function renderSavingAnimation(ctx: CanvasRenderingContext2D, progress: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, VIEWPORT_H - 24, VIEWPORT_W, 24)
  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  const dots = '.'.repeat((Math.floor(progress * 6) % 4))
  ctx.fillText(`SAVING${dots}`, VIEWPORT_W / 2, VIEWPORT_H - 8)
}

export function renderToast(ctx: CanvasRenderingContext2D, message: string, alpha: number): void {
  if (alpha <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(4, 2, VIEWPORT_W - 8, 14)
  ctx.strokeStyle = '#c44'
  ctx.lineWidth = 1
  ctx.strokeRect(4, 2, VIEWPORT_W - 8, 14)
  ctx.fillStyle = '#f4f4f4'
  ctx.font = SMALL
  ctx.textAlign = 'center'
  ctx.fillText(message.substring(0, 32), VIEWPORT_W / 2, 11)
  ctx.restore()
}
