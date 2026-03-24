'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useStorageWarning } from '@/game/systems/SaveSystem'
import { useSettings } from '@/hooks/useSettings'
import { VIEWPORT_W, VIEWPORT_H } from '@/game/engine/Camera'
import MobileControls from '@/components/MobileControls'
import SettingsModal from '@/components/SettingsModal'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#1a1c2c]" style={{ width: 480, height: 432 }}>
      <p className="text-[#f4f4f4] font-pixel text-xs animate-pulse">Loading...</p>
    </div>
  ),
})

function StorageWarning() {
  const { available, message } = useStorageWarning()
  const [dismissed, setDismissed] = useState(false)
  if (available || dismissed || !message) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-yellow-500 text-black text-[10px] font-pixel px-3 py-1">
      <span>{message}</span>
      <button onClick={() => setDismissed(true)} className="ml-4 underline">Dismiss</button>
    </div>
  )
}

export default function Home() {
  const { settings, updateSetting } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewportW, setViewportW] = useState(375)

  useEffect(() => {
    const update = () => {
      setViewportW(window.innerWidth)
      setIsMobile(window.innerWidth <= 768)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const canvasScale = isMobile
    ? viewportW / VIEWPORT_W
    : settings.scale

  return (
    <div className="flex flex-col h-screen bg-[#1a1c2c] items-center justify-center overflow-hidden">
      <StorageWarning />

      {/* Gear icon — always visible, top-right */}
      <button
        data-testid="settings-btn"
        onClick={() => setSettingsOpen(true)}
        className="fixed top-2 right-2 z-50 text-[#566c86] hover:text-[#f4f4f4] text-xl leading-none"
        aria-label="Settings"
      >
        ⚙
      </button>

      {/* Canvas area */}
      <div className={`flex items-center justify-center ${isMobile ? 'flex-1 w-full' : ''}`}>
        <GameCanvas scale={canvasScale} />
      </div>

      {/* Mobile controls — fixed strip at bottom */}
      <div className="block md:hidden w-full h-[120px] flex-shrink-0">
        <MobileControls />
      </div>

      {/* Desktop keyboard hint footer */}
      <footer className="hidden md:block mt-3 text-[#566c86] text-[8px] font-pixel text-center select-none">
        <span>Arrow Keys: Move</span>
        <span className="mx-3">Z: Confirm</span>
        <span>X: Cancel</span>
        <span className="mx-3">Enter: Start</span>
      </footer>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSettingChange={updateSetting}
      />
    </div>
  )
}
