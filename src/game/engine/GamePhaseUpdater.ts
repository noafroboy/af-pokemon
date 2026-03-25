import { GamePhase } from '../types/GameState'
import type { GameState } from '../types/GameState'
import type { Player } from '../entities/Player'
import type { GameMap } from '../types/MapTypes'
import type { InputManager } from './InputManager'
import type { OverworldSystem } from '../systems/OverworldSystem'
import type { EncounterSystem } from '../systems/EncounterSystem'
import type { BattleSystem } from '../systems/BattleSystem'
import type { MenuSystem } from '../systems/MenuSystem'
import type { NPCSystem } from '../systems/NPCSystem'
import type { DialogSystem } from '../systems/DialogSystem'
import type { OnboardingSystem } from './OnboardingSystem'
import type { ScriptHandler } from './ScriptHandler'
import type { AudioManager } from './AudioManager'
import { TrainerNPC } from '../entities/NPC'
import {
  BADGE_INDEX_MAP as _BADGE_INDEX_MAP,
  createTrainerBattleState,
  handleBattleDone,
} from './BattleStateManager'

// Re-export for backward compat (tests import BADGE_INDEX_MAP from here)
export { BADGE_INDEX_MAP } from './BattleStateManager'

export const TRANSITION_FRAMES = 18

export interface PhaseUpdateCtx {
  isEncounterTransition: boolean
  pendingBattleNpc: string | null
  lastPhase: GamePhase
  pendingTrainerBattle: boolean
}

export interface PhaseUpdateDeps {
  input: InputManager
  onboarding: OnboardingSystem
  dialog: DialogSystem
  menu: MenuSystem
  overworld: OverworldSystem
  encounter: EncounterSystem
  battle: BattleSystem
  npc: NPCSystem
  script: ScriptHandler
  audio: AudioManager
  player: Player
  currentMap: GameMap | null
  loadMap: (mapId: string) => void
}

function onPhaseChange(from: GamePhase, to: GamePhase, state: GameState, deps: PhaseUpdateDeps): void {
  if (to === GamePhase.BATTLE) {
    const b = deps.battle.getBattleState()
    if (b) {
      deps.audio.playCry(b.wildPokemon.speciesId)
      deps.audio.playMusic(state.trainerBattleNpcId ? 'trainer-battle' : 'wild-battle')
    }
  } else if (to === GamePhase.BADGE_CEREMONY) {
    deps.audio.playSFX('badge-get')
  } else if (to === GamePhase.OVERWORLD && from === GamePhase.DIALOG) {
    if (deps.currentMap) deps.audio.playMusic(deps.currentMap.music)
  }
}

