import type { DialogPage } from '../../systems/DialogSystem'

export const PALLET_SCRIPTS: Record<string, DialogPage[]> = {
  OAK_INTRO: [
    { lines: ["Welcome to the world of", "POKeMON!"] },
    { lines: ["I am Professor OAK.", "This is my lab."] },
    { lines: ["Before you go out,", "pick a POKeMON!"] },
  ],

  MOM_DIALOG: [
    { lines: ["All boys leave home", "someday."] },
    { lines: ["It said so on the", "TV!"] },
  ],

  STARTER_TABLE_TRIGGER: [
    {
      lines: ["There are 3 POKeMON here.", "Which will you choose?"],
      choices: ['BULBASAUR', 'CHARMANDER', 'SQUIRTLE'],
      onChoice: (_index: number) => {
        // Handled by game engine
      },
    },
  ],

  STARTER_OBTAINED_BULBASAUR: [
    { lines: ["BULBASAUR chose you!"] },
    { lines: ["Take good care of it!"] },
  ],

  STARTER_OBTAINED_CHARMANDER: [
    { lines: ["CHARMANDER chose you!"] },
    { lines: ["Take good care of it!"] },
  ],

  STARTER_OBTAINED_SQUIRTLE: [
    { lines: ["SQUIRTLE chose you!"] },
    { lines: ["Take good care of it!"] },
  ],

  RIVAL_COUNTER: [
    { lines: ["Smell ya later!"] },
  ],

  RIVAL_COUNTER_AFTER: [
    { lines: ["So you got a POKeMON?", "Me too!"] },
    { lines: ["Let's battle!"] },
  ],

  NURSE_JOY_HEAL: [
    {
      lines: ["Hello! Would you like", "me to heal your POKeMON?"],
      choices: ['YES', 'NO'],
      onChoice: (_index: number) => {
        // 0 = YES, handled by engine
      },
    },
  ],

  NURSE_JOY_HEALED: [
    { lines: ["Your POKeMON are", "all healed now!"] },
    { lines: ["Come back anytime!"] },
  ],

  PC_TERMINAL: [
    { lines: ["BILL's PC.", "Item Storage System."] },
  ],
}
