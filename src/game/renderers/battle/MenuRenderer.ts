import type { PokemonInstance } from '../../types/PokemonTypes'
import { MOVES_DATA } from '../../data/moves'

const FONT = '6px "Press Start 2P", monospace'
const DIALOG_Y = 96   // 144 - 48
const VIEWPORT_W = 160

const TYPE_COLORS: Record<string, string> = {
  Normal: '#aaa', Fire: '#f44', Water: '#44f', Electric: '#ff0',
  Grass: '#4a4', Ice: '#4ef', Fighting: '#a44', Poison: '#a4a',
  Ground: '#aa6', Flying: '#88f', Psychic: '#f4a', Bug: '#8a4',
  Rock: '#a84', Ghost: '#446', Dragon: '#84f', Dark: '#422',
  Steel: '#888', Fairy: '#f8f',
}

export function drawActionMenu(ctx: CanvasRenderingContext2D, cursorIndex: number): void {
  const menuX = VIEWPORT_W - 76
  const menuY = DIALOG_Y + 4
  const actions = [['FIGHT', 'POKEMON'], ['ITEM', 'RUN']]

  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(menuX, menuY, 74, 44)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(menuX, menuY, 74, 44)

  ctx.font = FONT
  ctx.textAlign = 'left'

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const idx = row * 2 + col
      const x = menuX + 4 + col * 36
      const y = menuY + 14 + row * 18
      const label = actions[row][col]

      ctx.fillStyle = idx === cursorIndex ? '#000' : '#444'
      if (idx === cursorIndex) {
        ctx.fillText('►', x - 6, y)
      }
      ctx.fillText(label, x, y)
    }
  }
}

export function drawMoveMenu(ctx: CanvasRenderingContext2D, pokemon: PokemonInstance, cursorIndex: number): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, DIALOG_Y, VIEWPORT_W, 48)
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 2
  ctx.strokeRect(2, DIALOG_Y + 2, VIEWPORT_W - 4, 44)

  ctx.font = FONT
  ctx.textAlign = 'left'

  const moves = pokemon.moves.slice(0, 4)
  for (let i = 0; i < 4; i++) {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 8 + col * 78
    const y = DIALOG_Y + 14 + row * 18

    if (i >= moves.length) continue

    const slot = moves[i]
    const move = MOVES_DATA[slot.moveId]
    const moveName = move?.name ?? '---'
    const moveType = move?.type ?? 'Normal'
    const pp = `${slot.currentPP}/${slot.maxPP}`

    // Cursor
    ctx.fillStyle = '#f4f4f4'
    if (i === cursorIndex) {
      ctx.fillText('►', x - 6, y)
    }

    ctx.fillText(moveName, x, y)

    // Type badge
    const typeColor = TYPE_COLORS[moveType] ?? '#888'
    ctx.fillStyle = typeColor
    ctx.fillRect(x, y + 2, 20, 6)
    ctx.fillStyle = '#fff'
    ctx.font = '4px monospace'
    ctx.fillText(moveType.substring(0, 3).toUpperCase(), x + 1, y + 7)
    ctx.font = FONT

    // PP
    ctx.fillStyle = slot.currentPP === 0 ? '#cc4444' : '#888'
    ctx.fillText(pp, x + 56, y)
  }
}

export function drawDialogText(ctx: CanvasRenderingContext2D, message: string, awaitingInput: boolean): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, DIALOG_Y, VIEWPORT_W, 48)
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 2
  ctx.strokeRect(2, DIALOG_Y + 2, VIEWPORT_W - 4, 44)

  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'left'

  const lines = wrapText(message, 24).slice(0, 3)
  lines.forEach((line, i) => {
    ctx.fillText(line, 8, DIALOG_Y + 14 + i * 12)
  })

  if (awaitingInput) {
    const frame = Math.floor(Date.now() / 400) % 2
    if (frame === 0) {
      ctx.fillText('▶', VIEWPORT_W - 14, 140)
    }
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
  return lines
}
