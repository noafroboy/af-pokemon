Build a 2D Gameboy-style Pokemon RPG inspired by Pokemon Red/Blue.

## Vision
A faithful recreation of the Pokemon Red/Blue experience as a browser-based game. The player explores a pixel-art overworld, encounters wild Pokemon in tall grass, battles trainers, collects gym badges, and builds a team of 6 Pokemon. The art style, music, and game feel should evoke the original Gameboy era — chunky pixels, chiptune sounds, tile-based movement, and turn-based battles.

## Research Requirements (CRITICAL — spend time here)
Before designing anything, deeply research the original Pokemon Red/Blue:
- **Game loop**: What does minute-to-minute gameplay actually feel like? Walk, encounter, battle, catch, heal, repeat.
- **Battle system**: Turn-based, 4 moves per Pokemon, type effectiveness chart, PP system, status effects (poison, sleep, paralysis, burn, freeze), stat stages, critical hits, accuracy/evasion.
- **Overworld mechanics**: Tile-based grid movement (16x16 tiles), collision detection, tall grass encounters, NPC dialog, route transitions, indoor/outdoor maps.
- **Pokemon data model**: 151 Pokemon (start with first 15-20 for MVP), stats (HP/Attack/Defense/Speed/Special), types, learnsets, evolution chains, catch rates, experience curves.
- **Progression**: Starter selection (3 choices), 8 gym badges, rival encounters, Pokemon Center healing, PokeMart items (Pokeballs, Potions, Antidotes).
- **UI/UX of the original**: The menu system, bag, Pokemon party screen, PC storage, Pokedex. Study screenshots and gameplay videos.

## Critical User Journeys

### Journey 1: New game start
Player opens the game -> Professor Oak intro -> name entry -> rival naming -> starter Pokemon selection (3 choices with preview) -> first battle vs rival -> exits lab into town.

### Journey 2: Wild encounter and catch
Player walks through tall grass -> screen transition effect -> wild Pokemon appears with battle animation -> player selects moves or throws Pokeball -> catch animation -> Pokemon added to party or PC.

### Journey 3: Gym battle
Player enters gym -> navigates past trainers -> reaches gym leader -> multi-Pokemon battle -> wins badge -> badge screen celebration.

### Journey 4: Team management
Player opens menu -> views party (6 Pokemon with HP bars, levels, types) -> swaps order -> uses items -> checks moves and stats.

## Asset Requirements
- **Pixel art sprites**: All Pokemon need front + back battle sprites (64x64), overworld sprites (16x16). Use DALL-E to generate in consistent Gameboy pixel art style.
- **Tile sets**: Grass, water, trees, buildings, paths, gym interiors, Pokemon Center, caves. 16x16 pixel tiles.
- **Music**: Chiptune-style battle theme, town theme, route theme, victory fanfare, Pokemon Center heal jingle. Generate via OpenAI TTS or find approach for chiptune generation.
- **Sound effects**: Attack sounds (tackle, ember, water gun, etc.), level up, Pokemon cry (unique per species), menu select, text scroll, encounter transition.
- **UI elements**: HP bars, text boxes, menu frames, type badges, Pokeball icons.
- Art style MUST be consistent — define the palette (4-color Gameboy green, or enhanced GBC palette) and stick to it.

## Non-Negotiable Requirements
- Playable on both desktop (keyboard: arrow keys + Z/X/Enter) and mobile (virtual D-pad + A/B buttons)
- Tile-based movement on a grid (not free movement)
- Turn-based battle system with type effectiveness
- At least 15 unique Pokemon with distinct sprites, stats, and moves
- Working Pokeball catch mechanic with catch rate formula
- At least 2 routes + 1 town + 1 gym + Pokemon Center
- Save/load game state (localStorage)
- Smooth screen transitions (fade to black for encounters, slide for route changes)
- Battle animations (attack effects, HP bar drain, faint animation)
- Text crawl for dialog and battle messages (character by character, like the original)

## Tech Stack
Next.js 15 with HTML5 Canvas or PixiJS for rendering. TypeScript. Howler.js for audio. localStorage for save data. No server-side requirements — purely client-side game.

## Scope Guidance for Orchestrator
This is a large project. Decompose thoughtfully:
- The FIRST subtask must produce a playable vertical slice: overworld movement on one map + one wild encounter + one battle that resolves.
- Pokemon data, battle engine, and renderer are the core — they need orchestrator-level depth.
- Map editor/data format is important infrastructure — but keep it simple (JSON tilemaps).
- Do NOT try to build all 151 Pokemon. Start with 15-20 for the MVP and make them excellent.
- Sound and music can be a dedicated subtask after core gameplay works.
- Mobile controls (virtual D-pad) should be its own subtask.