/**
 * generate-assets.mjs — Generate all game visual assets via DALL-E 3
 *
 * Usage: node scripts/generate-assets.mjs [--force] [--category=pokemon|tilesets|overworld|ui]
 *
 * Skips already-generated files unless --force is passed.
 * Rate-limits to avoid 429 errors (12s between calls).
 */

import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const API_KEY = process.env.OPENAI_API_KEY
const FORCE = process.argv.includes('--force')
const RATE_LIMIT_MS = 13000  // ~4.5 calls/min, well under the 5/min limit

if (!API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable not set')
  process.exit(1)
}

// ─── Pokemon list ──────────────────────────────────────────────────────────
const POKEMON = [
  { id: 1,  name: 'Bulbasaur' },
  { id: 2,  name: 'Ivysaur' },
  { id: 3,  name: 'Venusaur' },
  { id: 4,  name: 'Charmander' },
  { id: 5,  name: 'Charmeleon' },
  { id: 6,  name: 'Charizard' },
  { id: 7,  name: 'Squirtle' },
  { id: 8,  name: 'Wartortle' },
  { id: 9,  name: 'Blastoise' },
  { id: 10, name: 'Caterpie' },
  { id: 11, name: 'Metapod' },
  { id: 12, name: 'Butterfree' },
  { id: 13, name: 'Weedle' },
  { id: 14, name: 'Kakuna' },
  { id: 15, name: 'Beedrill' },
  { id: 16, name: 'Pidgey' },
  { id: 17, name: 'Pidgeotto' },
  { id: 18, name: 'Pidgeot' },
  { id: 19, name: 'Rattata' },
  { id: 20, name: 'Raticate' },
  { id: 25, name: 'Pikachu' },
]

// ─── Asset manifest (path -> prompt) ───────────────────────────────────────
const ASSETS = []

// Pokemon front sprites
for (const p of POKEMON) {
  ASSETS.push({
    path: `public/assets/sprites/pokemon/front/${p.id}.png`,
    prompt: `${p.name} pokemon battle sprite, facing forward, pixel art, Game Boy Color style, bold dark 1-pixel outline on all edges, chunky blocky pixels minimum 4x4, limited PICO-8 16-color palette, pure white background, no anti-aliasing, no gradients, simple bold shapes, retro RPG sprite, highly recognizable silhouette, centered on white canvas`,
    size: '1024x1024',
  })
}

// Pokemon back sprites
for (const p of POKEMON) {
  ASSETS.push({
    path: `public/assets/sprites/pokemon/back/${p.id}.png`,
    prompt: `${p.name} pokemon battle sprite, rear view facing away from viewer, pixel art, Game Boy Color style, bold dark 1-pixel outline, PICO-8 palette, white background, no anti-aliasing, chunky blocky pixels, retro RPG back sprite, simple silhouette, centered on white canvas`,
    size: '1024x1024',
  })
}

// Player overworld sprite sheet
ASSETS.push({
  path: 'public/assets/sprites/overworld/player.png',
  prompt: 'Top-down RPG player character sprite sheet on white background, 4 rows of 3 frames each in a grid, 16x16 pixel art per frame, Game Boy Color style, child trainer character with red cap and blue vest, PICO-8 palette, dark outline, no anti-aliasing, row 1 facing down walk cycle, row 2 facing up walk cycle, row 3 facing left walk cycle, row 4 facing right walk cycle, clean grid layout with visible separation between frames',
  size: '1024x1024',
})

// NPC sprite sheets
ASSETS.push({
  path: 'public/assets/sprites/overworld/npcs.png',
  prompt: 'Four RPG NPC character sprite sheets side by side on white background, each section 3 columns wide, 4 rows tall, 16x16 pixel art cells, Game Boy Color style, PICO-8 palette, dark outline: section 1 youngster boy in shorts, section 2 lass girl in skirt, section 3 gym trainer in uniform, section 4 nurse in white uniform, each with 4-directional 3-frame walk animations, clean grid layout',
  size: '1792x1024',
})

// Overworld tileset
ASSETS.push({
  path: 'public/assets/tiles/overworld.png',
  prompt: 'RPG overworld tileset for a Pokemon-style game, arranged as a 16-column by 16-row grid on white background, each tile exactly 64x64 pixels (total 1024x1024). Row 1 tiles from left to right: 1) white empty tile, 2) brown dirt/gravel path, 3) bright green grass field, 4) dark green tall grass with tufts sticking up, 5) dark green rounded tree canopy top-down view, 6) brown rough tree trunk bark, 7) animated blue water with ripples, 8) beige/tan stone building wall, 9) dark red building roof tiles, 10) brown wooden door entrance, 11) brown wooden sign post, 12) small colorful flowers on grass, 13) brown wooden fence planks, 14) grass with lighter edge path border. Game Boy Color pixel art style, PICO-8 16-color palette, dark 1px outlines, no anti-aliasing, top-down perspective, highly distinct and recognizable tiles',
  size: '1024x1024',
})

