export interface CryParams {
  baseFreq: number
  modFreq: number
  modDepth: number
  duration: number
  waveType: 'square' | 'sawtooth'
  envelope: { attack: number; decay: number; sustain: number; release: number }
}

export const CRY_PARAMS: Record<number, CryParams> = {
  1:  { baseFreq: 120, modFreq: 3,  modDepth: 20, duration: 0.8, waveType: 'square',   envelope: { attack: 0.02, decay: 0.10, sustain: 0.6, release: 0.20 } }, // Bulbasaur
  2:  { baseFreq: 140, modFreq: 4,  modDepth: 25, duration: 0.7, waveType: 'square',   envelope: { attack: 0.02, decay: 0.10, sustain: 0.6, release: 0.20 } }, // Ivysaur
  3:  { baseFreq: 100, modFreq: 2,  modDepth: 30, duration: 0.9, waveType: 'sawtooth', envelope: { attack: 0.02, decay: 0.15, sustain: 0.5, release: 0.30 } }, // Venusaur
  4:  { baseFreq: 280, modFreq: 8,  modDepth: 40, duration: 0.6, waveType: 'square',   envelope: { attack: 0.01, decay: 0.08, sustain: 0.5, release: 0.15 } }, // Charmander
  5:  { baseFreq: 240, modFreq: 7,  modDepth: 35, duration: 0.65, waveType: 'square',  envelope: { attack: 0.01, decay: 0.10, sustain: 0.5, release: 0.20 } }, // Charmeleon
  6:  { baseFreq: 180, modFreq: 5,  modDepth: 50, duration: 0.9, waveType: 'sawtooth', envelope: { attack: 0.01, decay: 0.20, sustain: 0.4, release: 0.30 } }, // Charizard
  7:  { baseFreq: 200, modFreq: 6,  modDepth: 60, duration: 0.7, waveType: 'square',   envelope: { attack: 0.02, decay: 0.12, sustain: 0.55, release: 0.18 } }, // Squirtle
  8:  { baseFreq: 180, modFreq: 5,  modDepth: 55, duration: 0.7, waveType: 'square',   envelope: { attack: 0.02, decay: 0.12, sustain: 0.5, release: 0.20 } }, // Wartortle
  9:  { baseFreq: 150, modFreq: 4,  modDepth: 70, duration: 0.85, waveType: 'sawtooth', envelope: { attack: 0.02, decay: 0.20, sustain: 0.4, release: 0.30 } }, // Blastoise
  10: { baseFreq: 380, modFreq: 12, modDepth: 20, duration: 0.4, waveType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.10 } }, // Caterpie
  11: { baseFreq: 320, modFreq: 10, modDepth: 15, duration: 0.45, waveType: 'square',  envelope: { attack: 0.005, decay: 0.06, sustain: 0.3, release: 0.10 } }, // Metapod
  12: { baseFreq: 300, modFreq: 15, modDepth: 30, duration: 0.55, waveType: 'square',  envelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.15 } }, // Butterfree
  13: { baseFreq: 350, modFreq: 14, modDepth: 15, duration: 0.35, waveType: 'square',  envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.10 } }, // Weedle
  14: { baseFreq: 310, modFreq: 11, modDepth: 12, duration: 0.4, waveType: 'square',   envelope: { attack: 0.005, decay: 0.05, sustain: 0.3, release: 0.10 } }, // Kakuna
  15: { baseFreq: 260, modFreq: 20, modDepth: 40, duration: 0.5, waveType: 'sawtooth', envelope: { attack: 0.01, decay: 0.08, sustain: 0.45, release: 0.15 } }, // Beedrill
  16: { baseFreq: 400, modFreq: 16, modDepth: 25, duration: 0.5, waveType: 'square',   envelope: { attack: 0.005, decay: 0.08, sustain: 0.35, release: 0.15 } }, // Pidgey
  17: { baseFreq: 360, modFreq: 14, modDepth: 30, duration: 0.55, waveType: 'square',  envelope: { attack: 0.01, decay: 0.10, sustain: 0.4, release: 0.15 } }, // Pidgeotto
  18: { baseFreq: 300, modFreq: 12, modDepth: 35, duration: 0.65, waveType: 'sawtooth', envelope: { attack: 0.01, decay: 0.12, sustain: 0.4, release: 0.20 } }, // Pidgeot
  19: { baseFreq: 350, modFreq: 20, modDepth: 20, duration: 0.3, waveType: 'square',   envelope: { attack: 0.005, decay: 0.04, sustain: 0.3, release: 0.08 } }, // Rattata
  20: { baseFreq: 300, modFreq: 18, modDepth: 25, duration: 0.35, waveType: 'square',  envelope: { attack: 0.005, decay: 0.05, sustain: 0.35, release: 0.10 } }, // Raticate
  25: { baseFreq: 450, modFreq: 25, modDepth: 80, duration: 0.4, waveType: 'square',   envelope: { attack: 0.005, decay: 0.06, sustain: 0.4, release: 0.10 } }, // Pikachu
}

/**
 * Synthesize a Pokemon cry using FM modulation into an AudioBuffer.
 * SSR-safe: only call in browser contexts where AudioContext is available.
 */
export function synthesizeCry(ctx: AudioContext, params: CryParams): AudioBuffer {
  const sr = ctx.sampleRate
  const N = Math.ceil(params.duration * sr)
  const buffer = ctx.createBuffer(1, N, sr)
  const ch = buffer.getChannelData(0)
  const { attack, decay, sustain, release } = params.envelope
  const TWO_PI = 2 * Math.PI

  for (let i = 0; i < N; i++) {
    const t = i / sr

    // ADSR envelope
    let env: number
    const relStart = params.duration - release
    if (t < attack) {
      env = t / attack
    } else if (t < attack + decay) {
      env = 1 - (1 - sustain) * ((t - attack) / decay)
    } else if (t < relStart) {
      env = sustain
    } else {
      env = sustain * Math.max(0, (params.duration - t) / release)
    }

    // FM synthesis: phase = 2π·baseFreq·t + (modDepth/modFreq)·sin(2π·modFreq·t)
    const phase =
      TWO_PI * params.baseFreq * t +
      (params.modDepth / params.modFreq) * Math.sin(TWO_PI * params.modFreq * t)

    const sample =
      params.waveType === 'square'
        ? Math.sin(phase) >= 0 ? 1 : -1
        : ((phase / TWO_PI) % 1 + 1) % 1 * 2 - 1 // sawtooth

    ch[i] = sample * env * 0.4
  }

  return buffer
}
