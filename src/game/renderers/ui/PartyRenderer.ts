import type { PokemonInstance } from '../../types/PokemonTypes'
import { POKEMON_DATA } from '../../data/pokemon'

const FONT = '6px "Press Start 2P", monospace'
const SMALL = '4px "Press Start 2P", monospace'
const VIEWPORT_W = 160
const VIEWPORT_H = 144
const SLOT_H = 20

function hpColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0
  if (pct > 0.5) return '#4a4'
  if (pct > 0.25) return '#ca0'
  return '#c44'
}

export function renderPartyScreen(
  ctx: CanvasRenderingContext2D,
  party: PokemonInstance[],
  selectedIndex: number,
  mode: 'view' | 'select' | 'rearrange'
): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.fillText(mode === 'select' ? 'CHOOSE POKEMON' : 'PARTY', VIEWPORT_W / 2, 10)

  if (party.length === 0) {
    ctx.fillStyle = '#566c86'
    ctx.fillText('No Pokemon in party.', VIEWPORT_W / 2, VIEWPORT_H / 2)
    return
  }

  party.slice(0, 6).forEach((poke, i) => {
    const y = 16 + i * (SLOT_H + 4)
    const isSelected = i === selectedIndex
    const name = poke.nickname ?? POKEMON_DATA[poke.speciesId]?.name ?? `#${poke.speciesId}`

    ctx.strokeStyle = isSelected ? (mode === 'rearrange' ? '#ff8' : '#f4f4f4') : '#334'
    ctx.lineWidth = isSelected && mode === 'rearrange' ? 0 : 1
    if (isSelected && mode === 'rearrange') {
      ctx.setLineDash([2, 2])
    } else {
      ctx.setLineDash([])
    }
    ctx.fillStyle = isSelected ? '#2a3c5c' : '#1e2838'
    ctx.fillRect(4, y, VIEWPORT_W - 8, SLOT_H)
    ctx.strokeRect(4, y, VIEWPORT_W - 8, SLOT_H)
    ctx.setLineDash([])

    // Sprite placeholder
    ctx.fillStyle = '#445'
    ctx.fillRect(6, y + 2, 16, 16)

    ctx.fillStyle = '#f4f4f4'
    ctx.font = FONT
    ctx.textAlign = 'left'
    ctx.fillText(name.substring(0, 8), 26, y + 9)

    ctx.fillStyle = '#aac'
    ctx.font = SMALL
    ctx.fillText(`Lv${poke.level}`, 26, y + 17)

    // HP bar
    const barX = 80
    const barW = 60
    ctx.fillStyle = '#334'
    ctx.fillRect(barX, y + 6, barW, 5)
    ctx.fillStyle = hpColor(poke.currentHp, poke.maxHp)
    const filled = poke.maxHp > 0 ? Math.round((poke.currentHp / poke.maxHp) * barW) : 0
    ctx.fillRect(barX, y + 6, filled, 5)
    ctx.fillStyle = '#f4f4f4'
    ctx.font = SMALL
    ctx.textAlign = 'right'
    ctx.fillText(`${poke.currentHp}/${poke.maxHp}`, VIEWPORT_W - 6, y + 17)
  })
}
