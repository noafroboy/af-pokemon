import { GamePhase } from '../types/GameState'
import type { GameState } from '../types/GameState'
import type { BattleState } from '../types/BattleTypes'
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
import { buildPartyFromEntries } from '../entities/Trainer'
import { createPokemonInstance } from '../entities/PokemonInstance'
import type { PokemonInstance } from '../types/PokemonTypes'

export const TRANSITION_FRAMES = 18

/** Maps each Gen-1 badge name to its slot index (0–7) in state.flags['badges']. */
export const BADGE_INDEX_MAP: Record<string, number> = {
  BOULDER: 0,
  CASCADE: 1,
  THUNDER: 2,
  RAINBOW: 3,
  SOUL:    4,
  MARSH:   5,
  VOLCANO: 6,
  EARTH:   7,
}

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

function handleBattleDone(state: GameState, deps: PhaseUpdateDeps): void {
  const lastPokemon = deps.battle.getLastPlayerPokemon()
  if (lastPokemon && state.partyPokemon.length > 0) state.partyPokemon[0] = lastPokemon
  const caught = deps.battle.getLastCaughtPokemon()
  if (caught && state.partyPokemon.length < 6) {
    state.partyPokemon.push(caught)
    state.party.push(caught.uuid)
  }
  if (state.trainerBattleNpcId) {
    const npcId = state.trainerBattleNpcId
    const npcEntity = deps.npc.getNPCs().find(n => n.id === npcId) ?? null
    deps.npc.markDefeated(npcId, state)
    state.trainerBattleNpcId = undefined

    const allFainted = state.partyPokemon.every(p => p.currentHp <= 0)
    if (allFainted && state.lastPokemonCenter) {
      state.currentMap = state.lastPokemonCenter.map
      deps.player.tileX = state.lastPokemonCenter.tileX
      deps.player.tileY = state.lastPokemonCenter.tileY
      deps.loadMap(state.currentMap)
      for (const p of state.partyPokemon) p.currentHp = p.maxHp
      state.phase = GamePhase.OVERWORLD
      return
    }

    const hasBadge = npcEntity instanceof TrainerNPC && npcEntity.badgeReward != null
    if (hasBadge) {
      const badges = Array.isArray(state.flags['badges'])
        ? [...state.flags['badges'] as boolean[]] : new Array(8).fill(false)
      const badgeIndex = BADGE_INDEX_MAP[npcEntity.badgeReward!] ?? 0
      badges[badgeIndex] = true
      state.flags['badges'] = badges
      state.badgeCeremonyTimer = 120
      state.phase = GamePhase.BADGE_CEREMONY
    } else {
      state.phase = GamePhase.OVERWORLD
    }
  } else {
    const allFainted = state.partyPokemon.every(p => p.currentHp <= 0)
    if (allFainted && state.lastPokemonCenter) {
      state.currentMap = state.lastPokemonCenter.map
      deps.player.tileX = state.lastPokemonCenter.tileX
      deps.player.tileY = state.lastPokemonCenter.tileY
      deps.loadMap(state.currentMap)
      for (const p of state.partyPokemon) p.currentHp = p.maxHp
    }
    state.phase = GamePhase.OVERWORLD
  }
}

function createTrainerBattleState(
  npcEntity: TrainerNPC,
  state: GameState
): BattleState {
  let party = npcEntity.party
  // For the rival, use the dynamically determined counter-starter species
  if (npcEntity.id === 'rival' && state.flags['rivalStarterSpeciesId']) {
    party = [{ speciesId: Number(state.flags['rivalStarterSpeciesId']), level: 5 }]
  }
  const trainerOt = npcEntity.id === 'rival'
    ? String(state.flags['rivalName'] ?? 'BLUE')
    : npcEntity.trainerId
  const trainerPokemon = party.length > 0
    ? buildPartyFromEntries([party[0]], trainerOt)[0]
    : createPokemonInstance(19, 5, trainerOt)
  const playerPokemon: PokemonInstance = state.partyPokemon.length > 0
    ? JSON.parse(JSON.stringify(state.partyPokemon[0])) as PokemonInstance
    : createPokemonInstance(1, 5, 'PLAYER')
  return {
    wildPokemon: trainerPokemon,
    playerPokemon,
    playerPartyIndex: 0,
    turn: 0,
    events: [],
    pendingEvents: [],
    currentMessage: `${trainerOt} wants to battle!`,
    awaitingInput: true,
    battleOver: false,
    playerFled: false,
    caughtPokemon: null,
    statStages: { player: {}, wild: {} },
    battlePhase: 'INTRO',
    cursorIndex: 0,
    sleepTurns: { player: 0, wild: 0 },
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
