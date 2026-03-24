import { describe, it, expect } from 'vitest'
import { CHIPTUNE_TRACKS, TRACK_IDS } from '../audio/chiptune-tracks'

describe('CHIPTUNE_TRACKS', () => {
  it('contains all 9 required tracks', () => {
    const required = [
      'title-theme', 'pallet-town', 'route-1', 'pokemon-center',
      'victory-fanfare', 'badge-fanfare',
      'wild-battle', 'trainer-battle', 'gym-battle',
    ]
    for (const id of required) {
      expect(CHIPTUNE_TRACKS[id], `Missing track: ${id}`).toBeDefined()
    }
  })

  it('TRACK_IDS lists exactly 9 tracks', () => {
    expect(TRACK_IDS.length).toBe(9)
  })

  it('all tracks have a positive BPM', () => {
    for (const [id, track] of Object.entries(CHIPTUNE_TRACKS)) {
      expect(track.bpm, `${id}.bpm`).toBeGreaterThan(0)
    }
  })

  it('all tracks have at least one note', () => {
    for (const [id, track] of Object.entries(CHIPTUNE_TRACKS)) {
      expect(track.notes.length, `${id} has no notes`).toBeGreaterThan(0)
    }
  })

  it('looping tracks have at least 8 bars (64 eighth-note slots)', () => {
    const loopingTracks = Object.entries(CHIPTUNE_TRACKS).filter(([, t]) => t.loop)
    for (const [id, track] of loopingTracks) {
      expect(track.notes.length, `${id} has fewer than 64 notes`).toBeGreaterThanOrEqual(64)
    }
  })

  it('non-looping (fanfare) tracks do not loop', () => {
    expect(CHIPTUNE_TRACKS['victory-fanfare'].loop).toBe(false)
    expect(CHIPTUNE_TRACKS['pokemon-center'].loop).toBe(false)
    expect(CHIPTUNE_TRACKS['badge-fanfare'].loop).toBe(false)
  })

  it('looping tracks loop', () => {
    expect(CHIPTUNE_TRACKS['title-theme'].loop).toBe(true)
    expect(CHIPTUNE_TRACKS['wild-battle'].loop).toBe(true)
    expect(CHIPTUNE_TRACKS['pallet-town'].loop).toBe(true)
  })

  it('battle tracks have high BPM (>=155)', () => {
    expect(CHIPTUNE_TRACKS['wild-battle'].bpm).toBeGreaterThanOrEqual(155)
    expect(CHIPTUNE_TRACKS['trainer-battle'].bpm).toBeGreaterThanOrEqual(155)
    expect(CHIPTUNE_TRACKS['gym-battle'].bpm).toBeGreaterThanOrEqual(155)
  })

  it('all notes have a pitch (string or null) and a duration string', () => {
    for (const [id, track] of Object.entries(CHIPTUNE_TRACKS)) {
      for (const note of track.notes) {
        expect(typeof note.pitch === 'string' || note.pitch === null, `${id}: note.pitch invalid`).toBe(true)
        expect(typeof note.duration, `${id}: note.duration must be string`).toBe('string')
        expect(note.duration.length, `${id}: duration empty`).toBeGreaterThan(0)
      }
    }
  })

  it('all tracks have a valid instrument type', () => {
    const valid = ['square', 'triangle', 'sawtooth', 'pulse']
    for (const [id, track] of Object.entries(CHIPTUNE_TRACKS)) {
      expect(valid, `${id}: invalid instrument "${track.instrument}"`).toContain(track.instrument)
    }
  })

  it('title-theme has Am character notes (A3 present)', () => {
    const notes = CHIPTUNE_TRACKS['title-theme'].notes.map(n => n.pitch)
    expect(notes).toContain('A3')
  })

  it('route-1 has faster BPM than pallet-town', () => {
    expect(CHIPTUNE_TRACKS['route-1'].bpm).toBeGreaterThan(CHIPTUNE_TRACKS['pallet-town'].bpm)
  })
})
