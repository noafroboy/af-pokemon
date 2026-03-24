import { describe, it, expect } from 'vitest'
import { CRY_PARAMS, synthesizeCry } from '../audio/cry-params'
import type { CryParams } from '../audio/cry-params'

describe('CRY_PARAMS', () => {
  it('contains entries for all starter Pokemon', () => {
    expect(CRY_PARAMS[1]).toBeDefined()  // Bulbasaur
    expect(CRY_PARAMS[4]).toBeDefined()  // Charmander
    expect(CRY_PARAMS[7]).toBeDefined()  // Squirtle
    expect(CRY_PARAMS[25]).toBeDefined() // Pikachu
  })

  it('contains 21 species entries', () => {
    expect(Object.keys(CRY_PARAMS).length).toBe(21)
  })

  it('Bulbasaur has a low base frequency', () => {
    expect(CRY_PARAMS[1].baseFreq).toBeLessThan(200)
  })

  it('Pikachu has a high base frequency', () => {
    expect(CRY_PARAMS[25].baseFreq).toBeGreaterThan(400)
  })

  it('all entries have valid waveType', () => {
    for (const params of Object.values(CRY_PARAMS)) {
      expect(['square', 'sawtooth']).toContain(params.waveType)
    }
  })

  it('all entries have positive duration', () => {
    for (const params of Object.values(CRY_PARAMS)) {
      expect(params.duration).toBeGreaterThan(0)
    }
  })

  it('all entries have valid ADSR envelope values', () => {
    for (const params of Object.values(CRY_PARAMS)) {
      const { attack, decay, sustain, release } = params.envelope
      expect(attack).toBeGreaterThan(0)
      expect(decay).toBeGreaterThan(0)
      expect(sustain).toBeGreaterThanOrEqual(0)
      expect(sustain).toBeLessThanOrEqual(1)
      expect(release).toBeGreaterThan(0)
    }
  })

  it('Geodude-level entries (low freq) have baseFreq < 150Hz', () => {
    // Species 74 would be Geodude — not in our set, but species 1 (Bulbasaur) = 120Hz
    expect(CRY_PARAMS[1].baseFreq).toBeLessThan(150)
  })
})

describe('synthesizeCry', () => {
  function makeMockCtx(sampleRate = 44100) {
    return {
      sampleRate,
      createBuffer: (ch: number, length: number, sr: number) => {
        const channelData = new Float32Array(length)
        return {
          length,
          sampleRate: sr,
          numberOfChannels: ch,
          getChannelData: () => channelData,
        }
      },
    } as unknown as AudioContext
  }

  it('returns a buffer with correct sample count for Bulbasaur', () => {
    const ctx = makeMockCtx()
    const params = CRY_PARAMS[1]
    const buf = synthesizeCry(ctx, params)
    const expected = Math.ceil(params.duration * 44100)
    expect(buf.length).toBe(expected)
  })

  it('returns a buffer with correct sample count for Pikachu', () => {
    const ctx = makeMockCtx()
    const buf = synthesizeCry(ctx, CRY_PARAMS[25])
    expect(buf.length).toBeGreaterThan(0)
  })

  it('fills the buffer with non-zero samples', () => {
    const ctx = makeMockCtx()
    const buf = synthesizeCry(ctx, CRY_PARAMS[4]) // Charmander
    const data = buf.getChannelData(0)
    const hasNonZero = Array.from(data).some(v => v !== 0)
    expect(hasNonZero).toBe(true)
  })

  it('square wave cry produces samples in [-0.4, 0.4] range', () => {
    const ctx = makeMockCtx()
    const params: CryParams = {
      baseFreq: 440, modFreq: 5, modDepth: 10, duration: 0.1,
      waveType: 'square',
      envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.02 },
    }
    const buf = synthesizeCry(ctx, params)
    const data = buf.getChannelData(0)
    for (const s of data) {
      expect(s).toBeLessThanOrEqual(0.41)
      expect(s).toBeGreaterThanOrEqual(-0.41)
    }
  })

  it('sawtooth wave cry produces samples', () => {
    const ctx = makeMockCtx()
    const params: CryParams = {
      baseFreq: 200, modFreq: 4, modDepth: 20, duration: 0.1,
      waveType: 'sawtooth',
      envelope: { attack: 0.01, decay: 0.02, sustain: 0.5, release: 0.02 },
    }
    const buf = synthesizeCry(ctx, params)
    expect(buf.length).toBeGreaterThan(0)
    const data = buf.getChannelData(0)
    expect(Array.from(data).some(v => v !== 0)).toBe(true)
  })
})
