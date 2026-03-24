import { describe, it, expect, vi } from 'vitest'
import { TrainerNPC } from '../src/game/entities/NPC'
import { buildPartyFromEntries } from '../src/game/entities/Trainer'
import type { GameMap } from '../src/game/types/MapTypes'

function makeTrainer(tileX: number, tileY: number, facing: 'north' | 'south' | 'east' | 'west', losRange = 3): TrainerNPC {
  return new TrainerNPC(
    'test-trainer',
    tileX,
    tileY,
    facing,
    10,
    [['Test dialog']],
    'test-trainer',
    [{ speciesId: 19, level: 4 }],
    100,
    losRange,
    ['Pre battle'],
    ['Post battle'],
    null
  )
}

function makeMap(): GameMap {
  return {
    id: 'test',
    width: 20,
    height: 20,
    tileSize: 16,
    tilesetPath: '',
    layers: { terrain: [], objects: [], collision: [] },
    warps: [],
    npcs: [],
    encounters: null,
    scriptZones: [],
    music: '',
  }
}

describe('TrainerNPC - LOS detection', () => {
  it('south-facing trainer spots player directly south within range', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    const map = makeMap()
    // Player at (10, 12) = 2 tiles south
    expect(trainer.checkLOS(10, 12, map)).toBe(true)
  })

  it('south-facing trainer spots player 1 tile south', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    expect(trainer.checkLOS(10, 11, makeMap())).toBe(true)
  })

  it('north-facing trainer spots player directly north', () => {
    const trainer = makeTrainer(10, 10, 'north', 3)
    expect(trainer.checkLOS(10, 8, makeMap())).toBe(true)
  })

  it('east-facing trainer spots player to the east', () => {
    const trainer = makeTrainer(10, 10, 'east', 3)
    expect(trainer.checkLOS(12, 10, makeMap())).toBe(true)
  })

  it('west-facing trainer spots player to the west', () => {
    const trainer = makeTrainer(10, 10, 'west', 3)
    expect(trainer.checkLOS(8, 10, makeMap())).toBe(true)
  })

  it('does not detect player behind trainer (north-facing, player south)', () => {
    const trainer = makeTrainer(10, 10, 'north', 3)
    expect(trainer.checkLOS(10, 12, makeMap())).toBe(false)
  })

  it('does not detect player diagonally', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    expect(trainer.checkLOS(11, 12, makeMap())).toBe(false)
  })
})

describe('TrainerNPC - LOS blocked outside range', () => {
  it('player beyond losRange is not detected', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    // Player 4 tiles south = out of range 3
    expect(trainer.checkLOS(10, 14, makeMap())).toBe(false)
  })

  it('player exactly at losRange is detected', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    expect(trainer.checkLOS(10, 13, makeMap())).toBe(true)
  })

  it('losRange=0 detects nobody', () => {
    const trainer = makeTrainer(10, 10, 'south', 0)
    expect(trainer.checkLOS(10, 11, makeMap())).toBe(false)
  })
})

describe('TrainerNPC - defeated flag', () => {
  it('defeated trainer does not detect player', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    trainer.defeated = true
    expect(trainer.checkLOS(10, 12, makeMap())).toBe(false)
  })

  it('trainer in non-IDLE approach phase does not re-trigger LOS', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    trainer.approachPhase = 'EXCLAIM'
    expect(trainer.checkLOS(10, 12, makeMap())).toBe(false)
  })
})

describe('buildTrainerParty - creates correct species+level', () => {
  it('creates party with given species and level', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const party = buildPartyFromEntries(
      [{ speciesId: 1, level: 5 }],
      'TRAINER'
    )
    vi.restoreAllMocks()
    expect(party).toHaveLength(1)
    expect(party[0].speciesId).toBe(1)
    expect(party[0].level).toBe(5)
    expect(party[0].originalTrainer).toBe('TRAINER')
  })

  it('creates multi-pokemon party', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const party = buildPartyFromEntries(
      [{ speciesId: 1, level: 12 }, { speciesId: 4, level: 14 }],
      'BROCK'
    )
    vi.restoreAllMocks()
    expect(party).toHaveLength(2)
    expect(party[0].speciesId).toBe(1)
    expect(party[0].level).toBe(12)
    expect(party[1].speciesId).toBe(4)
    expect(party[1].level).toBe(14)
  })
})

describe('TrainerNPC - post-defeat dialog', () => {
  it('returns post-battle dialog when defeated', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    trainer.defeated = true
    expect(trainer.postBattleDialog).toEqual(['Post battle'])
  })

  it('returns pre-battle dialog when not defeated', () => {
    const trainer = makeTrainer(10, 10, 'south', 3)
    expect(trainer.preBattleDialog).toEqual(['Pre battle'])
  })
})
