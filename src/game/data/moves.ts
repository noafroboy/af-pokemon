export type MoveCategory = 'physical' | 'special' | 'status'

export interface Move {
  id: number
  name: string
  type: string
  category: MoveCategory
  power: number
  accuracy: number
  pp: number
  effect: string
  priority: number
  highCrit: boolean
}

export const MOVES_DATA: Record<number, Move> = {
  10: { id: 10, name: 'Scratch', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, effect: 'none', priority: 0, highCrit: false },
  14: { id: 14, name: 'Swords Dance', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'raise_atk_2', priority: 0, highCrit: false },
  17: { id: 17, name: 'Wing Attack', type: 'Flying', category: 'physical', power: 60, accuracy: 100, pp: 35, effect: 'none', priority: 0, highCrit: false },
  20: { id: 20, name: 'Rage', type: 'Normal', category: 'physical', power: 20, accuracy: 100, pp: 20, effect: 'rage', priority: 0, highCrit: false },
  22: { id: 22, name: 'Vine Whip', type: 'Grass', category: 'physical', power: 45, accuracy: 100, pp: 25, effect: 'none', priority: 0, highCrit: true },
  24: { id: 24, name: 'Double Kick', type: 'Fighting', category: 'physical', power: 30, accuracy: 100, pp: 30, effect: 'multi_hit_2', priority: 0, highCrit: false },
  28: { id: 28, name: 'Quick Attack', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 30, effect: 'none', priority: 1, highCrit: false },
  31: { id: 31, name: 'Fury Attack', type: 'Normal', category: 'physical', power: 15, accuracy: 85, pp: 20, effect: 'multi_hit', priority: 0, highCrit: false },
  33: { id: 33, name: 'Tackle', type: 'Normal', category: 'physical', power: 35, accuracy: 95, pp: 35, effect: 'none', priority: 0, highCrit: false },
  34: { id: 34, name: 'Body Slam', type: 'Normal', category: 'physical', power: 85, accuracy: 100, pp: 15, effect: 'paralysis_30', priority: 0, highCrit: false },
  36: { id: 36, name: 'Sludge', type: 'Poison', category: 'special', power: 65, accuracy: 100, pp: 20, effect: 'poison_30', priority: 0, highCrit: false },
  39: { id: 39, name: 'Tail Whip', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 30, effect: 'lower_def_1', priority: 0, highCrit: false },
  40: { id: 40, name: 'Poison Sting', type: 'Poison', category: 'physical', power: 15, accuracy: 100, pp: 35, effect: 'poison_30', priority: 0, highCrit: false },
  41: { id: 41, name: 'Twineedle', type: 'Bug', category: 'physical', power: 25, accuracy: 100, pp: 20, effect: 'poison_20', priority: 0, highCrit: false },
  44: { id: 44, name: 'Bite', type: 'Normal', category: 'physical', power: 60, accuracy: 100, pp: 25, effect: 'flinch_10', priority: 0, highCrit: false },
  45: { id: 45, name: 'Growl', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 40, effect: 'lower_atk_1', priority: 0, highCrit: false },
  48: { id: 48, name: 'Supersonic', type: 'Normal', category: 'status', power: 0, accuracy: 55, pp: 20, effect: 'confuse', priority: 0, highCrit: false },
  52: { id: 52, name: 'Ember', type: 'Fire', category: 'special', power: 40, accuracy: 100, pp: 25, effect: 'burn_10', priority: 0, highCrit: false },
  53: { id: 53, name: 'Flamethrower', type: 'Fire', category: 'special', power: 90, accuracy: 100, pp: 15, effect: 'burn_10', priority: 0, highCrit: false },
  55: { id: 55, name: 'Water Gun', type: 'Water', category: 'special', power: 40, accuracy: 100, pp: 25, effect: 'none', priority: 0, highCrit: false },
  56: { id: 56, name: 'Hydro Pump', type: 'Water', category: 'special', power: 110, accuracy: 80, pp: 5, effect: 'none', priority: 0, highCrit: false },
  57: { id: 57, name: 'Surf', type: 'Water', category: 'special', power: 90, accuracy: 100, pp: 15, effect: 'none', priority: 0, highCrit: false },
  63: { id: 63, name: 'Hyper Beam', type: 'Normal', category: 'special', power: 150, accuracy: 90, pp: 5, effect: 'recharge', priority: 0, highCrit: false },
  65: { id: 65, name: 'Razor Leaf', type: 'Grass', category: 'physical', power: 55, accuracy: 95, pp: 25, effect: 'none', priority: 0, highCrit: true },
  71: { id: 71, name: 'Absorb', type: 'Grass', category: 'special', power: 20, accuracy: 100, pp: 20, effect: 'drain_half', priority: 0, highCrit: false },
  72: { id: 72, name: 'Mega Drain', type: 'Grass', category: 'special', power: 40, accuracy: 100, pp: 10, effect: 'drain_half', priority: 0, highCrit: false },
  73: { id: 73, name: 'Leech Seed', type: 'Grass', category: 'status', power: 0, accuracy: 90, pp: 10, effect: 'leech_seed', priority: 0, highCrit: false },
  77: { id: 77, name: 'Sleep Powder', type: 'Grass', category: 'status', power: 0, accuracy: 75, pp: 15, effect: 'sleep', priority: 0, highCrit: false },
  79: { id: 79, name: 'Stun Spore', type: 'Grass', category: 'status', power: 0, accuracy: 75, pp: 30, effect: 'paralysis', priority: 0, highCrit: false },
  84: { id: 84, name: 'Thunder Shock', type: 'Electric', category: 'special', power: 40, accuracy: 100, pp: 30, effect: 'paralysis_10', priority: 0, highCrit: false },
  85: { id: 85, name: 'Thunderbolt', type: 'Electric', category: 'special', power: 90, accuracy: 100, pp: 15, effect: 'paralysis_10', priority: 0, highCrit: false },
  86: { id: 86, name: 'Thunder Wave', type: 'Electric', category: 'status', power: 0, accuracy: 100, pp: 20, effect: 'paralysis', priority: 0, highCrit: false },
  88: { id: 88, name: 'Rock Throw', type: 'Rock', category: 'physical', power: 50, accuracy: 90, pp: 15, effect: 'none', priority: 0, highCrit: false },
  91: { id: 91, name: 'Dig', type: 'Ground', category: 'physical', power: 80, accuracy: 100, pp: 10, effect: 'two_turn', priority: 0, highCrit: false },
  93: { id: 93, name: 'Confusion', type: 'Psychic', category: 'special', power: 50, accuracy: 100, pp: 25, effect: 'confuse_10', priority: 0, highCrit: false },
  98: { id: 98, name: 'Quick Attack', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 30, effect: 'none', priority: 1, highCrit: false },
  99: { id: 99, name: 'Rage', type: 'Normal', category: 'physical', power: 20, accuracy: 100, pp: 20, effect: 'rage', priority: 0, highCrit: false },
  106: { id: 106, name: 'Harden', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 30, effect: 'raise_def_1', priority: 0, highCrit: false },
  110: { id: 110, name: 'Withdraw', type: 'Water', category: 'status', power: 0, accuracy: 100, pp: 40, effect: 'raise_def_1', priority: 0, highCrit: false },
  111: { id: 111, name: 'Bubble Beam', type: 'Water', category: 'special', power: 65, accuracy: 100, pp: 20, effect: 'lower_spd_10', priority: 0, highCrit: false },
  130: { id: 130, name: 'Slash', type: 'Normal', category: 'physical', power: 70, accuracy: 100, pp: 20, effect: 'none', priority: 0, highCrit: true },
  145: { id: 145, name: 'Bubble', type: 'Water', category: 'special', power: 20, accuracy: 100, pp: 30, effect: 'lower_spd_10', priority: 0, highCrit: false },
}