// Interior tileset
ASSETS.push({
  path: 'public/assets/tiles/interior.png',
  prompt: 'RPG building interior tileset, arranged as a 16-column by 16-row grid on white background, each tile exactly 64x64 pixels (total 1024x1024). Row 1 tiles from left to right: 1) white empty, 2) light wood plank floor with grain lines, 3) dark counter top surface, 4) retro PC computer terminal top-down view, 5) brown bookshelf with books, 6) cozy bed top-down view, 7) wooden staircase downward, 8) colorful decorative rug pattern, 9) interior wall with light plaster, 10) window frame in wall. Game Boy Color pixel art style, PICO-8 palette, dark outlines, no anti-aliasing, top-down view',
  size: '1024x1024',
})

// Gym tileset
ASSETS.push({
  path: 'public/assets/tiles/gym.png',
  prompt: 'Pokemon gym interior tileset, arranged as a 16-column by 16-row grid on white background, each tile exactly 64x64 pixels (total 1024x1024). Row 1 tiles from left to right: 1) white empty, 2) light grey checkerboard floor tile, 3) dark grey checkerboard floor tile, 4) red/white rope barrier divider, 5) grey stone gym wall, 6) large round grey boulder obstacle top-down view, 7) dark gym entrance tile, 8) gym badge display case top-down. Game Boy Color pixel art style, PICO-8 palette, dark outlines, no anti-aliasing, top-down view',
  size: '1024x1024',
})

// UI: Pokeball icon
ASSETS.push({
  path: 'public/assets/ui/pokeball-icon.png',
  prompt: 'Pokeball icon, pixel art, Game Boy Color style, red top half white bottom half with black dividing line and center white button circle, PICO-8 palette, bold dark outline, white background, simple iconic design, highly recognizable',
  size: '1024x1024',
})

// UI: Badges sprite sheet (8 badges horizontal)
ASSETS.push({
  path: 'public/assets/ui/badges.png',
  prompt: 'Pokemon gym badge icons, 8 badges in a horizontal row on white background, each badge 24x24 pixel art, Game Boy Color style. Badge 1 (Boulder Badge): hexagonal grey granite rock shape. Badges 2-8: simple circular grey placeholder shapes. PICO-8 palette, dark outlines, white background, clear separation between badges',
  size: '1024x1024',
})

// ─── Helper: download URL to file ──────────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const file = fs.createWriteStream(destPath)
    const protocol = url.startsWith('https') ? https : http

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlinkSync(destPath)
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject)
      }
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      fs.unlinkSync(destPath)
      reject(err)
    })
  })
}

// ─── Helper: call DALL-E 3 API ─────────────────────────────────────────────
async function generateImage(prompt, size = '1024x1024') {
  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    response_format: 'url',
  })

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`DALL-E API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error(`No URL in response: ${JSON.stringify(data)}`)
  return url
}

// ─── Helper: sleep ─────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  let generated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < ASSETS.length; i++) {
    const asset = ASSETS[i]
    const fullPath = path.resolve(ROOT, asset.path)

    if (!FORCE && fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath)
      if (stat.size > 1000) {
        console.log(`[${i + 1}/${ASSETS.length}] SKIP  ${asset.path}`)
        skipped++
        continue
      }
    }

    console.log(`[${i + 1}/${ASSETS.length}] GEN   ${asset.path}`)

    let attempts = 0
    let success = false
    while (attempts < 3 && !success) {
      try {
        const url = await generateImage(asset.prompt, asset.size)
        await downloadFile(url, fullPath)
        const stat = fs.statSync(fullPath)
        if (stat.size < 1000) throw new Error('Downloaded file too small (likely error response)')
        console.log(`              → saved (${Math.round(stat.size / 1024)}KB)`)
        generated++
        success = true
      } catch (err) {
        attempts++
        console.error(`              → attempt ${attempts} failed: ${err.message}`)
        if (attempts < 3) {
          const retryMs = err.message.includes('429') ? 60000 : 5000
          console.log(`              → retrying in ${retryMs / 1000}s...`)
          await sleep(retryMs)
        } else {
          console.error(`              → GAVE UP after 3 attempts`)
          failed++
        }
      }
    }

    // Rate limiting: wait between calls (skip wait after last item or on skip)
    if (success && i < ASSETS.length - 1) {
      await sleep(RATE_LIMIT_MS)
    }
  }

  console.log(`\n✓ Done. Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
