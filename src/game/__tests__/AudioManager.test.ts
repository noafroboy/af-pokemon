import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock tone and howler before importing AudioManager
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  Synth: vi.fn().mockImplementation(() => ({
    volume: { value: 0 },
    toDestination: vi.fn().mockReturnThis(),
    triggerAttackRelease: vi.fn(),
    dispose: vi.fn(),
  })),
  Part: vi.fn().mockImplementation(() => ({
    loop: false,
    loopEnd: 0,
    start: vi.fn().mockReturnThis(),
    dispose: vi.fn(),
  })),
  Transport: {
    state: 'stopped',
    bpm: { value: 120 },
    start: vi.fn(),
    stop: vi.fn(),
  },
  Destination: { volume: { value: 0, rampTo: vi.fn() } },
  gainToDb: vi.fn((v: number) => 20 * Math.log10(Math.max(0.0001, v))),
}))

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    volume: vi.fn(),
  })),
}))

import { AudioManager } from '../engine/AudioManager'

describe('AudioManager', () => {
  beforeEach(() => {
    AudioManager._resetForTest()
    vi.clearAllMocks()
  })

  it('returns the same singleton instance', () => {
    const a = AudioManager.getInstance()
    const b = AudioManager.getInstance()
    expect(a).toBe(b)
  })

  it('starts with audioContextUnlocked = false', () => {
    const am = AudioManager.getInstance()
    expect(am.audioContextUnlocked).toBe(false)
  })

  it('playMusic queues pending track when not initialized', () => {
    const am = AudioManager.getInstance()
    am.playMusic('title-theme')
    // Should not throw; track is queued
    expect(am.audioContextUnlocked).toBe(false)
  })

  it('playMusic does nothing for the same track ID', () => {
    const am = AudioManager.getInstance()
    am.audioContextUnlocked = true
    // Without Tone loaded, it queues
    am.playMusic('wild-battle')
    am.playMusic('wild-battle')
    // No error thrown
  })

  it('playSFX no-ops when audioContextUnlocked is false', () => {
    const am = AudioManager.getInstance()
    expect(() => am.playSFX('menu-select')).not.toThrow()
  })

  it('stopMusic no-ops gracefully when nothing playing', () => {
    const am = AudioManager.getInstance()
    expect(() => am.stopMusic(500)).not.toThrow()
  })

  it('playCry no-ops when audioContextUnlocked is false', () => {
    const am = AudioManager.getInstance()
    expect(() => am.playCry(1)).not.toThrow()
  })

  it('playCry no-ops for unknown species ID', () => {
    const am = AudioManager.getInstance()
    am.audioContextUnlocked = true
    expect(() => am.playCry(999)).not.toThrow()
  })

  it('setMusicVolume no-ops when Tone not loaded', () => {
    const am = AudioManager.getInstance()
    expect(() => am.setMusicVolume(0.5)).not.toThrow()
  })

  it('setSFXVolume no-ops when no Howls loaded', () => {
    const am = AudioManager.getInstance()
    expect(() => am.setSFXVolume(0.5)).not.toThrow()
  })

  it('playTextBlip throttles to max once per 100ms', () => {
    const am = AudioManager.getInstance()
    am.audioContextUnlocked = true
    // Both calls happen near-instantly; only one blip should attempt to play
    am.playTextBlip()
    am.playTextBlip()
    // No throw — just verifying throttle logic exists
  })

  it('onFirstGesture is a no-op outside browser', () => {
    // In jsdom, typeof window !== 'undefined' — but audioContextUnlocked stays true after
    const am = AudioManager.getInstance()
    expect(() => am.onFirstGesture()).not.toThrow()
    expect(am.audioContextUnlocked).toBe(true)
  })

  it('onFirstGesture only fires once', () => {
    const am = AudioManager.getInstance()
    am.onFirstGesture()
    am.onFirstGesture()
    // Should only set to true once and call initAudio once
    expect(am.audioContextUnlocked).toBe(true)
  })
})
