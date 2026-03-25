import { GamePhase } from '../types/GameState'
import type { GameState } from '../types/GameState'
import type { BattleState } from '../types/BattleTypes'
import type { PokemonInstance } from '../types/PokemonTypes'
import type { BattleSystem } from '../systems/BattleSystem'
import type { NPCSystem } from '../systems/NPCSystem'
import type { Player } from '../entities/Player'
import { TrainerNPC } from '../entities/NPC'
import { buildPartyFromEntries } from '../entities/Trainer'
import { createPokemonInstance } from '../entities/PokemonInstance'

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

export interface BattleDoneDeps {
  battle: Pick<BattleSystem, 'getLastPlayerPokemon' | 'getLastCaughtPokemon'>
  npc: Pick<NPCSystem, 'getNPCs' | 'markDefeated'>
  player: Player
  loadMap: (mapId: string) => void
}

export function createTrainerBattleState(
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

export function handleBattleDone(state: GameState, deps: BattleDoneDeps): void {
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
