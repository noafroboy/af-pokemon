'use client'
import { useState, useCallback } from 'react'

export interface Settings {
  textSpeed: 'slow' | 'normal' | 'fast'
  musicVolume: number
  sfxVolume: number
  scale: 2 | 3 | 4
}

const SETTINGS_KEY = 'pokebrowser_settings'
export const SETTINGS_DEFAULTS: Settings = {
  textSpeed: 'normal',
  musicVolume: 80,
  sfxVolume: 80,
  scale: 3,
}

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return SETTINGS_DEFAULTS
    return { ...SETTINGS_DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return SETTINGS_DEFAULTS
  }
}

function writeSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* silent fail — settings are non-critical */
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === 'undefined') return SETTINGS_DEFAULTS
    return readSettings()
  })

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings(prev => {
        const next = { ...prev, [key]: value }
        writeSettings(next)
        return next
      })
    },
    []
  )

  return { settings, updateSetting }
}
