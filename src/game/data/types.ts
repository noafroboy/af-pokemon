export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy'

export const TYPE_LIST: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
]

// TYPE_CHART[attackingType][defendingType] = effectiveness multiplier
// Gen 1 quirks: Ghost->Psychic = 0 (bug), Bug->Psychic = 0.5 (bug)
// Index order matches TYPE_LIST
const N = 1    // normal
const S = 2    // super effective
const H = 0.5  // not very effective
const Z = 0    // no effect

export const TYPE_CHART: Record<PokemonType, Record<PokemonType, number>> = {
  Normal:   { Normal:N, Fire:N, Water:N, Electric:N, Grass:N, Ice:N, Fighting:N, Poison:N, Ground:N, Flying:N, Psychic:N, Bug:N, Rock:H, Ghost:Z, Dragon:N, Dark:N, Steel:H, Fairy:N },
  Fire:     { Normal:N, Fire:H, Water:H, Electric:N, Grass:S, Ice:S, Fighting:N, Poison:N, Ground:N, Flying:N, Psychic:N, Bug:S, Rock:H, Ghost:N, Dragon:H, Dark:N, Steel:S, Fairy:N },
  Water:    { Normal:N, Fire:S, Water:H, Electric:N, Grass:H, Ice:N, Fighting:N, Poison:N, Ground:S, Flying:N, Psychic:N, Bug:N, Rock:S, Ghost:N, Dragon:H, Dark:N, Steel:N, Fairy:N },
  Electric: { Normal:N, Fire:N, Water:S, Electric:H, Grass:H, Ice:N, Fighting:N, Poison:N, Ground:Z, Flying:S, Psychic:N, Bug:N, Rock:N, Ghost:N, Dragon:H, Dark:N, Steel:N, Fairy:N },
  Grass:    { Normal:N, Fire:H, Water:S, Electric:N, Grass:H, Ice:N, Fighting:N, Poison:H, Ground:S, Flying:H, Psychic:N, Bug:H, Rock:S, Ghost:N, Dragon:H, Dark:N, Steel:H, Fairy:N },
  Ice:      { Normal:N, Fire:H, Water:H, Electric:N, Grass:S, Ice:H, Fighting:N, Poison:N, Ground:S, Flying:S, Psychic:N, Bug:N, Rock:N, Ghost:N, Dragon:S, Dark:N, Steel:H, Fairy:N },
  Fighting: { Normal:S, Fire:N, Water:N, Electric:N, Grass:N, Ice:S, Fighting:N, Poison:H, Ground:N, Flying:H, Psychic:H, Bug:H, Rock:S, Ghost:Z, Dragon:N, Dark:S, Steel:S, Fairy:H },
  Poison:   { Normal:N, Fire:N, Water:N, Electric:N, Grass:S, Ice:N, Fighting:N, Poison:H, Ground:H, Flying:N, Psychic:N, Bug:N, Rock:H, Ghost:H, Dragon:N, Dark:N, Steel:Z, Fairy:S },
  Ground:   { Normal:N, Fire:S, Water:N, Electric:S, Grass:H, Ice:N, Fighting:N, Poison:S, Ground:N, Flying:Z, Psychic:N, Bug:H, Rock:S, Ghost:N, Dragon:N, Dark:N, Steel:S, Fairy:N },
  Flying:   { Normal:N, Fire:N, Water:N, Electric:H, Grass:S, Ice:N, Fighting:S, Poison:N, Ground:N, Flying:N, Psychic:N, Bug:S, Rock:H, Ghost:N, Dragon:N, Dark:N, Steel:H, Fairy:N },
  Psychic:  { Normal:N, Fire:N, Water:N, Electric:N, Grass:N, Ice:N, Fighting:S, Poison:S, Ground:N, Flying:N, Psychic:H, Bug:N, Rock:N, Ghost:Z, Dragon:N, Dark:Z, Steel:H, Fairy:N },
  Bug:      { Normal:N, Fire:H, Water:N, Electric:N, Grass:S, Ice:N, Fighting:H, Poison:H, Ground:N, Flying:H, Psychic:H, Bug:N, Rock:N, Ghost:H, Dragon:N, Dark:S, Steel:H, Fairy:H },
  Rock:     { Normal:S, Fire:S, Water:N, Electric:N, Grass:N, Ice:S, Fighting:H, Poison:N, Ground:H, Flying:S, Psychic:N, Bug:S, Rock:N, Ghost:N, Dragon:N, Dark:N, Steel:H, Fairy:N },
  Ghost:    { Normal:Z, Fire:N, Water:N, Electric:N, Grass:N, Ice:N, Fighting:Z, Poison:N, Ground:N, Flying:N, Psychic:Z, Bug:N, Rock:N, Ghost:S, Dragon:N, Dark:H, Steel:N, Fairy:N },
  Dragon:   { Normal:N, Fire:N, Water:N, Electric:N, Grass:N, Ice:N, Fighting:N, Poison:N, Ground:N, Flying:N, Psychic:N, Bug:N, Rock:N, Ghost:N, Dragon:S, Dark:N, Steel:H, Fairy:Z },
  Dark:     { Normal:N, Fire:N, Water:N, Electric:N, Grass:N, Ice:N, Fighting:H, Poison:N, Ground:N, Flying:N, Psychic:S, Bug:H, Rock:N, Ghost:S, Dragon:N, Dark:H, Steel:N, Fairy:H },
  Steel:    { Normal:H, Fire:H, Water:H, Electric:H, Grass:H, Ice:S, Fighting:H, Poison:Z, Ground:H, Flying:H, Psychic:H, Bug:H, Rock:S, Ghost:N, Dragon:H, Dark:N, Steel:H, Fairy:S },
  Fairy:    { Normal:N, Fire:H, Water:N, Electric:N, Grass:N, Ice:N, Fighting:S, Poison:H, Ground:N, Flying:N, Psychic:N, Bug:N, Rock:N, Ghost:N, Dragon:S, Dark:S, Steel:H, Fairy:N },
}

export function getTypeEffectiveness(attacking: PokemonType, defending: PokemonType): number {
  return TYPE_CHART[attacking]?.[defending] ?? 1
}

export function getMultiTypeEffectiveness(attacking: PokemonType, defendingTypes: PokemonType[]): number {
  return defendingTypes.reduce((mult, defType) => mult * getTypeEffectiveness(attacking, defType), 1)
}
