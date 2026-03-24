'use client'
import { useEffect } from 'react'
import type { Settings } from '@/hooks/useSettings'

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: Settings
  onSettingChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}

const TEXT_SPEEDS = ['slow', 'normal', 'fast'] as const
const SCALES = [2, 3, 4] as const

export default function SettingsModal({ isOpen, onClose, settings, onSettingChange }: Props) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      data-testid="settings-modal"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1c2c] border-2 border-[#566c86] p-6 rounded w-[280px]"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-pixel text-[10px] text-[#f4f4f4] mb-4">SETTINGS</h2>

        <div className="mb-4">
          <p className="font-pixel text-[8px] text-[#f4f4f4] mb-2">TEXT SPEED</p>
          <div className="flex gap-2">
            {TEXT_SPEEDS.map(speed => (
              <button
                key={speed}
                onClick={() => onSettingChange('textSpeed', speed)}
                className={`font-pixel text-[6px] px-2 py-1 rounded ${
                  settings.textSpeed === speed
                    ? 'bg-[#566c86] text-white'
                    : 'bg-[#2a2c3c] text-[#f4f4f4] hover:bg-[#3a3c4c]'
                }`}
              >
                {speed.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="font-pixel text-[8px] text-[#f4f4f4] mb-2">MUSIC {settings.musicVolume}%</p>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.musicVolume}
            onChange={e => onSettingChange('musicVolume', Number(e.target.value))}
            className="w-full accent-[#566c86]"
          />
        </div>

        <div className="mb-4">
          <p className="font-pixel text-[8px] text-[#f4f4f4] mb-2">SFX {settings.sfxVolume}%</p>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.sfxVolume}
            onChange={e => onSettingChange('sfxVolume', Number(e.target.value))}
            className="w-full accent-[#566c86]"
          />
        </div>

        <div className="hidden md:block mb-4">
          <p className="font-pixel text-[8px] text-[#f4f4f4] mb-2">SCALE</p>
          <div className="flex gap-2">
            {SCALES.map(s => (
              <button
                key={s}
                onClick={() => onSettingChange('scale', s)}
                className={`font-pixel text-[6px] px-2 py-1 rounded ${
                  settings.scale === s
                    ? 'bg-[#566c86] text-white'
                    : 'bg-[#2a2c3c] text-[#f4f4f4] hover:bg-[#3a3c4c]'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="font-pixel text-[8px] text-[#566c86] underline hover:text-[#7a8ca0]"
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}
