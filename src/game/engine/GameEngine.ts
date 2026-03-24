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
import { TrainerNPC } from '../entities/NPC'
import { OverworldRenderer } from '../renderers/OverworldRenderer'
import { BattleRenderer } from '../renderers/BattleRenderer'
import { renderDialog, renderNameEntry } from '../renderers/DialogRenderer'
import { encounterFlash } from '../renderers/TransitionRenderer'
import { setMapCache } from './AssetLoader'
import { loadGame, getDefaultSaveData } from './SaveSystem'
import { AudioManager } from './AudioManager'

import palletTown from '../data/maps/pallet-town.json'
import route1 from '../data/maps/route-1.json'
import viridianCity from '../data/maps/viridian-city.json'
import pokemonCenter from '../data/maps/pokemon-center.json'
import pewterGym from '../data/maps/pewter-gym.json'

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
  private npcSystem: NPCSystem
  private dialogSystem: DialogSystem
  private onboardingSystem: OnboardingSystem
  private overworldRenderer: OverworldRenderer
  private battleRenderer: BattleRenderer
  private currentMap: GameMap | null = null
  private accumulator = 0
  private lastTime = 0
  private running = false
  private rafId: number | null = null
  private errorMessage: string | null = null
  private isEncounterTransition = false
  private pendingBattleNpc: string | null = null
  private lastPhase: GamePhase = GamePhase.TITLE
  private audio = AudioManager.getInstance()

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.input = new InputManager()

    // Pre-load bundled maps
    setMapCache('pallet-town', palletTown as unknown as GameMap)
    setMapCache('route-1', route1 as unknown as GameMap)
    setMapCache('viridian-city', viridianCity as unknown as GameMap)
    setMapCache('pokemon-center', pokemonCenter as unknown as GameMap)
    setMapCache('pewter-gym', pewterGym as unknown as GameMap)

    // Load save or start fresh
    const save = loadGame(0)
    const saveData = save?.state ?? getDefaultSaveData()

    this.state = createInitialGameState()
    this.state.currentMap = saveData.currentMap
    this.state.playerTileX = saveData.tileX
    this.state.playerTileY = saveData.tileY
    this.state.phase = GamePhase.TITLE

    this.player = new Player(saveData.tileX, saveData.tileY, saveData.playerName)

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

    this.loadMap(this.state.currentMap)

    // Wire up first-gesture callback for audio context unlock
    this.input.setFirstGestureCallback(() => this.audio.onFirstGesture())
    // Queue title music — will play on first user interaction
    this.audio.playMusic('title-theme')
  }

  private loadMap(mapId: string): void {
    const maps: Record<string, GameMap> = {
      'pallet-town': palletTown as unknown as GameMap,
      'route-1': route1 as unknown as GameMap,
      'viridian-city': viridianCity as unknown as GameMap,
      'pokemon-center': pokemonCenter as unknown as GameMap,
      'pewter-gym': pewterGym as unknown as GameMap,
    }
    const map = maps[mapId]
    if (map) {
      this.currentMap = map
      this.camera.setMap(map.width, map.height)
      this.camera.update(this.player.tileX, this.player.tileY)
      this.npcSystem.loadFromMap(map, this.state)
      // Track last Pokemon Center
      if (mapId === 'pokemon-center') {
        this.state.lastPokemonCenter = {
          map: 'viridian-city',
          tileX: 24,
          tileY: 6,
        }
        // Heal jingle when entering Pokemon Center
        if (this.state.phase !== GamePhase.TITLE) {
          this.audio.playSFX('heal-jingle')
        }
      }
      // Play map music when in overworld (not during title)
      if (this.state.phase !== GamePhase.TITLE) {
        this.audio.playMusic(map.music)
      }
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
    this.audio.stopMusic(0)
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
    // Track phase changes for audio triggers
    if (this.state.phase !== this.lastPhase) {
      this.onPhaseChange(this.lastPhase, this.state.phase)
      this.lastPhase = this.state.phase
    }

    // TITLE phase
    if (this.state.phase === GamePhase.TITLE) {
      this.onboardingSystem.update(dt, this.state, this.dialogSystem, this.input)
      this.input.update()
      return
    }

    // DIALOG phase (onboarding or NPC)
    if (this.state.phase === GamePhase.DIALOG) {
      this.dialogSystem.update(dt)
      if (this.onboardingSystem.isInOnboarding()) {
        this.onboardingSystem.update(dt, this.state, this.dialogSystem, this.input)
      } else {
        if (this.input.wasJustPressed('Enter') || this.input.wasJustPressed('z')) {
          this.dialogSystem.handleConfirm()
        }
        if (this.input.wasJustPressed('ArrowUp')) this.dialogSystem.handleUp()
        if (this.input.wasJustPressed('ArrowDown')) this.dialogSystem.handleDown()
        if (this.dialogSystem.isNameEntry) {
          // Handle name entry input
          // (simplified - keyboard chars handled externally in full impl)
        }
        if (!this.dialogSystem.isActive()) {
          this.state.phase = GamePhase.OVERWORLD
        }
      }
      this.input.update()
      return
    }

    // BADGE_CEREMONY phase
    if (this.state.phase === GamePhase.BADGE_CEREMONY) {
      this.state.badgeCeremonyTimer = (this.state.badgeCeremonyTimer ?? 120) - 1
      if ((this.state.badgeCeremonyTimer ?? 0) <= 0) {
        this.state.phase = GamePhase.OVERWORLD
      }
      this.input.update()
      return
    }

    // TRAINER_BATTLE_INTRO phase
    if (this.state.phase === GamePhase.TRAINER_BATTLE_INTRO) {
      if (this.pendingBattleNpc) {
        const npc = this.npcSystem.getNPCs().find(n => n.id === this.pendingBattleNpc)
        if (npc) {
          this.state.trainerBattleNpcId = npc.id
        }
        this.pendingBattleNpc = null
        this.state.phase = GamePhase.TRANSITION
        this.state.transitionTimer = TRANSITION_FRAMES
        this.state.transitionTarget = null
        this.isEncounterTransition = true
      }
      this.input.update()
      return
    }

    // MENU phase
    if (this.state.phase === GamePhase.MENU) {
      this.menuSystem.update(this.input, this.state)
      if (!this.menuSystem.isOpen()) {
        this.state.phase = GamePhase.OVERWORLD
      }
      this.input.update()
      return
    }

    switch (this.state.phase) {
      case GamePhase.OVERWORLD: {
        // Enter menu on Enter key
        if (this.input.wasJustPressed('Enter')) {
          this.state.phase = GamePhase.MENU
          this.menuSystem.open()
          break
        }

        const result = this.overworldSystem.update(this.player, this.state, this.currentMap)

        if (result.type === 'WARP') {
          this.state.phase = GamePhase.TRANSITION
          this.state.transitionTimer = TRANSITION_FRAMES
          this.state.transitionTarget = result.target
          this.isEncounterTransition = false
        } else if (result.type === 'ENCOUNTER') {
          const battle = this.encounterSystem.startEncounter(result.encounterTable, this.state)
          if (battle) {
            this.audio.playSFX('encounter-flash')
            this.state.phase = GamePhase.TRANSITION
            this.state.transitionTimer = TRANSITION_FRAMES
            this.state.transitionTarget = null
            this.isEncounterTransition = true
            this.battleSystem.setBattleState(battle)
          }
        } else if (result.type === 'DIALOG') {
          this.dialogSystem.startDialog(result.pages.map(p => ({ lines: p })))
          this.state.phase = GamePhase.DIALOG
        } else if (result.type === 'TRAINER_SPOTTED') {
          this.pendingBattleNpc = result.npc.id
          this.state.phase = GamePhase.TRAINER_BATTLE_INTRO
        } else if (result.type === 'SCRIPT') {
          // Handle scripts via dialog
          this.dialogSystem.startDialog([{ lines: [`Script: ${result.scriptId}`] }])
          this.state.phase = GamePhase.DIALOG
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
          // Check if trainer battle
          if (this.state.trainerBattleNpcId) {
            const npcId = this.state.trainerBattleNpcId
            // Check for badge reward before marking defeated
            const npc = this.npcSystem.getNPCs().find(n => n.id === npcId) ?? null
            this.npcSystem.markDefeated(npcId, this.state)
            this.state.trainerBattleNpcId = undefined
            const hasBadge = npc instanceof TrainerNPC && npc.badgeReward != null
            if (hasBadge) {
              this.state.badgeCeremonyTimer = 120
              this.state.phase = GamePhase.BADGE_CEREMONY
            } else {
              this.state.phase = GamePhase.OVERWORLD
            }
          } else {
            // Check blackout - all party fainted
            const allFainted = this.state.partyPokemon.every(p => p.currentHp <= 0)
            if (allFainted && this.state.lastPokemonCenter) {
              this.state.currentMap = this.state.lastPokemonCenter.map
              this.player.tileX = this.state.lastPokemonCenter.tileX
              this.player.tileY = this.state.lastPokemonCenter.tileY
              this.loadMap(this.state.currentMap)
              // Heal all pokemon
              for (const p of this.state.partyPokemon) {
                p.currentHp = p.maxHp
              }
            }
            this.state.phase = GamePhase.OVERWORLD
          }
        }
        break
      }
    }

    this.input.update()
    void dt
  }

  private onPhaseChange(from: GamePhase, to: GamePhase): void {
    if (to === GamePhase.BATTLE) {
      const battle = this.battleSystem.getBattleState()
      if (battle) {
        this.audio.playCry(battle.wildPokemon.speciesId)
        const trackId = this.state.trainerBattleNpcId ? 'trainer-battle' : 'wild-battle'
        this.audio.playMusic(trackId)
      }
    } else if (to === GamePhase.BADGE_CEREMONY) {
      this.audio.playSFX('badge-get')
    } else if (to === GamePhase.OVERWORLD && from === GamePhase.DIALOG) {
      // Returning from onboarding dialog — start map music
      if (this.currentMap) this.audio.playMusic(this.currentMap.music)
    }
  }

  private render(interpolation: number): void {
    this.ctx.imageSmoothingEnabled = false
    this.ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H)

    switch (this.state.phase) {
      case GamePhase.TITLE:
        this.onboardingSystem.renderTitle(this.ctx)
        break

      case GamePhase.OVERWORLD:
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, interpolation, this.npcSystem)
        }
        break

      case GamePhase.DIALOG:
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, 0, this.npcSystem)
        }
        if (this.dialogSystem.isNameEntry) {
          renderNameEntry(this.ctx, this.dialogSystem)
        } else {
          renderDialog(this.ctx, this.dialogSystem)
        }
        break

      case GamePhase.TRANSITION: {
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, interpolation, this.npcSystem)
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
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, 0, this.npcSystem)
        }
        this.menuSystem.render(this.ctx, this.state)
        break

      case GamePhase.TRAINER_BATTLE_INTRO:
        if (this.currentMap) {
          this.camera.update(this.player.tileX, this.player.tileY)
          this.overworldRenderer.render(this.ctx, this.currentMap, this.player, this.camera, 0, this.npcSystem)
        }
        // Flash overlay
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)'
        this.ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
        break

      case GamePhase.BADGE_CEREMONY:
        this.ctx.fillStyle = '#1a1c2c'
        this.ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
        this.ctx.fillStyle = '#FFD700'
        this.ctx.font = 'bold 10px monospace'
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText('BADGE GET!', VIEWPORT_W / 2, VIEWPORT_H / 2)
        this.ctx.textAlign = 'left'
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
