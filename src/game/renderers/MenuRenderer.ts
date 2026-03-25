import type { SaveSlotSummary } from '../types/GameState'

const FONT = '6px "Press Start 2P", monospace'
const SMALL_FONT = '4px "Press Start 2P", monospace'
const VIEWPORT_W = 160
const VIEWPORT_H = 144
const PANEL_W = 72
const MENU_ITEMS = ['POKEMON', 'ITEM', 'SAVE', 'OPTIONS', 'EXIT']
const ITEM_H = 16

export type MenuAnimState = 'CLOSED' | 'OPENING' | 'OPEN' | 'CLOSING'

export function renderStartMenu(
  ctx: CanvasRenderingContext2D,
  selectedIndex: number,
  animState: MenuAnimState,
  animProgress: number
): void {
  if (animState === 'CLOSED') return

  const slideProgress = animState === 'OPEN' ? 1 : animState === 'OPENING' ? animProgress : 1 - animProgress
  const panelX = VIEWPORT_W - Math.round(PANEL_W * slideProgress)
  const panelH = ITEM_H * MENU_ITEMS.length + 8

  ctx.fillStyle = '#f4f4f4'
  ctx.fillRect(panelX, 8, PANEL_W, panelH)
  ctx.strokeStyle = '#333c57'
  ctx.lineWidth = 2
  ctx.strokeRect(panelX, 8, PANEL_W, panelH)

  ctx.font = FONT
  ctx.textAlign = 'left'

  MENU_ITEMS.forEach((label, i) => {
    const y = 8 + 10 + i * ITEM_H
    const x = panelX + 10
    ctx.fillStyle = i === selectedIndex ? '#1a1c2c' : '#444'
    if (i === selectedIndex) ctx.fillText('►', panelX + 3, y)
    ctx.fillText(label, x, y)
  })
}

export function renderSaveSlotScreen(
  ctx: CanvasRenderingContext2D,
  slots: (SaveSlotSummary | null)[],
  selectedSlot: number
): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.fillText('SAVE GAME', VIEWPORT_W / 2, 14)

  slots.forEach((slot, i) => {
    const y = 28 + i * 34
    const isSelected = i === selectedSlot
    ctx.fillStyle = isSelected ? '#333c57' : '#2a2c3c'
    ctx.fillRect(8, y, VIEWPORT_W - 16, 30)
    ctx.strokeStyle = isSelected ? '#f4f4f4' : '#566c86'
    ctx.lineWidth = 1
    ctx.strokeRect(8, y, VIEWPORT_W - 16, 30)

    ctx.textAlign = 'left'
    ctx.font = FONT
    if (slot) {
      ctx.fillStyle = '#f4f4f4'
      ctx.fillText(`SLOT ${slot.slot}: ${slot.playerName}`, 14, y + 12)
      ctx.font = SMALL_FONT
      ctx.fillStyle = '#aac'
      const mins = Math.floor(slot.playtimeSeconds / 60)
      ctx.fillText(`BADGES:${slot.badgeCount}  TIME:${mins}m`, 14, y + 22)
    } else {
      ctx.fillStyle = '#566c86'
      ctx.font = FONT
      ctx.fillText(`SLOT ${i + 1}: NEW GAME`, 14, y + 16)
    }
  })
}

export function renderOptionsScreen(
  ctx: CanvasRenderingContext2D,
  settings: Record<string, string | number>,
  selectedRow: number,
  _selectedCol: number
): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.fillText('OPTIONS', VIEWPORT_W / 2, 14)

  const rows = [
    { label: 'TEXT SPEED', key: 'textSpeed', values: ['SLOW', 'MID', 'FAST'] },
    { label: 'SOUND', key: 'sound', values: ['MONO', 'STEREO'] },
    { label: 'SCALE', key: 'scale', values: ['1X', '2X', '3X'] },
  ]

  rows.forEach((row, i) => {
    const y = 32 + i * 24
    ctx.textAlign = 'left'
    ctx.fillStyle = i === selectedRow ? '#f4f4f4' : '#888'
    ctx.font = FONT
    if (i === selectedRow) ctx.fillText('►', 4, y + 8)
    ctx.fillText(row.label, 14, y + 8)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#f4f4f4'
    ctx.fillText(String(settings[row.key] ?? row.values[0]), VIEWPORT_W - 8, y + 8)
  })
}

const BADGE_COLORS = ['#c8a', '#8ca', '#a8c', '#ca8', '#8ac', '#ac8', '#ccc', '#fc8']

export function renderBadgeCase(ctx: CanvasRenderingContext2D, badges: boolean[]): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.fillText('BADGE CASE', VIEWPORT_W / 2, 14)

  const glowT = Date.now() / 600
  for (let i = 0; i < 8; i++) {
    const col = i % 4
    const row = Math.floor(i / 4)
    const x = 24 + col * 32
    const y = 32 + row * 40

    ctx.fillStyle = badges[i] ? BADGE_COLORS[i] : '#334'
    ctx.beginPath()
    ctx.arc(x + 12, y + 12, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = badges[i] ? '#f4f4f4' : '#556'
    ctx.lineWidth = 1
    ctx.stroke()

    // Sinusoidal glow overlay for earned badges
    if (badges[i]) {
      const glowAlpha = ((Math.sin(glowT + i * 0.9) + 1) / 2) * 0.35
      ctx.globalAlpha = glowAlpha
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x + 12, y + 12, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  }
}
