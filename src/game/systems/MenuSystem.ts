import type { InputManager } from '../engine/InputManager'
import type { GameState } from '../types/GameState'
import { AudioManager } from '../engine/AudioManager'
import type { MenuAnimState } from '../renderers/MenuRenderer'
import {
  renderStartMenu, renderSaveSlotScreen, renderOptionsScreen, renderBadgeCase,
} from '../renderers/MenuRenderer'
import { renderPartyScreen, renderBagScreen, renderSavingAnimation } from '../renderers/UIRenderer'
import { save, listSlots } from './SaveSystem'
import type { SaveSlotSummary } from '../types/GameState'

const MENU_ITEMS = ['POKEMON', 'ITEM', 'SAVE', 'OPTIONS', 'EXIT'] as const
type MenuView = 'START' | 'POKEMON' | 'ITEM' | 'SAVE' | 'OPTIONS' | 'BADGES'

export class MenuSystem {
  private animState: MenuAnimState = 'CLOSED'
  private animStart = 0
  private animProgress = 0
  private cursorIndex = 0
  private activeView: MenuView = 'START'
  private savingProgress = 0
  private isSaving = false
  private bagCategory: 'BALL' | 'MEDICINE' | 'TM' = 'MEDICINE'
  private bagIndex = 0
  private saveSlotIndex = 0
  private saveSlots: SaveSlotSummary[] = []

  isOpen(): boolean { return this.animState !== 'CLOSED' }

  open(): void {
    if (this.animState === 'CLOSED') {
      this.animState = 'OPENING'
      this.animStart = Date.now()
      this.activeView = 'START'
      this.cursorIndex = 0
    }
  }

  close(): void {
    if (this.animState === 'OPEN' || this.animState === 'OPENING') {
      this.animState = 'CLOSING'
      this.animStart = Date.now()
    }
  }

  update(input: InputManager, state: GameState): void {
    const ANIM_MS = 150
    const now = Date.now()

    if (this.animState === 'OPENING' || this.animState === 'CLOSING') {
      this.animProgress = Math.min(1, (now - this.animStart) / ANIM_MS)
      if (this.animProgress >= 1) {
        this.animState = this.animState === 'OPENING' ? 'OPEN' : 'CLOSED'
      }
    }

    if (this.animState !== 'OPEN') return

    if (this.isSaving) {
      this.savingProgress = Math.min(1, this.savingProgress + 0.05)
      if (this.savingProgress >= 1) { this.isSaving = false; this.savingProgress = 0; this.close() }
      return
    }

    if (this.activeView === 'START') this.handleStartMenu(input, state)
    else if (this.activeView === 'POKEMON') { if (input.wasJustPressed('x') || input.wasJustPressed('Escape')) this.activeView = 'START' }
    else if (this.activeView === 'ITEM') {
      if (input.wasJustPressed('x') || input.wasJustPressed('Escape')) this.activeView = 'START'
      if (input.wasJustPressed('ArrowLeft')) this.switchBagCategory(-1)
      if (input.wasJustPressed('ArrowRight')) this.switchBagCategory(1)
    } else if (this.activeView === 'SAVE') this.handleSaveView(input, state)
    else { if (input.wasJustPressed('x') || input.wasJustPressed('Escape')) this.activeView = 'START' }
  }

  private handleStartMenu(input: InputManager, state: GameState): void {
    void state
    const audio = AudioManager.getInstance()
    if (input.wasJustPressed('ArrowUp')) { this.cursorIndex = (this.cursorIndex + 4) % 5; audio.playSFX('menu-select') }
    if (input.wasJustPressed('ArrowDown')) { this.cursorIndex = (this.cursorIndex + 1) % 5; audio.playSFX('menu-select') }
    if (input.wasJustPressed('x') || input.wasJustPressed('Escape') || input.wasJustPressed('Enter')) { this.close(); return }
    if (input.wasJustPressed('z')) {
      audio.playSFX('menu-select')
      const choice = MENU_ITEMS[this.cursorIndex]
      if (choice === 'POKEMON') this.activeView = 'POKEMON'
      else if (choice === 'ITEM') { this.activeView = 'ITEM'; this.bagIndex = 0 }
      else if (choice === 'SAVE') { this.activeView = 'SAVE'; this.saveSlots = listSlots(); this.saveSlotIndex = 0 }
      else if (choice === 'OPTIONS') this.activeView = 'OPTIONS'
      else if (choice === 'EXIT') this.close()
    }
  }

  private handleSaveView(input: InputManager, state: GameState): void {
    if (input.wasJustPressed('ArrowUp')) this.saveSlotIndex = Math.max(0, this.saveSlotIndex - 1)
    if (input.wasJustPressed('ArrowDown')) this.saveSlotIndex = Math.min(2, this.saveSlotIndex + 1)
    if (input.wasJustPressed('x') || input.wasJustPressed('Escape')) { this.activeView = 'START'; return }
    if (input.wasJustPressed('z')) {
      const slot = (this.saveSlotIndex + 1) as 1 | 2 | 3
      state.activeSlot = slot
      save(slot, state)
      this.isSaving = true
      this.savingProgress = 0
    }
  }

  private switchBagCategory(dir: number): void {
    const cats: ('BALL' | 'MEDICINE' | 'TM')[] = ['BALL', 'MEDICINE', 'TM']
    const idx = (cats.indexOf(this.bagCategory) + dir + 3) % 3
    this.bagCategory = cats[idx]
    this.bagIndex = 0
  }

  render(ctx: CanvasRenderingContext2D, state: GameState): void {
    if (this.animState === 'CLOSED') return
    if (this.activeView === 'START' || this.animState !== 'OPEN') {
      renderStartMenu(ctx, this.cursorIndex, this.animState, this.animProgress)
      return
    }
    if (this.activeView === 'POKEMON') renderPartyScreen(ctx, state.partyPokemon, 0, 'view')
    else if (this.activeView === 'ITEM') renderBagScreen(ctx, state.inventory, this.bagIndex, this.bagCategory)
    else if (this.activeView === 'SAVE') {
      const slots = [0, 1, 2].map(i => this.saveSlots.find(s => s.slot === i + 1) ?? null)
      renderSaveSlotScreen(ctx, slots, this.saveSlotIndex)
    } else if (this.activeView === 'OPTIONS') renderOptionsScreen(ctx, { textSpeed: 'MID', sound: 'MONO', scale: '2X' }, 0, 0)
    else if (this.activeView === 'BADGES') renderBadgeCase(ctx, [])
    if (this.isSaving) renderSavingAnimation(ctx, this.savingProgress)
  }
}
