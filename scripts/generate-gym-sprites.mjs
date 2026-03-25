/**
 * generate-gym-sprites.mjs — Programmatically generate pixel-art battle sprites
 * for Geodude (#74), Graveler (#75), and Onix (#95) using pngjs.
 *
 * Usage: node scripts/generate-gym-sprites.mjs
 */

import { PNG } from 'pngjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Create a blank 80x80 PNG with white background */
function createCanvas() {
  const png = new PNG({ width: 80, height: 80, filterType: -1 })
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = 255     // R
    png.data[i + 1] = 255 // G
    png.data[i + 2] = 255 // B
    png.data[i + 3] = 255 // A
  }
  return png
}

/** Set pixel at (x, y) to [r, g, b] */
function setPixel(png, x, y, r, g, b) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return
  const idx = (png.width * y + x) << 2
  png.data[idx] = r
  png.data[idx + 1] = g
  png.data[idx + 2] = b
  png.data[idx + 3] = 255
}

/** Draw a filled circle */
function fillCircle(png, cx, cy, radius, r, g, b) {
  for (let y = cy - radius; y <= cy + radius; y++) {
    for (let x = cx - radius; x <= cx + radius; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      if (dist <= radius) {
        setPixel(png, x, y, r, g, b)
      }
    }
  }
}

/** Draw a circle outline */
function strokeCircle(png, cx, cy, radius, r, g, b) {
  for (let angle = 0; angle < 360; angle++) {
    const rad = (angle * Math.PI) / 180
    const x = Math.round(cx + radius * Math.cos(rad))
    const y = Math.round(cy + radius * Math.sin(rad))
    setPixel(png, x, y, r, g, b)
  }
}

/** Draw a filled rectangle */
function fillRect(png, x, y, w, h, r, g, b) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      setPixel(png, col, row, r, g, b)
    }
  }
}

/** Draw an eye (white + black pupil) at position */
function drawEye(png, cx, cy, size = 3) {
  fillCircle(png, cx, cy, size, 255, 255, 255)
  fillCircle(png, cx, cy, Math.max(1, size - 1), 0, 0, 0)
}

/** Add rocky bump/texture dots to a circular area */
function addRockyTexture(png, cx, cy, radius, dr, dg, db) {
  const offsets = [
    [-6, -4], [4, -6], [-3, 5], [6, 3], [0, -8], [-8, 1], [5, -2],
    [-5, 7], [7, -5], [-2, -7], [3, 8], [-7, -7], [6, 6],
  ]
  for (const [ox, oy] of offsets) {
    const bx = cx + ox
    const by = cy + oy
    const dist = Math.sqrt(ox ** 2 + oy ** 2)
    if (dist < radius - 2) {
      fillCircle(png, bx, by, 2, dr, dg, db)
    }
  }
}

/** Mirror an 80x80 PNG horizontally */
function mirrorHorizontal(src) {
  const dst = createCanvas()
  for (let y = 0; y < 80; y++) {
    for (let x = 0; x < 80; x++) {
      const srcIdx = (80 * y + x) << 2
      const dstIdx = (80 * y + (79 - x)) << 2
      dst.data[dstIdx] = src.data[srcIdx]
      dst.data[dstIdx + 1] = src.data[srcIdx + 1]
      dst.data[dstIdx + 2] = src.data[srcIdx + 2]
      dst.data[dstIdx + 3] = src.data[srcIdx + 3]
    }
  }
  return dst
}

/** Save PNG to file */
function savePNG(png, filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const buffer = PNG.sync.write(png)
  fs.writeFileSync(filePath, buffer)
  const stat = fs.statSync(filePath)
  console.log(`  Saved ${path.relative(ROOT, filePath)} (${stat.size} bytes)`)
}

// ─── Sprite Drawers ─────────────────────────────────────────────────────────

/** Geodude (#74): Round grey boulder with eyes and rocky arms */
function drawGeodudeFront() {
  const png = createCanvas()
  const cx = 40, cy = 38, r = 25

  // Main body - grey boulder
  fillCircle(png, cx, cy, r, 136, 136, 152)

  // Dark outline
  strokeCircle(png, cx, cy, r, 60, 60, 72)

  // Rocky texture (slightly darker grey)
  addRockyTexture(png, cx, cy, r, 100, 100, 116)

  // Eyes
  drawEye(png, cx - 8, cy - 6, 4)
  drawEye(png, cx + 8, cy - 6, 4)

  // Left arm (rocky extension)
  fillCircle(png, cx - 28, cy + 2, 8, 120, 120, 136)
  strokeCircle(png, cx - 28, cy + 2, 8, 60, 60, 72)
  fillCircle(png, cx - 34, cy - 2, 5, 120, 120, 136)
  fillCircle(png, cx - 33, cy + 6, 5, 120, 120, 136)

  // Right arm (rocky extension)
  fillCircle(png, cx + 28, cy + 2, 8, 120, 120, 136)
  strokeCircle(png, cx + 28, cy + 2, 8, 60, 60, 72)
  fillCircle(png, cx + 34, cy - 2, 5, 120, 120, 136)
  fillCircle(png, cx + 33, cy + 6, 5, 120, 120, 136)

  return png
}

