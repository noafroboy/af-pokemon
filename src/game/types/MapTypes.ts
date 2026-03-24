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

export interface NPCDefinition {
  id: string
  tileX: number
  tileY: number
  facing: 'north' | 'south' | 'east' | 'west'
  spriteId: number
  dialog: string[]
  movementType: 'static' | 'wander' | 'patrol'
}

export interface ScriptZone {
  id: string
  tileX: number
  tileY: number
  width: number
  height: number
  scriptId: string
  triggerOnce: boolean
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
