import { NextResponse } from 'next/server'

const MAPS: Record<string, unknown> = {
  'pallet-town':    () => import('@/game/data/maps/pallet-town.json'),
  'route-1':        () => import('@/game/data/maps/route-1.json'),
  'viridian-city':  () => import('@/game/data/maps/viridian-city.json'),
  'pokemon-center': () => import('@/game/data/maps/pokemon-center.json'),
  'pewter-gym':     () => import('@/game/data/maps/pewter-gym.json'),
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mapId: string }> }
): Promise<NextResponse> {
  try {
    const { mapId } = await params
    const loader = MAPS[mapId]
    if (!loader) {
      return NextResponse.json(
        { error: `Map "${mapId}" not found` },
        { status: 404 }
      )
    }
    const mapData = await (loader as () => Promise<{ default: unknown }>)()
    return NextResponse.json(mapData.default)
  } catch (err) {
    console.error('Map API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
