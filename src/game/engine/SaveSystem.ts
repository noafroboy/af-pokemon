import type { SaveSlot, SaveSlotData } from '../types/GameState'

const SAVE_KEY_PREFIX = 'pokebrowser_save_'

function isValidSaveSlot(data: unknown): data is SaveSlotData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d['playerName'] === 'string' &&
    typeof d['tileX'] === 'number' &&
    typeof d['tileY'] === 'number' &&
    typeof d['currentMap'] === 'string' &&
    Array.isArray(d['partyIds']) &&
    Array.isArray(d['badges']) &&
    typeof d['money'] === 'number' &&
    typeof d['playTime'] === 'number' &&
    typeof d['flags'] === 'object' && d['flags'] !== null
  )
}

export function saveGame(slot: 0 | 1 | 2, state: SaveSlotData): boolean {
  try {
    const saveSlot: SaveSlot = {
      slot,
      state,
      timestamp: Date.now(),
    }
    localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, JSON.stringify(saveSlot))
    return true
  } catch (err) {
    console.error('SaveSystem: failed to save game:', err)
    return false
  }
}

export function loadGame(slot: 0 | 1 | 2): SaveSlot | null {
  try {
    const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`)
    if (!raw) return null

    const parsed = JSON.parse(raw) as unknown
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('state' in (parsed as object)) ||
      !('timestamp' in (parsed as object))
    ) {
      return null
    }

    const save = parsed as SaveSlot
    if (!isValidSaveSlot(save.state)) {
      console.warn('SaveSystem: invalid save data shape in slot', slot)
      return null
    }

    return save
  } catch (err) {
    console.error('SaveSystem: failed to load game from slot', slot, err)
    return null
  }
}

export function hasSave(slot: 0 | 1 | 2): boolean {
  try {
    return localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`) !== null
  } catch {
    return false
  }
}

export function deleteSave(slot: 0 | 1 | 2): void {
  try {
    localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`)
  } catch (err) {
    console.error('SaveSystem: failed to delete save in slot', slot, err)
  }
}

export function getDefaultSaveData(playerName = 'RED'): SaveSlotData {
  return {
    playerName,
    tileX: 10,
    tileY: 10,
    currentMap: 'pallet-town',
    partyIds: [],
    badges: [],
    money: 3000,
    playTime: 0,
    flags: {},
  }
}
