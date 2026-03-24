import type * as ToneNS from 'tone'
import { CHIPTUNE_TRACKS } from '../audio/chiptune-tracks'
import type { NoteEvent } from '../audio/chiptune-tracks'
import { SFX_FILES } from '../audio/sfx-sprites'
import { CRY_PARAMS, synthesizeCry } from '../audio/cry-params'

type ToneModule = typeof ToneNS
type HowlModule = typeof import('howler')

interface PartEvent extends NoteEvent { time: number }

export class AudioManager {
  private static _instance: AudioManager | null = null

  audioContextUnlocked = false
  private currentTrackId: string | null = null
  private pendingTrackId: string | null = null
  private _musicVolume = 0.7
  private _sfxVolume = 0.8
  private textBlipLastMs = 0

  private Tone: ToneModule | null = null
  // Stored as object to avoid coupling to Tone.js types at import time
  private musicPart: object | null = null
  private musicSynth: object | null = null

  private HowlCtor: HowlModule['Howl'] | null = null
  private howlCache = new Map<string, InstanceType<HowlModule['Howl']>>()
  private audioCtx: AudioContext | null = null

  static getInstance(): AudioManager {
    if (!AudioManager._instance) AudioManager._instance = new AudioManager()
    return AudioManager._instance
  }

  /** For tests only — reset singleton */
  static _resetForTest(): void { AudioManager._instance = null }

  private constructor() {}

  onFirstGesture(): void {
    if (this.audioContextUnlocked || typeof window === 'undefined') return
    this.audioContextUnlocked = true
    void this.initAudio()
  }

  private async initAudio(): Promise<void> {
    try {
      const [T, H] = await Promise.all([import('tone'), import('howler')])
      this.Tone = T
      await T.start()
      this.HowlCtor = H.Howl
      this.audioCtx = new AudioContext()
      for (const [id, src] of Object.entries(SFX_FILES)) {
        this.howlCache.set(id, new H.Howl({ src: [src], preload: true, volume: this._sfxVolume }))
      }
      if (this.pendingTrackId) {
        const tid = this.pendingTrackId
        this.pendingTrackId = null
        this.startTrack(tid)
      }
    } catch (err) {
      console.warn('[AudioManager] init failed:', err)
    }
  }

  playMusic(trackId: string): void {
    try {
      if (!this.audioContextUnlocked) { this.pendingTrackId = trackId; return }
      if (trackId === this.currentTrackId) return
      if (!this.Tone) { this.pendingTrackId = trackId; return }
      this.startTrack(trackId)
    } catch (err) { console.warn('[AudioManager] playMusic failed:', err) }
  }

  stopMusic(fadeMs = 500): void {
    try {
      void fadeMs
      if (this.musicPart) { (this.musicPart as { dispose(): void }).dispose(); this.musicPart = null }
      if (this.musicSynth) { (this.musicSynth as { dispose(): void }).dispose(); this.musicSynth = null }
      if (this.Tone && this.Tone.Transport.state === 'started') this.Tone.Transport.stop()
      this.currentTrackId = null
    } catch (err) { console.warn('[AudioManager] stopMusic failed:', err) }
  }

  playSFX(sfxId: string): void {
    try {
      if (!this.audioContextUnlocked) return
      this.howlCache.get(sfxId)?.play()
    } catch (err) { console.warn('[AudioManager] playSFX failed:', err) }
  }

  playTextBlip(): void {
    const now = Date.now()
    if (now - this.textBlipLastMs < 100) return
    this.textBlipLastMs = now
    this.playSFX('text-blip')
  }

  playCry(speciesId: number): void {
    try {
      if (!this.audioContextUnlocked || !this.audioCtx) return
      const params = CRY_PARAMS[speciesId]
      if (!params) return
      const buf = synthesizeCry(this.audioCtx, params)
      const src = this.audioCtx.createBufferSource()
      src.buffer = buf
      src.connect(this.audioCtx.destination)
      src.start()
    } catch (err) { console.warn('[AudioManager] playCry failed:', err) }
  }

  setMusicVolume(v: number): void {
    try {
      this._musicVolume = v
      if (this.Tone) this.Tone.Destination.volume.value = this.Tone.gainToDb(Math.max(0.0001, v))
    } catch (err) { console.warn('[AudioManager] setMusicVolume failed:', err) }
  }

  setSFXVolume(v: number): void {
    try {
      this._sfxVolume = v
      for (const h of this.howlCache.values()) (h as { volume(v: number): void }).volume(v)
    } catch (err) { console.warn('[AudioManager] setSFXVolume failed:', err) }
  }

  private startTrack(id: string): void {
    if (!this.Tone) return
    const T = this.Tone
    const track = CHIPTUNE_TRACKS[id]
    if (!track) return
    this.stopMusic(0)

    const synth = new T.Synth({
      oscillator: { type: track.instrument === 'pulse' ? 'square' : track.instrument },
      envelope: { attack: 0.001, decay: 0.08, sustain: 0.4, release: 0.1 },
    }).toDestination()
    synth.volume.value = T.gainToDb(Math.max(0.001, this._musicVolume))

    const spb = 60 / track.bpm
    const D: Record<string, number> = { '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25 }
    let t = 0
    const evs: PartEvent[] = []
    for (const note of track.notes) {
      if (note.pitch) evs.push({ time: t * spb, pitch: note.pitch, duration: note.duration })
      t += D[note.duration] ?? 0.5
    }

    const part = new T.Part<PartEvent>((time, ev) => {
      if (ev.pitch) synth.triggerAttackRelease(ev.pitch, ev.duration, time)
    }, evs)
    if (track.loop) { part.loop = true; part.loopEnd = t * spb }
    part.start(0)
    T.Transport.bpm.value = track.bpm
    if (T.Transport.state !== 'started') T.Transport.start()

    this.musicPart = part
    this.musicSynth = synth
    this.currentTrackId = id
  }
}
