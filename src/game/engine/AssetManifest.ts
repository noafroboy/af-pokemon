/** All expected asset paths; missing files are warned on startup */
export const AssetManifest = {
  pokemonIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25],
  get spriteFront() {
    return this.pokemonIds.map((id) => `/assets/sprites/pokemon/front/${id}.png`)
  },
  get spriteBack() {
    return this.pokemonIds.map((id) => `/assets/sprites/pokemon/back/${id}.png`)
  },
  player: '/assets/sprites/overworld/player.png',
  npcs: '/assets/sprites/overworld/npcs.png',
  tilesets: {
    overworld: '/assets/tiles/overworld.png',
    interior: '/assets/tiles/interior.png',
    gym: '/assets/tiles/gym.png',
  },
  ui: {
    pokeball: '/assets/ui/pokeball-icon.png',
    badges: '/assets/ui/badges.png',
  },
} as const

export const TILE_COLORS: Record<number, string> = {
  0: 'transparent',
  1: '#8B7355',
  2: '#5A8A3C',
  3: '#3D6B29',
  4: '#2D4A1E',
  5: '#8B8B8B',
  6: '#A07050',
  7: '#3A7AB5',
  8: '#C8C060',
  9: '#7BB85A',
}

/** Sprite sheet metadata for player and NPC walk animations */
export const SPRITE_SHEET_META = {
  frameWidth: 16,
  frameHeight: 16,
  directions: { down: 0, up: 1, left: 2, right: 3 } as Record<string, number>,
  framesPerDir: 3,
} as const
