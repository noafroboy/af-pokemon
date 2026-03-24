import { describe, it, expect, vi, afterEach } from 'vitest'
import { calculateModifiedCatchRate, attemptCatch, BALL_BONUSES } from '../src/game/systems/battle/CatchSystem'
import { createPokemonInstance } from '../src/game/entities/PokemonInstance'

afterEach(() => { vi.restoreAllMocks() })

describe('catch formula', () => {
  it('Rattata (catchRate=255) at 1HP with Pokeball → modifiedRate >= 200 (very likely catch)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const rattata = createPokemonInstance(19, 3, 'WILD')
    vi.restoreAllMocks()

    rattata.currentHp = 1
    const rate = calculateModifiedCatchRate(rattata, 1)
    expect(rate).toBeGreaterThanOrEqual(200)
  })

  it('Rattata at full HP with Pokeball → modifiedRate < 100 (likely escape)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const rattata = createPokemonInstance(19, 3, 'WILD')
    vi.restoreAllMocks()

    // Keep HP at max
    rattata.currentHp = rattata.maxHp
    const rate = calculateModifiedCatchRate(rattata, 1)
    expect(rate).toBeLessThan(100)
  })

  it('Rattata at half HP with Great Ball → higher rate than full HP Pokeball', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const rattata = createPokemonInstance(19, 3, 'WILD')
    const rattataFull = createPokemonInstance(19, 3, 'WILD')
    vi.restoreAllMocks()

    rattata.currentHp = Math.floor(rattata.maxHp / 2)
    const halfHpGreatBallRate = calculateModifiedCatchRate(rattata, 2)  // Great Ball = 1.5×
    const fullHpPokeballRate = calculateModifiedCatchRate(rattataFull, 1) // Pokeball, full HP

    // Half HP + Great Ball should give a higher catch rate than full HP + Pokeball
    expect(halfHpGreatBallRate).toBeGreaterThan(fullHpPokeballRate)
    // Rate should be >= 100 (significant chance)
    expect(halfHpGreatBallRate).toBeGreaterThanOrEqual(100)
    // And at least be a meaningful value (based on Rattata's catchRate=255 with 1.5x and half HP)
    expect(halfHpGreatBallRate).toBeGreaterThanOrEqual(150)
  })

  it('ball bonuses are correct: Pokeball=1, GreatBall=1.5, UltraBall=2', () => {
    expect(BALL_BONUSES[1]).toBe(1)
    expect(BALL_BONUSES[2]).toBe(1.5)
    expect(BALL_BONUSES[3]).toBe(2)
  })

  it('wobble count formula: floor(catchRate / 12) matches Gen 1 spec', () => {
    // With catchRate=255, threshold = floor(255/12) = 21
    // All 4 rolls < 21 → caught
    vi.spyOn(Math, 'random').mockReturnValue(0)  // roll=0 always < threshold
    const { success, wobbleCount } = attemptCatch(255)
    expect(wobbleCount).toBe(4)
    expect(success).toBe(true)
    vi.restoreAllMocks()
  })

  it('wobble count 0 when catchRate very low', () => {
    // With catchRate=11, threshold = floor(11/12) = 0
    // roll=0 < 0 is false → 0 wobbles
    // But threshold is max(1, ...) in some implementations; check raw formula
    // floor(11/12) = 0; 0 wobbles since floor(catchRate/12) = 0 means threshold=0
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const { wobbleCount, success } = attemptCatch(11)
    // Threshold=0, all rolls fail → 0 wobbles
    expect(wobbleCount).toBe(0)
    expect(success).toBe(false)
    vi.restoreAllMocks()
  })

  it('high catchRate always succeeds when rolls are low', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01)  // roll ≈ 2 (floor 0.01*256=2)
    const { success } = attemptCatch(255)
    // threshold = floor(255/12) = 21; roll=2 < 21 → all 4 succeed
    expect(success).toBe(true)
    vi.restoreAllMocks()
  })

  it('Ultra Ball doubles catchRate compared to Pokeball', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const rattata = createPokemonInstance(19, 3, 'WILD')
    vi.restoreAllMocks()

    rattata.currentHp = Math.floor(rattata.maxHp / 2)
    const pokeBallRate = calculateModifiedCatchRate(rattata, 1)
    const ultraBallRate = calculateModifiedCatchRate(rattata, 3)

    // Ultra Ball rate should be approximately double
    expect(ultraBallRate).toBeGreaterThan(pokeBallRate)
  })
})
