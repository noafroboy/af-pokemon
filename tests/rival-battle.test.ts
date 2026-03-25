import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScriptHandler } from '../src/game/engine/ScriptHandler'
import { DialogSystem } from '../src/game/systems/DialogSystem'
import { NPCSystem } from '../src/game/systems/NPCSystem'
import { createInitialGameState, GamePhase } from '../src/game/types/GameState'
import type { GameState } from '../src/game/types/GameState'
import type { GameMap } from '../src/game/types/MapTypes'
import { TrainerNPC } from '../src/game/entities/NPC'
import palletTown from '../src/game/data/maps/pallet-town.json'

function makePlayer() {
  return { tileX: 10, tileY: 10, facing: 'south' as const }
}

function makeState(): GameState {
  const s = createInitialGameState()
  s.flags['playerName'] = 'RED'
  s.flags['rivalName'] = 'BLUE'
  return s
}

describe('ScriptHandler - STARTER_TABLE_TRIGGER sets rival flags', () => {
  let handler: ScriptHandler
  let dialog: DialogSystem
  let state: GameState

  beforeEach(() => {
    handler = new ScriptHandler()
    dialog = new DialogSystem()
    state = makeState()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('sets rival_battle_pending=true after selecting Bulbasaur', () => {
    handler.handle('STARTER_TABLE_TRIGGER', state, dialog, makePlayer() as never)
    // Simulate choosing Bulbasaur (index 0)
    dialog.handleConfirm() // skip to end of page
    dialog.handleConfirm() // confirm choice
    expect(state.flags['rival_battle_pending']).toBe(true)
  })

  it('sets rivalStarterSpeciesId=4 (Charmander) when player picks Bulbasaur', () => {
    handler.handle('STARTER_TABLE_TRIGGER', state, dialog, makePlayer() as never)
    dialog.handleConfirm()
    dialog.handleConfirm() // Bulbasaur = index 0
    expect(state.flags['rivalStarterSpeciesId']).toBe(4)
  })

  it('sets rivalStarterSpeciesId=7 (Squirtle) when player picks Charmander', () => {
    handler.handle('STARTER_TABLE_TRIGGER', state, dialog, makePlayer() as never)
    dialog.handleConfirm()
    // Move cursor to Charmander (index 1)
    dialog.handleDown()
    dialog.handleConfirm()
    expect(state.flags['rivalStarterSpeciesId']).toBe(7)
  })

  it('sets rivalStarterSpeciesId=1 (Bulbasaur) when player picks Squirtle', () => {
    handler.handle('STARTER_TABLE_TRIGGER', state, dialog, makePlayer() as never)
    dialog.handleConfirm()
    // Move cursor to Squirtle (index 2)
    dialog.handleDown()
    dialog.handleDown()
    dialog.handleConfirm()
    expect(state.flags['rivalStarterSpeciesId']).toBe(1)
  })
})

describe('ScriptHandler - RIVAL_BATTLE_TRIGGER', () => {
  let handler: ScriptHandler
  let dialog: DialogSystem
  let state: GameState

  beforeEach(() => {
    handler = new ScriptHandler()
    dialog = new DialogSystem()
    state = makeState()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  it('does nothing if rival_battle_pending is false', () => {
    state.flags['rival_battle_pending'] = false
    handler.handle('RIVAL_BATTLE_TRIGGER', state, dialog, makePlayer() as never)
    expect(dialog.isActive()).toBe(false)
    expect(state.phase).toBe(GamePhase.OVERWORLD)
  })

  it('does nothing if rival_battle_pending is not set', () => {
    handler.handle('RIVAL_BATTLE_TRIGGER', state, dialog, makePlayer() as never)
    expect(dialog.isActive()).toBe(false)
    expect(state.phase).toBe(GamePhase.OVERWORLD)
  })

  it('shows dialog when rival_battle_pending is true', () => {
    state.flags['rival_battle_pending'] = true
    state.flags['rivalStarterSpeciesId'] = 4
    handler.handle('RIVAL_BATTLE_TRIGGER', state, dialog, makePlayer() as never)
    expect(dialog.isActive()).toBe(true)
    expect(state.phase).toBe(GamePhase.DIALOG)
  })

  it('sets rival_battle_pending to false after trigger', () => {
    state.flags['rival_battle_pending'] = true
    state.flags['rivalStarterSpeciesId'] = 4
    handler.handle('RIVAL_BATTLE_TRIGGER', state, dialog, makePlayer() as never)
    expect(state.flags['rival_battle_pending']).toBe(false)
  })

  it('sets trainerBattleNpcId to rival after trigger', () => {
    state.flags['rival_battle_pending'] = true
    state.flags['rivalStarterSpeciesId'] = 7
    handler.handle('RIVAL_BATTLE_TRIGGER', state, dialog, makePlayer() as never)
    expect(state.trainerBattleNpcId).toBe('rival')
  })

  it('shows RIVAL_COUNTER_AFTER dialog pages', () => {
    state.flags['rival_battle_pending'] = true
    state.flags['rivalStarterSpeciesId'] = 4
    handler.handle('RIVAL_BATTLE_TRIGGER', state, dialog, makePlayer() as never)
    const page = dialog.getCurrentPage()
    expect(page?.lines.join(' ')).toContain('POKeMON')
  })
})

describe('NPCSystem - activationFlag support', () => {
  it('rival NPC is defeated when rival_battle_pending is false', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = false
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)
    const rival = npcSystem.getNPCs().find(n => n.id === 'rival')
    expect(rival).toBeDefined()
    expect(rival?.defeated).toBe(true)
  })

  it('rival NPC is active (not defeated) when rival_battle_pending is true', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = true
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)
    const rival = npcSystem.getNPCs().find(n => n.id === 'rival')
    expect(rival).toBeDefined()
    expect(rival?.defeated).toBe(false)
  })

  it('rival NPC stays defeated after trainer_defeated_rival is set', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = true
    state.flags['trainer_defeated_rival'] = true
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)
    const rival = npcSystem.getNPCs().find(n => n.id === 'rival')
    expect(rival?.defeated).toBe(true)
  })

  it('rival NPC does not block movement once defeated', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = false // inactive → defeated
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)
    const rival = npcSystem.getNPCs().find(n => n.id === 'rival')!
    // Collision should be false for a defeated NPC
    expect(npcSystem.isCollision(rival.tileX, rival.tileY)).toBe(false)
  })

  it('rival NPC blocks movement when active', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = true
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)
    const rival = npcSystem.getNPCs().find(n => n.id === 'rival')!
    expect(npcSystem.isCollision(rival.tileX, rival.tileY)).toBe(true)
  })
})

