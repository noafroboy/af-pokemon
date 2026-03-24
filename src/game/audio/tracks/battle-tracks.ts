type Note = { pitch: string | null; duration: string }
const n = (pitch: string, dur = '8n'): Note => ({ pitch, duration: dur })
const r = (dur = '8n'): Note => ({ pitch: null, duration: dur })

export const WILD_BATTLE = {
  bpm: 160, loop: true, instrument: 'square' as const,
  notes: [
    n('E4'),n('E4'),n('E4'),r(),n('E4'),n('F4'),n('G4'),r(),        // bar 1
    n('G4'),r(),n('F4'),r(),n('E4'),r(),n('D4'),r(),                 // bar 2
    n('C4'),n('C4'),n('C4'),r(),n('C4'),n('D4'),n('E4'),r(),        // bar 3
    n('A3'),n('B3'),n('C4'),n('D4'),n('E4'),n('F4'),n('G4'),n('A4'),// bar 4
    n('E5'),n('E5'),n('E5'),r(),n('E5'),n('D5'),n('C5'),r(),        // bar 5
    n('B4'),n('A4'),n('G4'),n('F4'),n('E4'),n('D4'),n('C4'),n('B3'),// bar 6
    n('A3'),n('B3'),n('C4'),n('E4'),n('A4'),n('G4'),n('F4'),n('E4'),// bar 7
    n('E4'),n('D4'),n('C4'),n('B3'),n('A3'),r(),n('A3'),r(),        // bar 8
  ],
}

export const TRAINER_BATTLE = {
  bpm: 160, loop: true, instrument: 'square' as const,
  notes: [
    n('A4'),n('G#4'),n('A4'),r(),n('A4'),n('B4'),n('C5'),r(),       // bar 1
    n('D5'),n('C5'),n('B4'),n('A4'),n('G#4'),n('A4'),r(),r(),       // bar 2
    n('E4'),n('F4'),n('G4'),n('A4'),n('B4'),n('C5'),n('D5'),n('E5'),// bar 3
    n('E5'),n('D5'),n('C5'),n('B4'),n('A4'),n('G#4'),n('A4'),r(),   // bar 4
    n('C5'),n('B4'),n('A4'),n('G#4'),n('A4'),n('B4'),n('C5'),n('D5'),// bar 5
    n('E5'),r(),n('E5'),r(),n('E5'),n('D5'),n('C5'),r(),             // bar 6
    n('B4'),n('A4'),n('G#4'),n('A4'),n('E4'),r(),n('A4'),r(),       // bar 7
    n('A4'),n('G#4'),n('A4'),n('E4'),n('A3'),r(),r(),r(),            // bar 8
  ],
}

export const GYM_BATTLE = {
  bpm: 155, loop: true, instrument: 'sawtooth' as const,
  notes: [
    n('A3'),r(),n('A3'),r(),n('G3'),n('A3'),n('B3'),r(),            // bar 1
    n('C4'),r(),n('C4'),r(),n('B3'),n('C4'),n('D4'),r(),            // bar 2
    n('E4'),r(),n('E4'),r(),n('D4'),n('E4'),n('F4'),r(),            // bar 3
    n('G4'),n('A4'),n('B4'),n('C5'),n('D5'),n('E5'),r(),r(),        // bar 4
    n('E5'),n('D5'),n('C5'),n('B4'),n('A4'),n('G4'),n('F4'),n('E4'),// bar 5
    n('D4'),n('C4'),n('B3'),n('A3'),n('G3'),n('F3'),n('E3'),n('A3'),// bar 6
    n('A4'),r(),n('A4'),r(),n('A4'),n('B4'),n('C5'),n('A4'),        // bar 7
    n('G4'),n('F4'),n('E4'),n('D4'),n('C4'),n('B3'),n('A3'),r(),    // bar 8
  ],
}
