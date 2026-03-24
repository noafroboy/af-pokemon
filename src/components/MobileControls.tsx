'use client'

import { useEffect, type RefObject } from 'react'
import type { GameEngine } from '@/game/engine/GameEngine'
import type { GameKey } from '@/game/engine/InputManager'

interface Props {
  engineRef: RefObject<GameEngine | null>
}

const DPAD_BUTTONS: { label: string; key: GameKey; className: string }[] = [
  { label: '▲', key: 'ArrowUp', className: 'col-start-2 row-start-1' },
  { label: '◄', key: 'ArrowLeft', className: 'col-start-1 row-start-2' },
  { label: '►', key: 'ArrowRight', className: 'col-start-3 row-start-2' },
  { label: '▼', key: 'ArrowDown', className: 'col-start-2 row-start-3' },
]

const ACTION_BUTTONS: { label: string; key: GameKey }[] = [
  { label: 'A', key: 'z' },
  { label: 'B', key: 'x' },
]

export default function MobileControls({ engineRef }: Props) {
  useEffect(() => {
    const input = engineRef.current?.input
    if (!input) return

    DPAD_BUTTONS.forEach(btn => input.registerTouchButton(btn.key, btn.key))
    ACTION_BUTTONS.forEach(btn => input.registerTouchButton(btn.key, btn.key))
  }, [engineRef])

  const handlePress = (key: GameKey) => {
    engineRef.current?.input.simulateKeyDown(key)
  }

  const handleRelease = (key: GameKey) => {
    engineRef.current?.input.simulateKeyUp(key)
  }

  return (
    <div className="flex justify-between w-full mt-2 md:hidden px-4">
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1">
        {DPAD_BUTTONS.map(btn => (
          <button
            key={btn.key}
            className={`${btn.className} w-10 h-10 bg-[#566c86] text-white rounded text-sm font-bold active:bg-[#3a4a60] select-none`}
            onPointerDown={() => handlePress(btn.key)}
            onPointerUp={() => handleRelease(btn.key)}
            onPointerLeave={() => handleRelease(btn.key)}
            aria-label={btn.key}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 items-end pb-2">
        {ACTION_BUTTONS.map(btn => (
          <button
            key={btn.key}
            className="w-12 h-12 rounded-full bg-[#cc4444] text-white font-pixel text-xs active:bg-[#aa2222] select-none"
            onPointerDown={() => handlePress(btn.key)}
            onPointerUp={() => handleRelease(btn.key)}
            onPointerLeave={() => handleRelease(btn.key)}
            aria-label={btn.label}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
