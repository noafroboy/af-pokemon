'use client'
import { useState } from 'react'
import { InputManager } from '@/game/engine/InputManager'
import type { TouchButtonId } from '@/game/engine/InputManager'

type ActiveMap = Partial<Record<TouchButtonId, boolean>>

const dpadStyle = (active: boolean): React.CSSProperties => ({
  width: 52,
  height: 52,
  backgroundColor: active ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
  borderRadius: 8,
  color: 'white',
  fontSize: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  touchAction: 'none',
  userSelect: 'none',
  border: 'none',
  cursor: 'default',
})

export default function MobileControls() {
  const [active, setActive] = useState<ActiveMap>({})

  const press = (id: TouchButtonId, e: React.PointerEvent) => {
    e.preventDefault()
    InputManager.getInstance().registerTouchButton(id, true)
    setActive(prev => ({ ...prev, [id]: true }))
  }

  const release = (id: TouchButtonId) => {
    InputManager.getInstance().registerTouchButton(id, false)
    setActive(prev => ({ ...prev, [id]: false }))
  }

  const btnProps = (id: TouchButtonId) => ({
    onPointerDown: (e: React.PointerEvent) => press(id, e),
    onPointerUp: () => release(id),
    onPointerCancel: () => release(id),
    onPointerLeave: () => release(id),
  })

  return (
    <div
      data-testid="mobile-controls"
      className="block md:hidden w-full h-full flex items-end justify-between px-4 pb-2"
    >
      {/* D-Pad bottom-left */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 52px)',
          gridTemplateRows: 'repeat(3, 52px)',
          gap: 4,
        }}
      >
        <button
          data-testid="dpad-up"
          style={{ ...dpadStyle(!!active.up), gridColumn: 2, gridRow: 1 }}
          {...btnProps('up')}
        >▲</button>
        <button
          data-testid="dpad-left"
          style={{ ...dpadStyle(!!active.left), gridColumn: 1, gridRow: 2 }}
          {...btnProps('left')}
        >◄</button>
        <div style={{ gridColumn: 2, gridRow: 2, width: 52, height: 52,
          backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 8 }} />
        <button
          data-testid="dpad-right"
          style={{ ...dpadStyle(!!active.right), gridColumn: 3, gridRow: 2 }}
          {...btnProps('right')}
        >►</button>
        <button
          data-testid="dpad-down"
          style={{ ...dpadStyle(!!active.down), gridColumn: 2, gridRow: 3 }}
          {...btnProps('down')}
        >▼</button>
      </div>

      {/* START / SELECT — center-bottom */}
      <div className="flex flex-col items-center justify-end gap-2 pb-2">
        <div className="flex gap-2">
          <button
            data-testid="btn-select"
            style={{
              width: 50, height: 24,
              backgroundColor: active.select ? 'rgba(60,60,60,0.9)' : 'rgba(100,100,100,0.7)',
              borderRadius: 6, color: 'white', fontSize: 6,
              fontFamily: '"Press Start 2P", monospace',
              border: 'none', cursor: 'default', touchAction: 'none',
            }}
            {...btnProps('select')}
          >SELECT</button>
          <button
            data-testid="btn-start"
            style={{
              width: 60, height: 24,
              backgroundColor: active.start ? 'rgba(60,60,60,0.9)' : 'rgba(100,100,100,0.7)',
              borderRadius: 6, color: 'white', fontSize: 6,
              fontFamily: '"Press Start 2P", monospace',
              border: 'none', cursor: 'default', touchAction: 'none',
            }}
            {...btnProps('start')}
          >START</button>
        </div>
      </div>

      {/* B + A buttons — bottom-right */}
      <div className="flex gap-3 items-end pb-2">
        <button
          data-testid="btn-b"
          style={{
            width: 50, height: 50,
            backgroundColor: active.b ? 'rgba(20,20,140,0.9)' : 'rgba(50,50,200,0.7)',
            borderRadius: '50%', color: 'white', fontSize: 10,
            fontFamily: '"Press Start 2P", monospace',
            border: 'none', cursor: 'default', touchAction: 'none',
            marginBottom: 12,
          }}
          {...btnProps('b')}
        >B</button>
        <button
          data-testid="btn-a"
          style={{
            width: 60, height: 60,
            backgroundColor: active.a ? 'rgba(140,20,20,0.9)' : 'rgba(220,50,50,0.7)',
            borderRadius: '50%', color: 'white', fontSize: 12,
            fontFamily: '"Press Start 2P", monospace',
            border: 'none', cursor: 'default', touchAction: 'none',
          }}
          {...btnProps('a')}
        >A</button>
      </div>
    </div>
  )
}