/** Graveler (#75): Larger rough boulder, darker, 4 limbs */
function drawGravelerFront() {
  const png = createCanvas()
  const cx = 40, cy = 40, r = 27

  // Main body - darker grey
  fillCircle(png, cx, cy, r, 112, 112, 128)

  // Dark outline
  strokeCircle(png, cx, cy, r, 48, 48, 60)

  // Rocky bumps on surface (jagged look)
  const bumpPositions = [
    [cx - 20, cy - 20, 5], [cx + 18, cy - 22, 6], [cx - 22, cy + 15, 5],
    [cx + 20, cy + 16, 5], [cx, cy - 26, 4], [cx - 26, cy - 4, 4],
    [cx + 25, cy + 2, 4], [cx - 5, cy + 26, 4],
  ]
  for (const [bx, by, br] of bumpPositions) {
    const dist = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2)
    if (dist < r + 2) {
      fillCircle(png, bx, by, br, 88, 88, 104)
      strokeCircle(png, bx, by, br, 48, 48, 60)
    }
  }

  // Texture
  addRockyTexture(png, cx, cy, r - 4, 80, 80, 96)

  // Eyes (larger, more menacing)
  drawEye(png, cx - 9, cy - 8, 4)
  drawEye(png, cx + 9, cy - 8, 4)

  // 4 arms/limbs
  // Upper left
  fillCircle(png, cx - 30, cy - 12, 7, 96, 96, 112)
  strokeCircle(png, cx - 30, cy - 12, 7, 48, 48, 60)
  fillCircle(png, cx - 35, cy - 18, 5, 96, 96, 112)

  // Upper right
  fillCircle(png, cx + 30, cy - 12, 7, 96, 96, 112)
  strokeCircle(png, cx + 30, cy - 12, 7, 48, 48, 60)
  fillCircle(png, cx + 35, cy - 18, 5, 96, 96, 112)

  // Lower left
  fillCircle(png, cx - 28, cy + 18, 6, 96, 96, 112)
  strokeCircle(png, cx - 28, cy + 18, 6, 48, 48, 60)

  // Lower right
  fillCircle(png, cx + 28, cy + 18, 6, 96, 96, 112)
  strokeCircle(png, cx + 28, cy + 18, 6, 48, 48, 60)

  return png
}

/**
 * Onix (#95): Series of connected dark-grey circles decreasing in size,
 * forming a serpentine chain from bottom to top.
 */
function drawOnixFront() {
  const png = createCanvas()

  // Onix body color
  const r = 96, g = 96, b = 112
  const outline = [48, 48, 60]

  // Segments from bottom to top: [cx, cy, radius]
  const segments = [
    [40, 72, 10],  // base (largest)
    [38, 58, 9],
    [44, 45, 8],
    [36, 33, 7],
    [44, 22, 7],
    [38, 13, 6],
    [44, 6, 5],    // tip (smallest)
  ]

  // Draw segments from bottom to top (bottom-most first so upper overlap)
  for (let i = segments.length - 1; i >= 0; i--) {
    const [cx, cy, radius] = segments[i]
    fillCircle(png, cx, cy, radius, r, g, b)
    strokeCircle(png, cx, cy, radius, outline[0], outline[1], outline[2])
  }

  // Eyes on the top (head) segment
  const [hx, hy] = [segments[0][0], segments[0][1]]
  drawEye(png, hx - 4, hy - 2, 2)
  drawEye(png, hx + 4, hy - 2, 2)

  // Add small horn on the head
  const headSeg = segments[segments.length - 1]
  fillCircle(png, headSeg[0] + 3, headSeg[1] - 4, 2, 80, 80, 96)

  return png
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SPRITES = [
  {
    id: 74,
    name: 'Geodude',
    drawFront: drawGeodudeFront,
    drawBack: () => mirrorHorizontal(drawGeodudeFront()),
  },
  {
    id: 75,
    name: 'Graveler',
    drawFront: drawGravelerFront,
    drawBack: () => mirrorHorizontal(drawGravelerFront()),
  },
  {
    id: 95,
    name: 'Onix',
    drawFront: drawOnixFront,
    drawBack: () => mirrorHorizontal(drawOnixFront()),
  },
]

console.log('Generating gym Pokemon sprites...\n')

for (const sprite of SPRITES) {
  console.log(`${sprite.name} (#${sprite.id}):`)

  const frontPath = path.resolve(ROOT, `public/assets/sprites/pokemon/front/${sprite.id}.png`)
  const backPath = path.resolve(ROOT, `public/assets/sprites/pokemon/back/${sprite.id}.png`)

  savePNG(sprite.drawFront(), frontPath)
  savePNG(sprite.drawBack(), backPath)
}

console.log('\n✓ Done. All 6 sprites generated.')
