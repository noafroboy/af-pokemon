import type { BattleState } from '../../types/BattleTypes'
import type { PokemonInstance } from '../../types/PokemonTypes'
import { POKEMON_DATA } from '../../data/pokemon'
import { STATUS_BADGE_LABELS } from '../../systems/battle/StatusEffects'
import { getExpForLevel } from '../../systems/battle/ExpSystem'

const FONT = '6px "Press Start 2P", monospace'

export interface AnimState {
  playerDisplayHp: number
  wildDisplayHp: number
  playerDisplayExp: number
}

function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, current: number, max: number): void {
  const pct = max > 0 ? current / max : 0
  ctx.fillStyle = '#888'
  ctx.fillRect(x, y, w, 3)
  ctx.fillStyle = pct > 0.5 ? '#44cc44' : pct > 0.25 ? '#cccc00' : '#cc4444'
  ctx.fillRect(x, y, Math.round(w * Math.max(0, pct)), 3)
}

function drawStatusBadge(ctx: CanvasRenderingContext2D, pokemon: PokemonInstance, x: number, y: number): void {
  const label = STATUS_BADGE_LABELS[pokemon.status] ?? ''
  if (!label) return

  const colors: Record<string, string> = {
    PSN: '#aa44cc', SLP: '#888888', PAR: '#cccc00', BRN: '#dd6622', FRZ: '#44cccc'
  }
  const bg = colors[label] ?? '#888'
  ctx.fillStyle = bg
  ctx.fillRect(x, y - 6, 16, 7)
  ctx.fillStyle = '#fff'
  ctx.font = '4px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(label, x + 8, y)
}

function getSpeciesName(speciesId: number): string {
  return POKEMON_DATA[speciesId]?.name?.toUpperCase() ?? `#${speciesId}`
}

export function drawEnemyPanel(ctx: CanvasRenderingContext2D, battle: BattleState, anim: AnimState): void {
  const pokemon = battle.wildPokemon
  const name = getSpeciesName(pokemon.speciesId)

  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(2, 8, 76, 34)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(2, 8, 76, 34)

  ctx.fillStyle = '#000'
  ctx.font = FONT
  ctx.textAlign = 'left'
  ctx.fillText(name, 6, 18)
  ctx.fillText(`Lv${pokemon.level}`, 52, 18)

  drawHpBar(ctx, 6, 24, 68, anim.wildDisplayHp, pokemon.maxHp)
  drawStatusBadge(ctx, pokemon, 54, 32)
}

export function drawPlayerPanel(ctx: CanvasRenderingContext2D, battle: BattleState, anim: AnimState): void {
  const pokemon = battle.playerPokemon
  const name = getSpeciesName(pokemon.speciesId)

  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(82, 68, 76, 40)
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.strokeRect(82, 68, 76, 40)

  ctx.fillStyle = '#000'
  ctx.font = FONT
  ctx.textAlign = 'left'
  ctx.fillText(name, 86, 78)
  ctx.fillText(`Lv${pokemon.level}`, 136, 78)

  drawHpBar(ctx, 86, 84, 68, anim.playerDisplayHp, pokemon.maxHp)

  // EXP bar
  const species = POKEMON_DATA[pokemon.speciesId]
  if (species) {
    const curLevelExp = getExpForLevel(species.expGroup, pokemon.level)
    const nextLevelExp = getExpForLevel(species.expGroup, pokemon.level + 1)
    const range = nextLevelExp - curLevelExp
    const gained = pokemon.experience - curLevelExp
    const expPct = range > 0 ? Math.max(0, Math.min(1, gained / range)) : 0
    ctx.fillStyle = '#2244cc'
    ctx.fillRect(86, 101, Math.round(68 * expPct), 2)
  }

  drawStatusBadge(ctx, pokemon, 136, 88)
}
