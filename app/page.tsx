'use client'

import dynamic from 'next/dynamic'

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

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#1a1c2c]">
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
