import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveGame, loadGame, hasSave, deleteSave, getDefaultSaveData } from '../engine/SaveSystem'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('SaveSystem', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('saves and loads game data successfully', () => {
    const data = getDefaultSaveData('ASH')
    const result = saveGame(0, data)
    expect(result).toBe(true)

    const loaded = loadGame(0)
    expect(loaded).not.toBeNull()
    expect(loaded?.state.playerName).toBe('ASH')
    expect(loaded?.state.currentMap).toBe('pallet-town')
    expect(loaded?.slot).toBe(0)
  })

  it('hasSave returns false for empty slot', () => {
    expect(hasSave(1)).toBe(false)
  })

  it('hasSave returns true after saving', () => {
    saveGame(2, getDefaultSaveData())
    expect(hasSave(2)).toBe(true)
  })

  it('loadGame returns null for missing slot', () => {
    expect(loadGame(0)).toBeNull()
  })

  it('loadGame returns null for corrupt data', () => {
    localStorageMock.setItem('pokebrowser_save_0', 'not-valid-json{{{')
    const loaded = loadGame(0)
    expect(loaded).toBeNull()
  })

  it('deleteSave removes the slot', () => {
    saveGame(0, getDefaultSaveData())
    expect(hasSave(0)).toBe(true)
    deleteSave(0)
    expect(hasSave(0)).toBe(false)
  })

  it('getDefaultSaveData returns correct initial state', () => {
    const data = getDefaultSaveData('MISTY')
    expect(data.playerName).toBe('MISTY')
    expect(data.tileX).toBe(10)
    expect(data.tileY).toBe(10)
    expect(data.currentMap).toBe('pallet-town')
    expect(data.money).toBe(3000)
    expect(data.partyIds).toHaveLength(0)
  })
})