export function updateGamePhases(
  dt: number, state: GameState, deps: PhaseUpdateDeps, ctx: PhaseUpdateCtx
): void {
  if (state.phase !== ctx.lastPhase) {
    onPhaseChange(ctx.lastPhase, state.phase, state, deps)
    ctx.lastPhase = state.phase
  }
  const { input, onboarding, dialog, menu, overworld, encounter, battle, npc, script, player, currentMap, loadMap } = deps

  if (state.phase === GamePhase.TITLE) {
    onboarding.update(dt, state, dialog, input); input.update(); return
  }
  if (state.phase === GamePhase.DIALOG) {
    dialog.update(dt)
    if (onboarding.isInOnboarding()) {
      onboarding.update(dt, state, dialog, input)
    } else {
      if (input.wasJustPressed('Enter') || input.wasJustPressed('z')) dialog.handleConfirm()
      if (input.wasJustPressed('ArrowUp')) dialog.handleUp()
      if (input.wasJustPressed('ArrowDown')) dialog.handleDown()
      if (!dialog.isActive()) {
        if (ctx.pendingTrainerBattle) {
          ctx.pendingTrainerBattle = false
          state.phase = GamePhase.TRANSITION
          state.transitionTimer = TRANSITION_FRAMES
          state.transitionTarget = null
          ctx.isEncounterTransition = true
        } else if (state.trainerBattleNpcId) {
          // Script triggered a trainer battle (e.g., RIVAL_BATTLE_TRIGGER) — dialog already shown
          const npcId = state.trainerBattleNpcId
          const npcEntity = npc.getNPCs().find(n => n.id === npcId)
          if (npcEntity instanceof TrainerNPC) {
            battle.setBattleState(createTrainerBattleState(npcEntity, state))
          }
          state.phase = GamePhase.TRANSITION
          state.transitionTimer = TRANSITION_FRAMES
          state.transitionTarget = null
          ctx.isEncounterTransition = true
        } else {
          state.phase = GamePhase.OVERWORLD
        }
      }
    }
    input.update(); return
  }
  if (state.phase === GamePhase.BADGE_CEREMONY) {
    state.badgeCeremonyTimer = (state.badgeCeremonyTimer ?? 120) - 1
    if ((state.badgeCeremonyTimer ?? 0) <= 0) state.phase = GamePhase.OVERWORLD
    input.update(); return
  }
  if (state.phase === GamePhase.TRAINER_BATTLE_INTRO) {
    if (ctx.pendingBattleNpc) {
      const npcEntity = npc.getNPCs().find(n => n.id === ctx.pendingBattleNpc)
      if (npcEntity instanceof TrainerNPC) {
        state.trainerBattleNpcId = npcEntity.id
        const bs = createTrainerBattleState(npcEntity, state)
        battle.setBattleState(bs)
        ctx.pendingBattleNpc = null
        if (npcEntity.preBattleDialog.length > 0) {
          dialog.startDialog(npcEntity.preBattleDialog.map(line => ({ lines: [line] })))
          ctx.pendingTrainerBattle = true
          state.phase = GamePhase.DIALOG
        } else {
          state.phase = GamePhase.TRANSITION
          state.transitionTimer = TRANSITION_FRAMES
          state.transitionTarget = null
          ctx.isEncounterTransition = true
        }
      } else {
        ctx.pendingBattleNpc = null
        state.phase = GamePhase.OVERWORLD
      }
    }
    input.update(); return
  }
  if (state.phase === GamePhase.MENU) {
    menu.update(input, state)
    if (!menu.isOpen()) state.phase = GamePhase.OVERWORLD
    input.update(); return
  }

  switch (state.phase) {
    case GamePhase.OVERWORLD: {
      if (input.wasJustPressed('Enter')) { state.phase = GamePhase.MENU; menu.open(); break }
      const result = overworld.update(player, state, currentMap)
      if (result.type === 'WARP') {
        state.phase = GamePhase.TRANSITION; state.transitionTimer = TRANSITION_FRAMES
        state.transitionTarget = result.target; ctx.isEncounterTransition = false
      } else if (result.type === 'ENCOUNTER') {
        const bs = encounter.startEncounter(result.encounterTable, state)
        if (bs) {
          deps.audio.playSFX('encounter-flash')
          state.phase = GamePhase.TRANSITION; state.transitionTimer = TRANSITION_FRAMES
          state.transitionTarget = null; ctx.isEncounterTransition = true; battle.setBattleState(bs)
        }
      } else if (result.type === 'DIALOG') {
        dialog.startDialog(result.pages.map(p => ({ lines: p }))); state.phase = GamePhase.DIALOG
      } else if (result.type === 'TRAINER_SPOTTED') {
        ctx.pendingBattleNpc = result.npc.id; state.phase = GamePhase.TRAINER_BATTLE_INTRO
      } else if (result.type === 'SCRIPT') {
        script.handle(result.scriptId, state, dialog, player)
      }
      break
    }
    case GamePhase.TRANSITION: {
      state.transitionTimer--
      if (state.transitionTimer <= 0) {
        if (ctx.isEncounterTransition) {
          ctx.isEncounterTransition = false; state.phase = GamePhase.BATTLE
        } else if (state.transitionTarget) {
          state.currentMap = state.transitionTarget.map
          player.tileX = state.transitionTarget.tileX; player.tileY = state.transitionTarget.tileY
          player.pixelOffset = 0; player.moveQueue = []
          loadMap(state.currentMap); state.transitionTarget = null; state.phase = GamePhase.OVERWORLD
        } else { state.phase = GamePhase.OVERWORLD }
      }
      break
    }
    case GamePhase.BATTLE: {
      if (battle.update(state) === 'DONE') handleBattleDone(state, deps)
      break
    }
  }
  input.update()
  void dt
}
