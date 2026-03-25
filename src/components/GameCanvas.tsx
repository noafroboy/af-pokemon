'use client'

import { useRef, useEffect, useState } from 'react'
import { GameEngine } from '@/game/engine/GameEngine'
import { VIEWPORT_W, VIEWPORT_H } from '@/game/engine/Camera'

interface Props {
  scale?: number
}

export default function GameCanvas({ scale = 3 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
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
    let attrsRafId: number | null = null

    try {
      engine = new GameEngine(ctx)
      setLoading(false)
      engine.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Failed to initialize game: ${msg}`)
      return
    }

    // Update data-* attributes each frame for E2E test assertions
    const updateAttrs = () => {
      if (!engine || !canvas) return
      canvas.setAttribute('data-game-phase', engine.getPhase())
      canvas.setAttribute('data-map-id', engine.getMapId())
      canvas.setAttribute('data-party-count', String(engine.getPartyCount()))
      attrsRafId = requestAnimationFrame(updateAttrs)
    }
    attrsRafId = requestAnimationFrame(updateAttrs)

    return () => {
      engine?.stop()
      if (attrsRafId !== null) cancelAnimationFrame(attrsRafId)
    }
  }, [])

  const cssW = Math.round(VIEWPORT_W * scale)
  const cssH = Math.round(VIEWPORT_H * scale)

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-[#1a1c2c] border-2 border-red-500"
        style={{ width: cssW, height: cssH }}
      >
        <div className="text-center p-4">
          <p className="text-red-400 font-pixel text-[8px] mb-2">ERROR</p>
          <p className="text-gray-300 text-[6px] font-mono">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: cssW, height: cssH }}>
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[#1a1c2c] z-10"
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
        data-game-phase="TITLE"
        data-map-id=""
        data-party-count="0"
        style={{ width: cssW, height: cssH, imageRendering: 'pixelated' }}
        className="border-2 border-[#566c86]"
      />
    </div>
  )
}