describe('pallet-town.json - rival NPC definition', () => {
  const rivalDef = palletTown.npcs.find(n => n.id === 'rival')

  it('rival NPC exists in pallet-town', () => {
    expect(rivalDef).toBeDefined()
  })

  it('rival NPC has isTrainer=true', () => {
    expect(rivalDef?.isTrainer).toBe(true)
  })

  it('rival NPC has a party', () => {
    expect(rivalDef?.party).toBeDefined()
    expect(rivalDef?.party?.length).toBeGreaterThan(0)
  })

  it('rival NPC has no badgeReward', () => {
    expect(rivalDef?.badgeReward ?? null).toBeNull()
  })

  it('rival NPC has activationFlag=rival_battle_pending', () => {
    expect(rivalDef?.activationFlag).toBe('rival_battle_pending')
  })

  it('rival NPC has preBattleDialog', () => {
    expect(rivalDef?.preBattleDialog?.length).toBeGreaterThan(0)
  })

  it('rival NPC has postBattleDialog', () => {
    expect(rivalDef?.postBattleDialog?.length).toBeGreaterThan(0)
  })

  it('rival NPC has losRange >= 2', () => {
    expect((rivalDef?.losRange ?? 0)).toBeGreaterThanOrEqual(2)
  })
})

describe('NPCSystem - markDefeated clears rival', () => {
  it('markDefeated sets trainer_defeated_rival flag', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = true
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)
    npcSystem.markDefeated('rival', state)
    expect(state.flags['trainer_defeated_rival']).toBe(true)
  })

  it('rival cannot re-trigger LOS after being defeated', () => {
    const npcSystem = new NPCSystem()
    const state = makeState()
    state.flags['rival_battle_pending'] = true
    const map = palletTown as unknown as GameMap
    npcSystem.loadFromMap(map, state)

    const rival = npcSystem.getNPCs().find(n => n instanceof TrainerNPC && n.id === 'rival') as TrainerNPC
    expect(rival).toBeDefined()

    // Defeat the rival
    npcSystem.markDefeated('rival', state)
    expect(rival.defeated).toBe(true)

    // LOS should not trigger for defeated trainer
    const mockMap = { layers: { collision: [] } } as unknown as GameMap
    expect(rival.checkLOS(10, 6, mockMap)).toBe(false)
  })
})
