#!/usr/bin/env node
/**
 * Generate SFX WAV files for the Pokemon game.
 * Run via: node scripts/generate-sfx.mjs
 * Or: npm run generate-sfx
 *
 * Pure Node.js — no external dependencies required.
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'sfx')
mkdirSync(OUT_DIR, { recursive: true })

const SR = 44100

/** Write PCM samples as a mono 16-bit WAV file. */
function writeWav(filename, samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)         // PCM
  buf.writeUInt16LE(1, 22)         // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2)
  }
  writeFileSync(join(OUT_DIR, filename), buf)
  console.log(`  ✓ ${filename} (${(n / SR * 1000).toFixed(0)}ms, ${n} samples)`)
}

/** Generate samples for a single oscillator with ADSR and optional frequency sweep. */
function osc({ freq, freqEnd, duration, wave = 'square', attack = 0.01, decay = 0.05, sustain = 0.5, release = 0.1, amp = 0.5 }) {
  const n = Math.ceil(duration * SR)
  const s = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = freqEnd != null ? freq + (freqEnd - freq) * (t / duration) : freq
    phase = (phase + f / SR) % 1
    let env
    const rel = duration - release
    if (t < attack) env = t / attack
    else if (t < attack + decay) env = 1 - (1 - sustain) * ((t - attack) / decay)
    else if (t < rel) env = sustain
    else env = sustain * Math.max(0, (duration - t) / release)
    let sample
    if (wave === 'square') sample = phase < 0.5 ? 1 : -1
    else if (wave === 'sawtooth') sample = phase * 2 - 1
    else if (wave === 'triangle') sample = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4
    else if (wave === 'noise') sample = Math.random() * 2 - 1
    else sample = Math.sin(2 * Math.PI * phase)
    s[i] = sample * env * amp
  }
  return s
}

