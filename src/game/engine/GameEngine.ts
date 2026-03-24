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
import { OverworldRenderer } from '../renderers/OverworldRenderer'
import { BattleRenderer } from '../renderers/BattleRenderer'
import { encounterFlash } from '../renderers/TransitionRenderer'
import { setMapCache } from './AssetLoader'
import { loadGame, getDefaultSaveData } from './SaveSystem'

import palletTown from '../data/maps/pallet-town.json'
import route1 from '../data/maps/route-1.json'

const TIMESTEP = 1000 / 60
const TRANSITION_FRAMES = 18

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
  private overworldRenderer: OverworldRenderer
  private battleRenderer: BattleRenderer
  private currentMap: GameMap | null = null
  private accumulator = 0
  private lastTime = 0
  private running = false
  private rafId: number | null = null
  private errorMessage: string | null = null
  private isEncounterTransition = false

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.input = new InputManager()

    // Pre-load bundled maps
    setMapCache('pallet-town', palletTown as unknown as GameMap)
    setMapCache('route-1', route1 as unknown as GameMap)

    // Load save or start fresh
    const save = loadGame(0)
    const saveData = save?.state ?? getDefaultSaveData()

    this.state = createInitialGameState()
    this.state.currentMap = saveData.currentMap
    this.state.playerTileX = saveData.tileX
    this.state.playerTileY = saveData.tileY

    this.player = new Player(saveData.tileX, saveData.tileY, saveData.playerName)

    this.camera = new Camera()
    this.overworldSystem = new OverworldSystem(this.input)
    this.encounterSystem = new EncounterSystem()
    this.battleSystem = new BattleSystem(this.input)
    this.menuSystem = new MenuSystem()
    this.overworldRenderer = new OverworldRenderer()
    this.battleRenderer = new BattleRenderer()

    this.loadMap(this.state.currentMap)
  }

  private loadMap(mapId: string): void {
    const maps: Record<string, GameMap> = {
      'pallet-town': palletTown as unknown as GameMap,
      'route-1': route1 as unknown as GameMap,
    }
    const map = maps[mapId]
    if (map) {
      this.currentMap = map
      this.camera.setMap(map.width, map.height)
      this.camera.update(this.player.tileX, this.player.tileY)
    } else {
      console.warn(`GameEngine: map "${mapId}" not found`)
    }
  }

  start(): void {
    this.running = true
    this.lastTime = performance.now()
    this.input.attach(window)
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.input.detach(window)
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return

    const dt = Math.min(timestamp - this.lastTime, 100)
    this.lastTime = timestamp
    this.accumulator += dt

    try {
      while (this.accumulator >= TIMESTEP) {
        this.update(TIMESTEP)
        this.accumulator -= TIMESTEP
      }
      const interpolation = this.accumulator / TIMESTEP
      this.render(interpolation)
    } catch (err) {
      this.errorMessage = String(err)
      console.error('GameEngine error:', err)
      this.renderError()
    }

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    // Enter menu from overworld on Enter key
    if (this.state.phase === GamePhase.OVERWORLD && this.input.wasJustPressed('Enter')) {
      this.state.phase = GamePhase.MENU
      this.menuSystem.open()
    }
    // Close menu returns to overworld
    if (this.state.phase === GamePhase.MENU) {
      this.menuSystem.update(this.input, this.state)
      if (!this.menuSystem.isOpen()) {
        this.state.phase = GamePhase.OVERWORLD
      }
      this.input.update()
      void dt
      return
    }

    switch (this.state.phase) {
      case GamePhase.OVERWORLD: {
        const result = this.overworldSystem.update(this.player, this.state, this.currentMap)
        if (result.type === 'WARP') {
          this.state.phase = GamePhase.TRANSITION
          this.state.transitionTimer = TRANSITION_FRAMES
          this.state.transitionTarget = result.target
          this.isEncounterTransition = false
        } else if (result.type === 'ENCOUNTER') {
          const battle = this.encounterSystem.startEncounter(result.encounterTable, this.state)
          if (battle) {
            this.state.phase = GamePhase.TRANSITION
            this.state.transitionTimer = TRANSITION_FRAMES
            this.state.transitionTarget = null
            this.isEncounterTransition = true
            this.battleSystem.setBattleState(battle)
          }
        }
        break
      }
      case GamePhase.TRANSITION: {
        this.state.transitionTimer--
        if (this.state.transitionTimer <= 0) {
          if (this.isEncounterTransition) {
            this.isEncounterTransition = false
            this.state.phase = GamePhase.BATTLE
          } else if (this.state.transitionTarget) {
            this.state.currentMap = this.state.transitionTarget.map
            this.player.tileX = this.state.transitionTarget.tileX
            this.player.tileY = this.state.transitionTarget.tileY
            this.player.pixelOffset = 0
            this.player.moveQueue = []
            this.loadMap(this.state.currentMap)
            this.state.transitionTarget = null
            this.state.phase = GamePhase.OVERWORLD
          } else {
            this.state.phase = GamePhase.OVERWORLD
          }
        }
        break
      }
      case GamePhase.BATTLE: {
        const battleResult = this.battleSystem.update(this.state)
        if (battleResult === 'DONE') {
          this.state.phase = GamePhase.OVERWORLD
        }
        break
      }
    }
    this.input.update()
    void dt
  }

  private render(interpolation: number): void {
    this.ctx.imageSmoothingEnabled = false
    this.ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H)

    switch (this.state.phase) {
      case GamePhase.OVERWORLD:
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, interpolation)
        }
        break
      case GamePhase.TRANSITION: {
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, interpolation)
        }
        const progress = 1 - this.state.transitionTimer / TRANSITION_FRAMES
        if (this.isEncounterTransition) {
          encounterFlash(this.ctx, progress)
        } else {
          this.ctx.fillStyle = `rgba(0,0,0,${progress})`
          this.ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
        }
        break
      }
      case GamePhase.BATTLE:
        this.battleRenderer.render(this.ctx, this.battleSystem.getBattleState(), this.state)
        break
      case GamePhase.MENU:
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, 0)
        }
        this.menuSystem.render(this.ctx, this.state)
        break
    }
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
    const msg = (this.errorMessage ?? 'Unknown error').substring(0, 40)
    this.ctx.fillText(msg, VIEWPORT_W / 2, VIEWPORT_H / 2 + 4)
  }
}
