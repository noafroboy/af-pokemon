'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useStorageWarning } from '@/game/systems/SaveSystem'

const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-[#1a1c2c]">
      <p className="text-[#f4f4f4] font-pixel text-xs animate-pulse">
        Loading...
      </p>
    </div>
  ),
})

function StorageWarning() {
  const { available, message } = useStorageWarning()
  const [dismissed, setDismissed] = useState(false)
  if (available || dismissed || !message) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-[#c44] text-white text-[10px] font-pixel px-3 py-1">
      <span>{message}</span>
      <button onClick={() => setDismissed(true)} className="ml-4 underline">Dismiss</button>
    </div>
  )
}

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#1a1c2c]">
      <StorageWarning />
      <GameCanvas />
      <footer className="hidden md:block mt-4 text-[#566c86] text-[8px] font-pixel text-center">
        <span>Arrow Keys: Move</span>
        <span className="mx-3">Z: Confirm</span>
        <span>X: Cancel</span>
        <span className="mx-3">Enter: Menu</span>
      </footer>
    </main>
  )
}
