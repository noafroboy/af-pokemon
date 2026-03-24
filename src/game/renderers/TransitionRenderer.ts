const VIEWPORT_W = 160
const VIEWPORT_H = 144

/**
 * Encounter flash: scanline expand from center outward.
 * progress=0 → no effect; progress=1 → full black.
 */
export function encounterFlash(ctx: CanvasRenderingContext2D, progress: number): void {
  if (progress <= 0) return

  const lineH = 4
  const center = VIEWPORT_H / 2
  const expandedLines = Math.ceil(progress * (VIEWPORT_H / lineH / 2))

  // Draw alternating black/white scanlines expanding from center
  for (let i = 0; i <= expandedLines; i++) {
    const yAbove = center - i * lineH
    const yBelow = center + i * lineH

    ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff'
    if (yAbove >= 0) ctx.fillRect(0, yAbove, VIEWPORT_W, lineH)
    if (yBelow < VIEWPORT_H) ctx.fillRect(0, yBelow, VIEWPORT_W, lineH)
  }

  // At full progress, fill completely black
  if (progress >= 1) {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
  }
}

/**
 * Fade to black overlay.
 * progress=0 → transparent; progress=1 → fully black.
 */
export function fadeToBlack(ctx: CanvasRenderingContext2D, progress: number): void {
  if (progress <= 0) return
  ctx.fillStyle = `rgba(0,0,0,${Math.min(1, progress)})`
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
}

/**
 * Badge zoom + spin animation.
 * progress=0 → scale 0; progress=1 → scale 1, 360° spin.
 */
export function badgeZoom(
  ctx: CanvasRenderingContext2D,
  badgeImg: HTMLImageElement | null,
  progress: number
): void {
  const scale = Math.min(1, progress)
  const rotation = progress * Math.PI * 2
  const cx = VIEWPORT_W / 2
  const cy = VIEWPORT_H / 2

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)
  ctx.scale(scale, scale)

  if (badgeImg && badgeImg.complete) {
    const w = 32
    const h = 32
    ctx.drawImage(badgeImg, -w / 2, -h / 2, w, h)
  } else {
    // Fallback: draw a colored circle as badge placeholder
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(0, 0, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#aa8800'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}
