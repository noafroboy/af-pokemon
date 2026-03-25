import { describe, it, expect } from 'vitest'
import { BADGE_INDEX_MAP } from '../src/game/engine/GamePhaseUpdater'
import { POKEMON_DATA_EXT } from '../src/game/data/pokemon-data'
import pewterGym from '../src/game/data/maps/pewter-gym.json'

describe('BADGE_INDEX_MAP - correct badge→slot mapping', () => {
  it('BOULDER maps to index 0', () => {
    expect(BADGE_INDEX_MAP['BOULDER']).toBe(0)
  })
  it('CASCADE maps to index 1', () => {
    expect(BADGE_INDEX_MAP['CASCADE']).toBe(1)
  })
  it('THUNDER maps to index 2', () => {
    expect(BADGE_INDEX_MAP['THUNDER']).toBe(2)
  })
  it('RAINBOW maps to index 3', () => {
    expect(BADGE_INDEX_MAP['RAINBOW']).toBe(3)
  })
  it('SOUL maps to index 4', () => {
    expect(BADGE_INDEX_MAP['SOUL']).toBe(4)
  })
  it('MARSH maps to index 5', () => {
    expect(BADGE_INDEX_MAP['MARSH']).toBe(5)
  })
  it('VOLCANO maps to index 6', () => {
    expect(BADGE_INDEX_MAP['VOLCANO']).toBe(6)
  })
  it('EARTH maps to index 7', () => {
    expect(BADGE_INDEX_MAP['EARTH']).toBe(7)
  })
  it('covers all 8 badge slots (0-7)', () => {
    const indices = Object.values(BADGE_INDEX_MAP)
    for (let i = 0; i < 8; i++) {
      expect(indices).toContain(i)
    }
  })
  it('all 8 badge indices are unique', () => {
    const indices = Object.values(BADGE_INDEX_MAP)
    expect(new Set(indices).size).toBe(indices.length)
  })
  it('unknown badge name returns undefined (not 0)', () => {
    expect(BADGE_INDEX_MAP['FAKE_BADGE']).toBeUndefined()
  })
})

describe('Geodude (#74) species data', () => {
  it('Geodude exists in POKEMON_DATA_EXT', () => {
    expect(POKEMON_DATA_EXT[74]).toBeDefined()
  })
  it('Geodude has id 74', () => {
    expect(POKEMON_DATA_EXT[74]?.id).toBe(74)
  })
  it('Geodude has correct name', () => {
    expect(POKEMON_DATA_EXT[74]?.name).toBe('Geodude')
  })
  it('Geodude is Rock/Ground type', () => {
    expect(POKEMON_DATA_EXT[74]?.types).toEqual(['Rock', 'Ground'])
  })
  it('Geodude has Rock Throw (moveId 88) in learnset at level 1', () => {
    const learnset = POKEMON_DATA_EXT[74]?.learnset ?? []
    expect(learnset.some(e => e.level === 1 && e.moveId === 88)).toBe(true)
  })
  it('Geodude base stats match canonical Gen-1 values', () => {
    const stats = POKEMON_DATA_EXT[74]?.baseStats
    expect(stats?.hp).toBe(40)
    expect(stats?.attack).toBe(80)
    expect(stats?.defense).toBe(100)
    expect(stats?.speed).toBe(20)
    expect(stats?.special).toBe(30)
  })
})

describe('Onix (#95) species data', () => {
  it('Onix exists in POKEMON_DATA_EXT', () => {
    expect(POKEMON_DATA_EXT[95]).toBeDefined()
  })
  it('Onix has id 95', () => {
    expect(POKEMON_DATA_EXT[95]?.id).toBe(95)
  })
  it('Onix has correct name', () => {
    expect(POKEMON_DATA_EXT[95]?.name).toBe('Onix')
  })
  it('Onix is Rock/Ground type', () => {
    expect(POKEMON_DATA_EXT[95]?.types).toEqual(['Rock', 'Ground'])
  })
  it('Onix has Rock Throw (moveId 88) in learnset at level 1', () => {
    const learnset = POKEMON_DATA_EXT[95]?.learnset ?? []
    expect(learnset.some(e => e.level === 1 && e.moveId === 88)).toBe(true)
  })
  it('Onix base stats match canonical Gen-1 values', () => {
    const stats = POKEMON_DATA_EXT[95]?.baseStats
    expect(stats?.hp).toBe(35)
    expect(stats?.attack).toBe(45)
    expect(stats?.defense).toBe(160)
    expect(stats?.speed).toBe(70)
    expect(stats?.special).toBe(30)
  })
})

describe('Brock party in pewter-gym.json', () => {
  const brock = pewterGym.npcs.find(n => n.id === 'brock')

  it('Brock NPC exists in pewter-gym', () => {
    expect(brock).toBeDefined()
  })
  it('Brock has BOULDER badge reward', () => {
    expect(brock?.badgeReward).toBe('BOULDER')
  })
  it('Brock party has exactly two Pokemon', () => {
    expect(brock?.party).toHaveLength(2)
  })
  it('Brock first Pokemon is Geodude (speciesId 74) at level 12', () => {
    expect(brock?.party[0].speciesId).toBe(74)
    expect(brock?.party[0].level).toBe(12)
  })
  it('Brock second Pokemon is Onix (speciesId 95) at level 14', () => {
    expect(brock?.party[1].speciesId).toBe(95)
    expect(brock?.party[1].level).toBe(14)
  })
})
