import { AudioManager } from '../engine/AudioManager'

export type DialogPage = {
  lines: string[]
  choices?: string[]
  onChoice?: (index: number) => void
}

export type TextSpeed = 'SLOW' | 'NORMAL' | 'FAST'

const CHAR_DELAY: Record<TextSpeed, number> = {
  SLOW: 80,
  NORMAL: 40,
  FAST: 16,
}

export class DialogSystem {
  private pages: DialogPage[] = []
  private currentPage = 0
  private charIndex = 0
  private charTimer = 0
  private choiceCursor = 0
  private active = false
  private speed: TextSpeed = 'NORMAL'

  // name entry sub-mode
  isNameEntry = false
  nameEntryFor: 'player' | 'rival' | null = null
  currentName = ''
  private maxNameLen = 7
  private onNameConfirm: ((name: string) => void) | null = null

  startDialog(pages: DialogPage[], speed: TextSpeed = 'NORMAL'): void {
    this.pages = pages
    this.currentPage = 0
    this.charIndex = 0
    this.charTimer = 0
    this.choiceCursor = 0
    this.active = true
    this.speed = speed
  }

  startNameEntry(
    nameFor: 'player' | 'rival',
    defaultName: string,
    onConfirm: (name: string) => void
  ): void {
    this.isNameEntry = true
    this.nameEntryFor = nameFor
    this.currentName = defaultName
    this.onNameConfirm = onConfirm
    this.active = true
  }

  isActive(): boolean {
    return this.active
  }

  getCurrentPage(): DialogPage | null {
    return this.pages[this.currentPage] ?? null
  }

  getCharIndex(): number {
    return this.charIndex
  }

  getChoiceCursor(): number {
    return this.choiceCursor
  }

  isPageComplete(): boolean {
    const page = this.getCurrentPage()
    if (!page) return true
    const fullText = page.lines.join('\n')
    return this.charIndex >= fullText.length
  }

  update(dt: number): void {
    if (!this.active || this.isNameEntry) return
    const page = this.getCurrentPage()
    if (!page) return

    const fullText = page.lines.join('\n')
    if (this.charIndex < fullText.length) {
      this.charTimer += dt
      const delay = CHAR_DELAY[this.speed]
      const prevIndex = this.charIndex
      while (this.charTimer >= delay && this.charIndex < fullText.length) {
        this.charTimer -= delay
        this.charIndex++
      }
      if (this.charIndex > prevIndex) {
        AudioManager.getInstance().playTextBlip()
      }
    }
  }

  handleConfirm(): boolean {
    if (!this.active) return false
    if (this.isNameEntry) {
      if (this.currentName.length > 0 && this.onNameConfirm) {
        this.onNameConfirm(this.currentName)
        this.isNameEntry = false
        this.nameEntryFor = null
        this.onNameConfirm = null
        this.active = false
      }
      return true
    }
    const page = this.getCurrentPage()
    if (!page) return false

    if (!this.isPageComplete()) {
      // Skip to end of page
      const fullText = page.lines.join('\n')
      this.charIndex = fullText.length
      return true
    }

    if (page.choices && page.choices.length > 0) {
      page.onChoice?.(this.choiceCursor)
    }

    this.currentPage++
    this.charIndex = 0
    this.charTimer = 0
    this.choiceCursor = 0

    if (this.currentPage >= this.pages.length) {
      this.active = false
    }
    return true
  }

  handleUp(): void {
    if (!this.active) return
    const page = this.getCurrentPage()
    if (page?.choices && this.choiceCursor > 0) {
      this.choiceCursor--
    }
  }

  handleDown(): void {
    if (!this.active) return
    const page = this.getCurrentPage()
    if (page?.choices && this.choiceCursor < page.choices.length - 1) {
      this.choiceCursor++
    }
  }

  nameAddChar(ch: string): void {
    if (!this.isNameEntry) return
    if (this.currentName.length < this.maxNameLen) {
      this.currentName += ch
    }
  }

  nameDeleteChar(): void {
    if (!this.isNameEntry) return
    if (this.currentName.length > 0) {
      this.currentName = this.currentName.slice(0, -1)
    }
  }

  getSpeed(): TextSpeed {
    return this.speed
  }

  reset(): void {
    this.pages = []
    this.currentPage = 0
    this.charIndex = 0
    this.charTimer = 0
    this.choiceCursor = 0
    this.active = false
    this.isNameEntry = false
    this.nameEntryFor = null
    this.currentName = ''
    this.onNameConfirm = null
  }
}