/** Concatenate multiple sample arrays. */
function concat(...parts) {
  const total = parts.reduce((a, b) => a + b.length, 0)
  const out = new Float32Array(total)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

/** Mix two sample arrays at given ratio (0=all a, 1=all b). */
function mix(a, b, ratio = 0.5) {
  const n = Math.max(a.length, b.length)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = (a[i] ?? 0) * (1 - ratio) + (b[i] ?? 0) * ratio
  return out
}

// Note frequencies (Hz)
const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23
const G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25
const D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99

console.log('Generating SFX WAV files...')

// Short UI sounds
writeWav('menu-select.wav',  osc({ freq: 880, duration: 0.05, wave: 'square', attack: 0.002, decay: 0.035, sustain: 0, release: 0.013, amp: 0.5 }))
writeWav('text-blip.wav',   osc({ freq: 800, duration: 0.02, wave: 'square', attack: 0.001, decay: 0.01, sustain: 0, release: 0.009, amp: 0.4 }))

// Encounter flash: white noise swept down from 2kHz to 200Hz
writeWav('encounter-flash.wav', mix(
  osc({ freq: 2000, freqEnd: 200, duration: 0.4, wave: 'sawtooth', attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.1, amp: 0.4 }),
  osc({ freq: 0, duration: 0.4, wave: 'noise', attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1, amp: 0.35 }),
  0.4
))

// Hit sounds
writeWav('hit-normal.wav',   osc({ freq: 300, freqEnd: 150, duration: 0.15, wave: 'square', attack: 0.002, decay: 0.08, sustain: 0.2, release: 0.05, amp: 0.5 }))
writeWav('hit-super.wav',    osc({ freq: 500, freqEnd: 250, duration: 0.17, wave: 'square', attack: 0.002, decay: 0.1,  sustain: 0.3, release: 0.06, amp: 0.55 }))
writeWav('hit-not-very.wav', osc({ freq: 200, freqEnd: 150, duration: 0.15, wave: 'sine',   attack: 0.005, decay: 0.1,  sustain: 0.1, release: 0.04, amp: 0.4 }))
writeWav('no-effect.wav',    osc({ freq: 150, duration: 0.08, wave: 'sine', attack: 0.005, decay: 0.05, sustain: 0, release: 0.025, amp: 0.3 }))

// Pokemon faint: long descending sweep
writeWav('pokemon-faint.wav', osc({ freq: 400, freqEnd: 50, duration: 0.8, wave: 'sawtooth', attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.2, amp: 0.5 }))

// Level up: C4 E4 G4 C5 arpeggio
writeWav('level-up.wav', concat(
  osc({ freq: C4, duration: 0.14, wave: 'square', attack: 0.005, decay: 0.05, sustain: 0.6, release: 0.04, amp: 0.5 }),
  osc({ freq: E4, duration: 0.14, wave: 'square', attack: 0.005, decay: 0.05, sustain: 0.6, release: 0.04, amp: 0.5 }),
  osc({ freq: G4, duration: 0.14, wave: 'square', attack: 0.005, decay: 0.05, sustain: 0.6, release: 0.04, amp: 0.5 }),
  osc({ freq: C5, duration: 0.54, wave: 'square', attack: 0.005, decay: 0.08, sustain: 0.7, release: 0.1, amp: 0.55 }),
))

// EXP gain: short C4 → E4
writeWav('exp-gain.wav', concat(
  osc({ freq: C4, duration: 0.09, wave: 'square', attack: 0.002, decay: 0.04, sustain: 0.5, release: 0.03, amp: 0.4 }),
  osc({ freq: E4, duration: 0.1,  wave: 'square', attack: 0.002, decay: 0.04, sustain: 0.5, release: 0.04, amp: 0.4 }),
))

// Pokeball shake: noise burst + low thud
writeWav('pokeball-shake.wav', concat(
  osc({ freq: 0, duration: 0.05, wave: 'noise', attack: 0.001, decay: 0.02, sustain: 0.3, release: 0.02, amp: 0.5 }),
  osc({ freq: 80, duration: 0.14, wave: 'sine', attack: 0.005, decay: 0.08, sustain: 0.2, release: 0.04, amp: 0.5 }),
))

// Catch success: C4 E4 G4 triumphant
writeWav('catch-success.wav', concat(
  osc({ freq: C4, duration: 0.22, wave: 'square', attack: 0.005, decay: 0.08, sustain: 0.6, release: 0.06, amp: 0.5 }),
  osc({ freq: E4, duration: 0.22, wave: 'square', attack: 0.005, decay: 0.08, sustain: 0.6, release: 0.06, amp: 0.5 }),
  osc({ freq: G4, duration: 0.54, wave: 'square', attack: 0.005, decay: 0.1,  sustain: 0.7, release: 0.12, amp: 0.55 }),
))

// Heal jingle: ascending C D E F G A (triangle, gentle)
writeWav('heal-jingle.wav', concat(
  osc({ freq: C5, duration: 0.27, wave: 'triangle', attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.06, amp: 0.45 }),
  osc({ freq: D5, duration: 0.27, wave: 'triangle', attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.06, amp: 0.45 }),
  osc({ freq: E5, duration: 0.27, wave: 'triangle', attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.06, amp: 0.45 }),
  osc({ freq: F5, duration: 0.27, wave: 'triangle', attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.06, amp: 0.45 }),
  osc({ freq: G5, duration: 0.27, wave: 'triangle', attack: 0.01, decay: 0.06, sustain: 0.6, release: 0.06, amp: 0.45 }),
  osc({ freq: A4, duration: 0.65, wave: 'triangle', attack: 0.01, decay: 0.1,  sustain: 0.7, release: 0.15, amp: 0.5 }),
))

// Badge get fanfare: C4 → G4 → C5 with vibrato (simulated via slight frequency variation)
function vibratoOsc({ freq, duration, wave, vibratoRate = 5, vibratoDepth = 0.015, ...rest }) {
  const n = Math.ceil(duration * SR)
  const s = new Float32Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = freq * (1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * t))
    phase = (phase + f / SR) % 1
    let env; const att = rest.attack ?? 0.01, dec = rest.decay ?? 0.05, sus = rest.sustain ?? 0.6, rel = rest.release ?? 0.1
    const relStart = duration - rel
    if (t < att) env = t / att
    else if (t < att + dec) env = 1 - (1 - sus) * ((t - att) / dec)
    else if (t < relStart) env = sus
    else env = sus * Math.max(0, (duration - t) / rel)
    const sample = wave === 'square' ? (phase < 0.5 ? 1 : -1) : phase * 2 - 1
    s[i] = sample * env * (rest.amp ?? 0.5)
  }
  return s
}
writeWav('badge-get.wav', concat(
  vibratoOsc({ freq: C4, duration: 0.9, wave: 'square', attack: 0.01, decay: 0.08, sustain: 0.65, release: 0.15 }),
  vibratoOsc({ freq: G4, duration: 0.9, wave: 'square', attack: 0.01, decay: 0.08, sustain: 0.65, release: 0.15 }),
  vibratoOsc({ freq: C5, duration: 1.2, wave: 'square', attack: 0.01, decay: 0.1,  sustain: 0.7,  release: 0.3  }),
))

console.log(`\nGenerated ${14} SFX files in ${OUT_DIR}`)
