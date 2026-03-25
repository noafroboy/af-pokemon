import { GamePhase } from '../types/GameState'
import type { GameState } from '../types/GameState'
import type { DialogSystem } from '../systems/DialogSystem'
import type { Player } from '../entities/Player'
import { createPokemonInstance } from '../entities/PokemonInstance'

const STARTER_SPECIES: Record<string, number> = {
  BULBASAUR: 1,
  CHARMANDER: 4,
  SQUIRTLE: 7,
}

export class ScriptHandler {
  handle(
    scriptId: string,
    state: GameState,
    dialog: DialogSystem,
    _player: Player
  ): void {
    if (state.flags[`script_done_${scriptId}`]) return

    switch (scriptId) {
      case 'STARTER_TABLE_TRIGGER':
        this.handleStarterTable(state, dialog)
        break
      case 'NURSE_JOY_HEAL':
        this.handleNurseHeal(state, dialog)
        break
      case 'NURSE_JOY_HEALED':
        dialog.startDialog([
          { lines: ['Your POKeMON are', 'all healed now!'] },
          { lines: ['Come back anytime!'] },
        ])
        state.phase = GamePhase.DIALOG
        break
      case 'MOM_DIALOG':
        dialog.startDialog([
          { lines: ['All boys leave home', 'someday.'] },
          { lines: ['It said so on the TV!'] },
        ])
        state.phase = GamePhase.DIALOG
        break
      default:
        dialog.startDialog([{ lines: [`${scriptId}`, ''] }])
        state.phase = GamePhase.DIALOG
    }
  }

  private handleStarterTable(state: GameState, dialog: DialogSystem): void {
    if (state.partyPokemon.length > 0) return
    dialog.startDialog([{
      lines: ['There are 3 POKeMON here.', 'Which will you choose?'],
      choices: ['BULBASAUR', 'CHARMANDER', 'SQUIRTLE'],
      onChoice: (index: number) => {
        const names = ['BULBASAUR', 'CHARMANDER', 'SQUIRTLE']
        const speciesId = STARTER_SPECIES[names[index]] ?? 1
        const ot = String(state.flags['playerName'] ?? 'RED')
        const pokemon = createPokemonInstance(speciesId, 5, ot)
        state.partyPokemon.push(pokemon)
        state.party.push(pokemon.uuid)
        state.flags['script_done_STARTER_TABLE_TRIGGER'] = true
        state.flags['starterObtained'] = names[index]
        dialog.startDialog([
          { lines: [`${names[index]} chose you!`] },
          { lines: ['Take good care of it!'] },
        ])
      },
    }])
    state.phase = GamePhase.DIALOG
  }

  private handleNurseHeal(state: GameState, dialog: DialogSystem): void {
    dialog.startDialog([{
      lines: ['Hello! Would you like', 'me to heal your POKeMON?'],
      choices: ['YES', 'NO'],
      onChoice: (index: number) => {
        if (index === 0) {
          for (const p of state.partyPokemon) p.currentHp = p.maxHp
          dialog.startDialog([
            { lines: ['Your POKeMON are', 'all healed now!'] },
            { lines: ['Come back anytime!'] },
          ])
        }
      },
    }])
    state.phase = GamePhase.DIALOG
  }
}
