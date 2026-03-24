'use client'

import { useRef, useEffect, useState } from 'react'
import { GameEngine } from '@/game/engine/GameEngine'
import { VIEWPORT_W, VIEWPORT_H } from '@/game/engine/Camera'
import MobileControls from './MobileControls'

const SCALE = 3

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Canvas 2D context not available')
      return
    }

    ctx.imageSmoothingEnabled = false

    let engine: GameEngine | null = null
    try {
      engine = new GameEngine(ctx)
      engineRef.current = engine
      setLoading(false)
      engine.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Failed to initialize game: ${msg}`)
      return
    }

    return () => {
      engine?.stop()
      engineRef.current = null
    }
  }, [])

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-[#1a1c2c] border-2 border-red-500"
        style={{ width: VIEWPORT_W * SCALE, height: VIEWPORT_H * SCALE }}
      >
        <div className="text-center p-4">
          <p className="text-red-400 font-pixel text-[8px] mb-2">ERROR</p>
          <p className="text-gray-300 text-[6px] font-mono">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center">
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#1a1c2c] z-10"
          style={{ width: VIEWPORT_W * SCALE, height: VIEWPORT_H * SCALE }}
        >
          <p className="text-[#f4f4f4] font-pixel text-[8px] animate-pulse">
            LOADING...
          </p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={VIEWPORT_W}
        height={VIEWPORT_H}
        data-testid="game-canvas"
        style={{
          width: VIEWPORT_W * SCALE,
          height: VIEWPORT_H * SCALE,
          imageRendering: 'pixelated',
        }}
        className="border-2 border-[#566c86]"
      />
      <MobileControls engineRef={engineRef} />
    </div>
  )
}
