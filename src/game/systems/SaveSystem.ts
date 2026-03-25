'use client'

import { useState, useEffect } from 'react'
import type { GameState, NewSaveSlot, SaveSlotSummary } from '../types/GameState'

export const SAVE_KEY = 'pokebrowser_save_v1'
export const SCHEMA_VERSION = 1

let saveAvailable = true
let saveUnavailableMessage: string | null = null

export function isAvailable(): boolean {
  try {
    const testKey = '__poke_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function readStore(): Record<string, NewSaveSlot> {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, NewSaveSlot>
  } catch {
    return {}
  }
}

function writeStore(data: Record<string, NewSaveSlot>): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      saveAvailable = false
      saveUnavailableMessage = 'Save failed: storage quota exceeded.'
    } else {
      saveAvailable = false
      saveUnavailableMessage = 'Save data unavailable — progress won\'t be saved.'
    }
  }
}

export function save(slot: 1 | 2 | 3, state: GameState): void {
  if (![1, 2, 3].includes(slot)) throw new Error(`Invalid slot: ${slot}`)
  const store = readStore()
  store[String(slot)] = {
    slot,
    schemaVersion: SCHEMA_VERSION,
    playerName: String(state.flags['playerName'] ?? 'RED'),
    badges: Array.isArray(state.flags['badges']) ? state.flags['badges'] as boolean[] : [],
    playtimeSeconds: Number(state.flags['playTime'] ?? 0),
    savedAt: Date.now(),
    gameState: {
      currentMap: state.currentMap,
      playerTileX: state.playerTileX,
      playerTileY: state.playerTileY,
      party: state.party,
      partyPokemon: state.partyPokemon,
      inventory: state.inventory,
      flags: state.flags,
      activeSlot: slot,
    },
  }
  writeStore(store)
}

export function load(slot: 1 | 2 | 3): NewSaveSlot | null {
  try {
    const store = readStore()
    const entry = store[String(slot)]
    if (!entry) return null
    if (entry.schemaVersion !== SCHEMA_VERSION) return null
    if (!entry.playerName || !entry.savedAt) return null
    return entry
  } catch {
    return null
  }
}

export function listSlots(): SaveSlotSummary[] {
  const store = readStore()
  const result: SaveSlotSummary[] = []
  for (const slot of [1, 2, 3] as const) {
    const entry = store[String(slot)]
    if (entry) {
      result.push({
        slot,
        playerName: entry.playerName,
        badgeCount: Array.isArray(entry.badges) ? entry.badges.filter(Boolean).length : 0,
        playtimeSeconds: entry.playtimeSeconds,
        savedAt: entry.savedAt,
      })
    }
  }
  return result
}

export function deleteSlot(slot: 1 | 2 | 3): void {
  const store = readStore()
  delete store[String(slot)]
  writeStore(store)
}

export function autoSave(gameState: GameState): void {
  const slot = gameState.activeSlot ?? 1
  save(slot, gameState)
}

export function useStorageWarning(): { available: boolean; message: string | null } {
  const [storageOk, setStorageOk] = useState(true)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStorageOk(isAvailable())
  }, [])

  const available = storageOk && saveAvailable
  const message = available
    ? null
    : saveUnavailableMessage ?? 'Save data unavailable — progress won\'t be saved.'

  return { available, message }
}
