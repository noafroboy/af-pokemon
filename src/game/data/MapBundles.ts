import palletTown from './maps/pallet-town.json'
import route1 from './maps/route-1.json'
import viridianCity from './maps/viridian-city.json'
import pokemonCenter from './maps/pokemon-center.json'
import pewterGym from './maps/pewter-gym.json'

export const TIMESTEP = 1000 / 60

export const MAP_BUNDLES: Record<string, unknown> = {
  'pallet-town': palletTown, 'route-1': route1, 'viridian-city': viridianCity,
  'pokemon-center': pokemonCenter, 'pewter-gym': pewterGym,
}
