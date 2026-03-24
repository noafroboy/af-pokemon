type Note = { pitch: string | null; duration: string }
const n = (pitch: string, dur = '8n'): Note => ({ pitch, duration: dur })
const r = (dur = '8n'): Note => ({ pitch: null, duration: dur })

export const TITLE_THEME = {
  bpm: 120, loop: true, instrument: 'square' as const,
  notes: [
    n('A3'),n('C4'),n('E4'),n('A4'),n('E4'),n('C4'),n('A3'),r(),    // bar 1 Am up/down
    n('G3'),n('B3'),n('D4'),n('G4'),n('D4'),n('B3'),n('G3'),r(),    // bar 2 G
    n('F4'),n('A4'),n('C5'),n('F5'),n('C5'),n('A4'),n('F4'),r(),    // bar 3 F
    n('E4'),n('G4'),n('B4'),n('E5'),n('B4'),n('G4'),n('E4'),r(),    // bar 4 Em
    n('A3'),n('C4'),n('E4'),n('A4'),n('G4'),n('E4'),n('C4'),r(),    // bar 5 Am var
    n('D4'),n('F4'),n('A4'),n('D5'),n('C5'),n('A4'),n('F4'),r(),    // bar 6 Dm
    n('E4'),n('G4'),n('B4'),n('C5'),n('B4'),n('A4'),n('G4'),r(),    // bar 7 Em var
    n('A4'),n('E4'),n('C4'),n('A3'),n('A3'),r(),r(),r(),             // bar 8 resolve
  ],
}

export const PALLET_TOWN = {
  bpm: 100, loop: true, instrument: 'triangle' as const,
  notes: [
    n('E4'),n('D4'),n('C4'),n('D4'),n('E4'),n('E4'),n('E4'),r(),    // bar 1
    n('D4'),n('D4'),n('D4'),r(),n('E4'),n('G4'),n('G4'),r(),        // bar 2
    n('E4'),n('D4'),n('C4'),n('D4'),n('E4'),n('E4'),n('E4'),n('E4'),// bar 3
    n('D4'),n('D4'),n('E4'),n('D4'),n('C4'),r(),r(),r(),             // bar 4
    n('G4'),n('G4'),n('G4'),r(),n('A4'),n('G4'),n('F4'),n('E4'),    // bar 5
    n('D4'),n('D4'),n('D4'),r(),n('E4'),n('D4'),n('C4'),r(),        // bar 6
    n('C5'),n('B4'),n('A4'),n('G4'),n('F4'),n('E4'),n('D4'),r(),    // bar 7
    n('C4'),n('E4'),n('G4'),n('C5'),n('G4'),n('E4'),n('C4'),r(),    // bar 8
  ],
}

export const ROUTE_1 = {
  bpm: 140, loop: true, instrument: 'square' as const,
  notes: [
    n('C4'),n('E4'),n('G4'),n('C5'),n('G4'),n('E4'),n('C4'),r(),    // bar 1
    n('D4'),n('F4'),n('A4'),n('D5'),n('A4'),n('F4'),n('D4'),r(),    // bar 2
    n('E4'),n('G4'),n('B4'),n('E5'),n('B4'),n('G4'),n('E4'),r(),    // bar 3
    n('C4'),n('G4'),n('E4'),n('C4'),n('G3'),n('E3'),n('C4'),r(),    // bar 4
    n('G4'),n('A4'),n('B4'),n('C5'),n('D5'),n('E5'),n('F5'),n('G5'),// bar 5
    n('E5'),n('D5'),n('C5'),n('B4'),n('A4'),n('G4'),n('F4'),n('E4'),// bar 6
    n('D4'),n('E4'),n('F4'),n('G4'),n('A4'),n('B4'),n('C5'),r(),    // bar 7
    n('C5'),n('G4'),n('E4'),n('C4'),n('D4'),n('F4'),n('A4'),r(),    // bar 8
  ],
}

export const POKEMON_CENTER = {
  bpm: 100, loop: false, instrument: 'triangle' as const,
  notes: [
    n('C5','4n'),n('D5','4n'),n('E5','4n'),n('F5','4n'),
    n('G5','4n'),n('A5','4n'),n('G5','2n'),r('2n'),
  ],
}

export const VICTORY_FANFARE = {
  bpm: 140, loop: false, instrument: 'square' as const,
  notes: [
    n('C4','8n'),r('16n'),n('C4','8n'),r('16n'),
    n('C4','8n'),r('8n'),n('G4','8n'),r('8n'),
    n('E5','4n'),n('C5','2n'),r('4n'),
  ],
}

export const BADGE_FANFARE = {
  bpm: 120, loop: false, instrument: 'square' as const,
  notes: [
    n('C4','8n'),r('16n'),n('E4','8n'),r('16n'),n('G4','8n'),r('16n'),
    n('C5','4n'),n('G4','8n'),n('C5','2n'),r('4n'),
  ],
}
