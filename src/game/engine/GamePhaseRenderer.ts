import { GamePhase } from '../types/GameState'
import type { GameState } from '../types/GameState'
import type { Player } from '../entities/Player'
import type { GameMap } from '../types/MapTypes'
import type { Camera } from './Camera'
import type { NPCSystem } from '../systems/NPCSystem'
import type { DialogSystem } from '../systems/DialogSystem'
import type { BattleSystem } from '../systems/BattleSystem'
import type { MenuSystem } from '../systems/MenuSystem'
import type { OnboardingSystem } from './OnboardingSystem'
import type { OverworldRenderer } from '../renderers/OverworldRenderer'
import type { BattleRenderer } from '../renderers/BattleRenderer'
import { renderDialog, renderNameEntry } from '../renderers/DialogRenderer'
import { encounterFlash } from '../renderers/TransitionRenderer'
import { VIEWPORT_W, VIEWPORT_H } from './Camera'

export interface PhaseRenderDeps {
  state: GameState
  player: Player
  currentMap: GameMap | null
  isEncounterTransition: boolean
  camera: Camera
  npc: NPCSystem
  dialog: DialogSystem
  battle: BattleSystem
  menu: MenuSystem
  onboarding: OnboardingSystem
  overworldRenderer: OverworldRenderer
  battleRenderer: BattleRenderer
}

export function renderGamePhases(
  ctx: CanvasRenderingContext2D,
  interpolation: number,
  deps: PhaseRenderDeps
): void {
  const { state, player, currentMap, camera, npc, dialog, battle, menu, onboarding, overworldRenderer, battleRenderer } = deps
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  const renderOverworld = (interp: number) => {
    if (currentMap) {
      camera.update(player.tileX, player.tileY)
      overworldRenderer.render(ctx, currentMap, player, camera, interp, npc)
    }
  }

  switch (state.phase) {
    case GamePhase.TITLE:
      onboarding.renderTitle(ctx)
      break
    case GamePhase.OVERWORLD:
      renderOverworld(interpolation)
      break
    case GamePhase.DIALOG:
      renderOverworld(0)
      if (dialog.isNameEntry) renderNameEntry(ctx, dialog)
      else renderDialog(ctx, dialog)
      break
    case GamePhase.TRANSITION: {
      renderOverworld(interpolation)
      const progress = 1 - state.transitionTimer / 18
      if (deps.isEncounterTransition) encounterFlash(ctx, progress)
      else { ctx.fillStyle = `rgba(0,0,0,${progress})`; ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H) }
      break
    }
    case GamePhase.BATTLE:
      battleRenderer.render(ctx, battle.getBattleState(), state)
      break
    case GamePhase.MENU:
      renderOverworld(0)
      menu.render(ctx, state)
      break
    case GamePhase.TRAINER_BATTLE_INTRO:
      renderOverworld(0)
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
      break
    case GamePhase.BADGE_CEREMONY:
      ctx.fillStyle = '#1a1c2c'
      ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
      ctx.fillStyle = '#FFD700'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('BADGE GET!', VIEWPORT_W / 2, VIEWPORT_H / 2)
      ctx.textAlign = 'left'
      break
  }
}
