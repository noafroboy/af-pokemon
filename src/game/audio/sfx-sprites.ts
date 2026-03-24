/** Maps SFX identifiers to their WAV file paths (under /assets/sfx/). */
export const SFX_FILES: Record<string, string> = {
  'menu-select':     '/assets/sfx/menu-select.wav',
  'text-blip':       '/assets/sfx/text-blip.wav',
  'encounter-flash': '/assets/sfx/encounter-flash.wav',
  'hit-normal':      '/assets/sfx/hit-normal.wav',
  'hit-super':       '/assets/sfx/hit-super.wav',
  'hit-not-very':    '/assets/sfx/hit-not-very.wav',
  'no-effect':       '/assets/sfx/no-effect.wav',
  'pokemon-faint':   '/assets/sfx/pokemon-faint.wav',
  'level-up':        '/assets/sfx/level-up.wav',
  'exp-gain':        '/assets/sfx/exp-gain.wav',
  'pokeball-shake':  '/assets/sfx/pokeball-shake.wav',
  'catch-success':   '/assets/sfx/catch-success.wav',
  'heal-jingle':     '/assets/sfx/heal-jingle.wav',
  'badge-get':       '/assets/sfx/badge-get.wav',
}

export const SFX_IDS = Object.keys(SFX_FILES) as readonly string[]
