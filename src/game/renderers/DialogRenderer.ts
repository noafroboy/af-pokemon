import type { DialogSystem } from '../systems/DialogSystem'
import { VIEWPORT_W, VIEWPORT_H } from '../engine/Camera'

const BOX_HEIGHT = 48
const BOX_Y = VIEWPORT_H - BOX_HEIGHT
const PADDING = 6
const LINE_HEIGHT = 10
const FONT = '8px monospace'
const BOX_COLOR = '#f8f8f8'
const BORDER_COLOR = '#383838'
const TEXT_COLOR = '#000000'

// Name entry keyboard rows
const KB_ROWS = [
  'ABCDEFGHIJKLM',
  'NOPQRSTUVWXYZ',
  '0123456789   ',
]
const KB_COL_W = 10
const KB_ROW_H = 12

export function renderDialog(ctx: CanvasRenderingContext2D, system: DialogSystem): void {
  if (!system.isActive() || system.isNameEntry) return

  const page = system.getCurrentPage()
  if (!page) return

  // Draw box
  ctx.fillStyle = BORDER_COLOR
  ctx.fillRect(0, BOX_Y - 2, VIEWPORT_W, BOX_HEIGHT + 2)
  ctx.fillStyle = BOX_COLOR
  ctx.fillRect(2, BOX_Y, VIEWPORT_W - 4, BOX_HEIGHT - 2)

  ctx.font = FONT
  ctx.fillStyle = TEXT_COLOR
  ctx.textBaseline = 'top'

  // Build revealed text
  const fullText = page.lines.join('\n')
  const charIndex = system.getCharIndex()
  const revealed = fullText.slice(0, charIndex)
  const revealedLines = revealed.split('\n')

  // Draw up to 2 lines
  for (let i = 0; i < Math.min(2, page.lines.length); i++) {
    const text = revealedLines[i] ?? ''
    ctx.fillText(text, PADDING, BOX_Y + PADDING + i * LINE_HEIGHT)
  }

  // Draw choices if page is complete
  if (system.isPageComplete() && page.choices && page.choices.length > 0) {
    renderChoices(ctx, page.choices, system.getChoiceCursor())
  }

  // Blinking cursor when complete and no choices
  if (system.isPageComplete() && (!page.choices || page.choices.length === 0)) {
    const tick = Math.floor(Date.now() / 400) % 2
    if (tick === 0) {
      ctx.fillStyle = TEXT_COLOR
      ctx.fillText('▼', VIEWPORT_W - PADDING - 6, BOX_Y + BOX_HEIGHT - PADDING - LINE_HEIGHT)
    }
  }
}

function renderChoices(
  ctx: CanvasRenderingContext2D,
  choices: string[],
  cursor: number
): void {
  const boxW = 60
  const boxH = choices.length * LINE_HEIGHT + PADDING * 2
  const bx = VIEWPORT_W - boxW - 4
  const by = BOX_Y - boxH - 4

  ctx.fillStyle = BORDER_COLOR
  ctx.fillRect(bx - 2, by - 2, boxW + 4, boxH + 4)
  ctx.fillStyle = BOX_COLOR
  ctx.fillRect(bx, by, boxW, boxH)

  ctx.font = FONT
  ctx.fillStyle = TEXT_COLOR
  ctx.textBaseline = 'top'

  for (let i = 0; i < choices.length; i++) {
    const cy = by + PADDING + i * LINE_HEIGHT
    if (i === cursor) {
      ctx.fillText('▶', bx + 2, cy)
    }
    ctx.fillText(choices[i], bx + 12, cy)
  }
}

export function renderNameEntry(ctx: CanvasRenderingContext2D, system: DialogSystem): void {
  if (!system.isActive() || !system.isNameEntry) return

  const label = system.nameEntryFor === 'player' ? "YOUR NAME?" : "RIVAL'S NAME?"

  // Background
  ctx.fillStyle = BOX_COLOR
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
  ctx.strokeStyle = BORDER_COLOR
  ctx.lineWidth = 2
  ctx.strokeRect(2, 2, VIEWPORT_W - 4, VIEWPORT_H - 4)

  ctx.font = FONT
  ctx.fillStyle = TEXT_COLOR
  ctx.textBaseline = 'top'

  // Label
  ctx.fillText(label, PADDING, PADDING)

  // Current name display
  const displayName = system.currentName + '_'
  ctx.fillText(displayName, PADDING, PADDING + LINE_HEIGHT + 4)

  // Keyboard grid
  const kbStartY = PADDING + LINE_HEIGHT * 3 + 4
  for (let row = 0; row < KB_ROWS.length; row++) {
    const rowStr = KB_ROWS[row]
    for (let col = 0; col < rowStr.length; col++) {
      const ch = rowStr[col]
      if (ch === ' ') continue
      const kx = PADDING + col * KB_COL_W
      const ky = kbStartY + row * KB_ROW_H
      ctx.fillText(ch, kx, ky)
    }
  }

  // Hint
  ctx.fillText('ENTER=Confirm  BACKSPACE=Del', PADDING, VIEWPORT_H - PADDING - LINE_HEIGHT)
}
