import type { Inventory } from '../../types/GameState'
import { ITEMS_DATA } from '../../data/items'
import type { ItemCategory } from '../../data/items'

const FONT = '6px "Press Start 2P", monospace'
const SMALL = '4px "Press Start 2P", monospace'
const VIEWPORT_W = 160
const VIEWPORT_H = 144
const ITEM_SUBMENU = ['USE', 'GIVE', 'TOSS', 'CANCEL']

type BagCategory = 'BALL' | 'MEDICINE' | 'TM'

const CATEGORY_MAP: Record<BagCategory, ItemCategory> = {
  BALL: 'pokeball',
  MEDICINE: 'medicine',
  TM: 'tm',
}

export function renderBagScreen(
  ctx: CanvasRenderingContext2D,
  inventory: Inventory,
  selectedIndex: number,
  category: BagCategory,
  showSubMenu: boolean = false,
  subMenuIndex: number = 0
): void {
  ctx.fillStyle = '#1a1c2c'
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)

  // Category tabs
  const cats: BagCategory[] = ['BALL', 'MEDICINE', 'TM']
  cats.forEach((cat, i) => {
    const x = 4 + i * 52
    ctx.fillStyle = cat === category ? '#333c57' : '#2a2c3c'
    ctx.fillRect(x, 2, 50, 12)
    ctx.strokeStyle = cat === category ? '#f4f4f4' : '#566c86'
    ctx.lineWidth = 1
    ctx.strokeRect(x, 2, 50, 12)
    ctx.fillStyle = cat === category ? '#f4f4f4' : '#888'
    ctx.font = SMALL
    ctx.textAlign = 'center'
    ctx.fillText(cat, x + 25, 11)
  })

  const filtered = inventory.filter(e => ITEMS_DATA[e.itemId]?.category === CATEGORY_MAP[category])

  if (filtered.length === 0) {
    ctx.fillStyle = '#566c86'
    ctx.font = FONT
    ctx.textAlign = 'center'
    ctx.fillText('You have no items.', VIEWPORT_W / 2, VIEWPORT_H / 2)
    return
  }

  const visibleStart = Math.max(0, selectedIndex - 5)
  const visible = filtered.slice(visibleStart, visibleStart + 8)

  visible.forEach((entry, i) => {
    const y = 18 + i * 14
    const isSelected = i + visibleStart === selectedIndex
    ctx.fillStyle = isSelected ? '#2a3c5c' : 'transparent'
    if (isSelected) ctx.fillRect(4, y - 2, VIEWPORT_W - 8, 12)

    const item = ITEMS_DATA[entry.itemId]
    ctx.fillStyle = isSelected ? '#f4f4f4' : '#ccc'
    ctx.font = FONT
    ctx.textAlign = 'left'
    if (isSelected) ctx.fillText('►', 4, y + 7)
    ctx.fillText(item?.name ?? `ITEM#${entry.itemId}`, 14, y + 7)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#aac'
    ctx.font = SMALL
    ctx.fillText(`x${entry.quantity}`, VIEWPORT_W - 6, y + 7)
  })

  if (showSubMenu) {
    const menuX = VIEWPORT_W - 54
    const menuY = VIEWPORT_H - 60
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(menuX, menuY, 50, ITEM_SUBMENU.length * 12 + 4)
    ctx.strokeStyle = '#333c57'
    ctx.lineWidth = 1
    ctx.strokeRect(menuX, menuY, 50, ITEM_SUBMENU.length * 12 + 4)
    ITEM_SUBMENU.forEach((label, i) => {
      ctx.fillStyle = i === subMenuIndex ? '#1a1c2c' : '#444'
      ctx.font = FONT
      ctx.textAlign = 'left'
      if (i === subMenuIndex) ctx.fillText('►', menuX + 2, menuY + 10 + i * 12)
      ctx.fillText(label, menuX + 10, menuY + 10 + i * 12)
    })
  }
}
