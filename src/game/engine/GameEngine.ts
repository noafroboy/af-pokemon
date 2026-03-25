import { GamePhase, createInitialGameState } from '../types/GameState'
import type { GameState } from '../types/GameState'
import type { GameMap } from '../types/MapTypes'
import { Player } from '../entities/Player'
import { Camera, VIEWPORT_W, VIEWPORT_H } from './Camera'
import { InputManager } from './InputManager'
import { OverworldSystem } from '../systems/OverworldSystem'
import { EncounterSystem } from '../systems/EncounterSystem'
import { BattleSystem } from '../systems/BattleSystem'
import { MenuSystem } from '../systems/MenuSystem'
import { NPCSystem } from '../systems/NPCSystem'
import { DialogSystem } from '../systems/DialogSystem'
import { OnboardingSystem } from './OnboardingSystem'
import { OverworldRenderer } from '../renderers/OverworldRenderer'
import { BattleRenderer } from '../renderers/BattleRenderer'
import { ScriptHandler } from './ScriptHandler'
import { setMapCache, loadImage, preloadAllAssets } from './AssetLoader'
import { loadGame, getDefaultSaveData } from './SaveSystem'
import { load } from '../systems/SaveSystem'
import { AudioManager } from './AudioManager'
import { updateGamePhases, type PhaseUpdateCtx, type PhaseUpdateDeps } from './GamePhaseUpdater'
import { renderGamePhases, type PhaseRenderDeps } from './GamePhaseRenderer'
import { MAP_BUNDLES, TIMESTEP } from '../data/MapBundles'

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private state: GameState
  player: Player
  camera: Camera
  input: InputManager
  private overworldSystem: OverworldSystem
  private encounterSystem: EncounterSystem
  private battleSystem: BattleSystem
  private menuSystem: MenuSystem
  private npcSystem: NPCSystem
  private dialogSystem: DialogSystem
  private onboardingSystem: OnboardingSystem
  private overworldRenderer: OverworldRenderer
  private battleRenderer: BattleRenderer
  private scriptHandler: ScriptHandler
  private currentMap: GameMap | null = null
  private accumulator = 0
  private lastTime = 0
  private running = false
  private rafId: number | null = null
  private errorMessage: string | null = null
  private phaseCtx: PhaseUpdateCtx
  private audio = AudioManager.getInstance()

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.input = InputManager.getInstance()
    for (const [id, map] of Object.entries(MAP_BUNDLES)) setMapCache(id, map as unknown as GameMap)

    const saveData = loadGame(0)?.state ?? getDefaultSaveData()
    this.state = createInitialGameState()
    this.state.currentMap = saveData.currentMap
    this.state.playerTileX = saveData.tileX
    this.state.playerTileY = saveData.tileY
    this.player = new Player(saveData.tileX, saveData.tileY, saveData.playerName)
    this.applyV1Save()

    this.state.phase = this.state.flags['NEW_GAME_STARTED'] ? GamePhase.OVERWORLD : GamePhase.TITLE
    this.phaseCtx = { isEncounterTransition: false, pendingBattleNpc: null, lastPhase: this.state.phase }

    this.camera = new Camera()
    this.npcSystem = new NPCSystem()
    this.dialogSystem = new DialogSystem()
    this.onboardingSystem = new OnboardingSystem()
    this.overworldSystem = new OverworldSystem(this.input, this.npcSystem)
    this.encounterSystem = new EncounterSystem()
    this.battleSystem = new BattleSystem(this.input)
    this.menuSystem = new MenuSystem()
    this.overworldRenderer = new OverworldRenderer()
    this.battleRenderer = new BattleRenderer()
    this.scriptHandler = new ScriptHandler()

    this.loadMap(this.state.currentMap)
    this.input.setFirstGestureCallback(() => this.audio.onFirstGesture())
    this.audio.playMusic('title-theme')
    preloadAllAssets().catch(() => { /* warnings logged inside */ })
  }

  private applyV1Save(): void {
    const v1Save = load(1)
    if (!v1Save?.gameState) return
    const gs = v1Save.gameState
    if (gs.currentMap) this.state.currentMap = gs.currentMap
    if (gs.playerTileX !== undefined) { this.state.playerTileX = gs.playerTileX; this.player.tileX = gs.playerTileX }
    if (gs.playerTileY !== undefined) { this.state.playerTileY = gs.playerTileY; this.player.tileY = gs.playerTileY }
    if (gs.partyPokemon) this.state.partyPokemon = gs.partyPokemon
    if (gs.party) this.state.party = gs.party
    if (gs.inventory) this.state.inventory = gs.inventory
    if (gs.flags) this.state.flags = { ...this.state.flags, ...gs.flags }
    if (gs.activeSlot) this.state.activeSlot = gs.activeSlot
  }

  private loadMap(mapId: string): void {
    const map = MAP_BUNDLES[mapId] as GameMap | undefined
    if (!map) { console.warn(`GameEngine: map "${mapId}" not found`); return }
    this.currentMap = map
    this.camera.setMap(map.width, map.height)
    this.camera.update(this.player.tileX, this.player.tileY)
    this.npcSystem.loadFromMap(map, this.state)
    if (map.tilesetPath) loadImage(map.tilesetPath).catch(() => {})
    if (mapId === 'pokemon-center') {
      this.state.lastPokemonCenter = { map: 'viridian-city', tileX: 24, tileY: 6 }
      if (this.state.phase !== GamePhase.TITLE) this.audio.playSFX('heal-jingle')
    }
    if (this.state.phase !== GamePhase.TITLE) this.audio.playMusic(map.music)
  }

  start(): void {
    this.running = true
    this.lastTime = performance.now()
    this.input.attach(window)
    window.addEventListener('keydown', this.onCharKeyDown)
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)['__GAME_DEBUG__'] = { engine: this }
    }
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null }
    this.input.detach(window)
    window.removeEventListener('keydown', this.onCharKeyDown)
    this.audio.stopMusic(0)
    if (typeof window !== 'undefined') delete (window as unknown as Record<string, unknown>)['__GAME_DEBUG__']
  }

  private onCharKeyDown = (e: KeyboardEvent): void => {
    if (!this.dialogSystem.isNameEntry) return
    const ch = e.key
    if (ch.length === 1 && /[A-Za-z0-9]/.test(ch)) this.dialogSystem.nameAddChar(ch.toUpperCase())
    else if (ch === 'Backspace') { this.dialogSystem.nameDeleteChar(); e.preventDefault() }
    else if (ch === 'Enter') this.dialogSystem.handleConfirm()
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return
    const dt = Math.min(timestamp - this.lastTime, 100)
    this.lastTime = timestamp
    this.accumulator += dt
    if (dt > 20 && this.state.phase !== GamePhase.TITLE) {
      console.warn(`[GameEngine] Frame budget exceeded: ${dt.toFixed(1)}ms`)
    }
    try {
      while (this.accumulator >= TIMESTEP) { this.update(TIMESTEP); this.accumulator -= TIMESTEP }
      this.render(this.accumulator / TIMESTEP)
    } catch (err) {
      this.errorMessage = String(err); console.error('GameEngine error:', err); this.renderError()
    }
    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    const deps: PhaseUpdateDeps = {
      input: this.input, onboarding: this.onboardingSystem, dialog: this.dialogSystem,
      menu: this.menuSystem, overworld: this.overworldSystem, encounter: this.encounterSystem,
      battle: this.battleSystem, npc: this.npcSystem, script: this.scriptHandler,
      audio: this.audio, player: this.player, currentMap: this.currentMap,
      loadMap: (id) => this.loadMap(id),
    }
    updateGamePhases(dt, this.state, deps, this.phaseCtx)
  }

  private render(interpolation: number): void {
    const deps: PhaseRenderDeps = {
      state: this.state, player: this.player, currentMap: this.currentMap,
      isEncounterTransition: this.phaseCtx.isEncounterTransition,
      camera: this.camera, npc: this.npcSystem, dialog: this.dialogSystem,
      battle: this.battleSystem, menu: this.menuSystem, onboarding: this.onboardingSystem,
      overworldRenderer: this.overworldRenderer, battleRenderer: this.battleRenderer,
    }
    renderGamePhases(this.ctx, interpolation, deps)
  }

  private renderError(): void {
    this.ctx.fillStyle = '#1a1c2c'
    this.ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
    this.ctx.fillStyle = '#ff4444'
    this.ctx.font = '6px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('ENGINE ERROR', VIEWPORT_W / 2, VIEWPORT_H / 2 - 10)
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '4px monospace'
    this.ctx.fillText((this.errorMessage ?? 'Unknown error').substring(0, 40), VIEWPORT_W / 2, VIEWPORT_H / 2 + 4)
  }

  getPhase(): string { return this.state.phase }
  getMapId(): string { return this.state.currentMap }
  getPartyCount(): number { return this.state.partyPokemon.length }
  getBadgeCount(): number {
    const b = this.state.flags['badges']
    return Array.isArray(b) ? (b as boolean[]).filter(Boolean).length : 0
  }
}
