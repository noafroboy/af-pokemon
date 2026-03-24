export interface TileLayer {
  terrain: number[]
  objects: number[]
  collision: number[]
}

export interface EncounterTableEntry {
  speciesId: number
  minLevel: number
  maxLevel: number
  weight: number
}

export interface EncounterConfig {
  encounterRate: number
  table: EncounterTableEntry[]
}

export interface WarpDefinition {
  tileX: number
  tileY: number
  targetMap: string
  targetX: number
  targetY: number
  direction: 'north' | 'south' | 'east' | 'west'
}

export interface TrainerPartyEntry {
  speciesId: number
  level: number
}

export interface NPCDefinition {
  id: string
  tileX: number
  tileY: number
  facing: 'north' | 'south' | 'east' | 'west'
  spriteId: number
  dialog: string[]
  movementType: 'static' | 'wander' | 'patrol'
  isTrainer?: boolean
  trainerId?: string
  party?: TrainerPartyEntry[]
  moneyBase?: number
  losRange?: number
  preBattleDialog?: string[]
  postBattleDialog?: string[]
  badgeReward?: string
}

export interface ScriptZone {
  id: string
  tileX: number
  tileY: number
  width: number
  height: number
  scriptId: string
  triggerOnce: boolean
  autoTrigger?: boolean
}

export interface GameMap {
  id: string
  width: number
  height: number
  tileSize: number
  tilesetPath: string
  layers: TileLayer
  warps: WarpDefinition[]
  npcs: NPCDefinition[]
  encounters: EncounterConfig | null
  scriptZones: ScriptZone[]
  music: string
}
