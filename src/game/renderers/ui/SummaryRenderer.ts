import type { PokemonInstance, PokemonSpecies } from '../../types/PokemonTypes'
import { MOVES_DATA } from '../../data/moves'

const FONT = '6px "Press Start 2P", monospace'
const SMALL = '4px "Press Start 2P", monospace'
const VIEWPORT_W = 160
const VIEWPORT_H = 144

const TYPE_COLORS: Record<string, string> = {
  Normal: '#aaa', Fire: '#f44', Water: '#44f', Electric: '#ff0',
  Grass: '#4a4', Ice: '#4ef', Fighting: '#a44', Poison: '#a4a',
  Ground: '#aa6', Flying: '#88f', Psychic: '#f4a', Bug: '#8a4',
  Rock: '#a84', Ghost: '#446', Dragon: '#84f',
}

function hpColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0
  return pct > 0.5 ? '#4a4' : pct > 0.25 ? '#ca0' : '#c44'
}

export function renderPokemonSummary(
  ctx: CanvasRenderingContext2D,
  pokemon: PokemonInstance,
  species: PokemonSpecies
): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  // Sprite placeholder center-top
  ctx.fillStyle = '#334'
  ctx.fillRect(VIEWPORT_W / 2 - 32, 4, 64, 64)

  const name = pokemon.nickname ?? species.name
  ctx.fillStyle = '#f4f4f4'
  ctx.font = FONT
  ctx.textAlign = 'center'
  ctx.fillText(name.substring(0, 10), VIEWPORT_W / 2, 76)

  ctx.font = SMALL
  ctx.fillStyle = '#aac'
  ctx.fillText(`Lv ${pokemon.level}`, VIEWPORT_W / 2, 84)

  // Types
  let typeX = VIEWPORT_W / 2 - (species.types.length === 2 ? 28 : 14)
  for (const type of species.types) {
    ctx.fillStyle = TYPE_COLORS[type] ?? '#888'
    ctx.fillRect(typeX, 87, 26, 7)
    ctx.fillStyle = '#fff'
    ctx.font = SMALL
    ctx.fillText(type.substring(0, 3).toUpperCase(), typeX + 1, 93)
    typeX += 30
  }

  // HP bar
  const barW = 60
  const barX = VIEWPORT_W / 2 - barW / 2
  ctx.fillStyle = '#334'
  ctx.fillRect(barX, 97, barW, 4)
  ctx.fillStyle = hpColor(pokemon.currentHp, pokemon.maxHp)
  const filled = pokemon.maxHp > 0 ? Math.round((pokemon.currentHp / pokemon.maxHp) * barW) : 0
  ctx.fillRect(barX, 97, filled, 4)
  ctx.fillStyle = '#f4f4f4'
  ctx.font = SMALL
  ctx.textAlign = 'center'
  ctx.fillText(`${pokemon.currentHp}/${pokemon.maxHp}`, VIEWPORT_W / 2, 108)

  // Moves
  pokemon.moves.slice(0, 4).forEach((slot, i) => {
    const move = MOVES_DATA[slot.moveId]
    if (!move) return
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 4 + col * 80
    const y = 112 + row * 14
    ctx.fillStyle = TYPE_COLORS[move.type] ?? '#888'
    ctx.fillRect(x, y, 18, 6)
    ctx.fillStyle = '#fff'
    ctx.font = SMALL
    ctx.textAlign = 'left'
    ctx.fillText(move.type.substring(0, 3).toUpperCase(), x + 1, y + 5)
    ctx.fillStyle = '#f4f4f4'
    ctx.fillText(move.name.substring(0, 7), x + 20, y + 5)
    ctx.fillStyle = '#aac'
    ctx.textAlign = 'right'
    ctx.fillText(`${slot.currentPP}/${slot.maxPP}`, x + 76, y + 5)
  })
}
