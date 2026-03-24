import type { BattleState, BattleEvent, PlayerAction, AIAction } from '../../types/BattleTypes'
import { calculateDamage } from './DamageCalc'
import { checkStatusPreventsMove, applyStatusAtTurnEnd, tryInflictStatus, getMoveStatusEffect, checkFireThaw } from './StatusEffects'
import { performCatchAttempt } from './CatchSystem'
import { applyExpGain, calculateWildExp } from './ExpSystem'
import { selectAIMove, getMoveForSlot, consumePP } from './MoveSelection'

function executeAttack(
  state: BattleState,
  attackerSide: 'player' | 'wild',
  moveSlotIndex: number,
  events: BattleEvent[]
): void {
  const attacker = attackerSide === 'player' ? state.playerPokemon : state.wildPokemon
  const defender = attackerSide === 'player' ? state.wildPokemon : state.playerPokemon
  const defenderSide: 'player' | 'wild' = attackerSide === 'player' ? 'wild' : 'player'

  const move = getMoveForSlot(attacker, moveSlotIndex)
  consumePP(attacker, moveSlotIndex)

  events.push({ type: 'MOVE_USED', user: attackerSide, moveId: move.id, moveName: move.name })

  // Check freeze thaw before attacking
  const thawEvents = checkFireThaw(attacker, attackerSide, move.type)
  events.push(...thawEvents)

  if (move.power > 0) {
    const attackerStages = state.statStages[attackerSide]
    const defenderStages = state.statStages[defenderSide]
    const { damage, effectiveness, isCrit } = calculateDamage(
      attacker, defender, move, attackerStages, defenderStages
    )

    if (effectiveness === 0) {
      events.push({ type: 'IMMUNE', target: defenderSide })
    } else {
      defender.currentHp = Math.max(0, defender.currentHp - damage)
      events.push({ type: 'DAMAGE', target: defenderSide, amount: damage, effectiveness })
      if (isCrit) events.push({ type: 'MESSAGE', text: 'A critical hit!' })

      // Check status infliction from move effect
      const statusEffect = getMoveStatusEffect(move.effect)
      if (statusEffect && damage > 0) {
        const evt = tryInflictStatus(defender, defenderSide, statusEffect.status, statusEffect.chance, state.sleepTurns)
        if (evt) events.push(evt)
      }

      // Fire move thaws frozen defender
      events.push(...checkFireThaw(defender, defenderSide, move.type))

      if (defender.currentHp <= 0) {
        defender.currentHp = 0
        events.push({ type: 'FAINT', who: defenderSide })
      }
    }
  } else if (move.effect === 'paralysis' || move.effect === 'sleep') {
    // Status moves
    const statusEffect = getMoveStatusEffect(move.effect)
    if (statusEffect) {
      const evt = tryInflictStatus(defender, defenderSide, statusEffect.status, statusEffect.chance, state.sleepTurns)
      if (evt) events.push(evt)
    }
  }
}

/** Main turn processor. Pure function — mutates pokemon HP/status/PP on state but returns all events. */
export function processTurn(
  state: BattleState,
  playerAction: PlayerAction,
  aiAction: AIAction
): BattleEvent[] {
  if (!state || state.battleOver) return []

  const events: BattleEvent[] = []
  state.turn++

  // Handle RUN action
  if (playerAction.type === 'RUN') {
    state.battleOver = true
    state.playerFled = true
    events.push({ type: 'ESCAPE', success: true })
    events.push({ type: 'MESSAGE', text: 'Got away safely!' })
    return events
  }

  // Handle ITEM action (Pokeball throw)
  if (playerAction.type === 'ITEM') {
    const ballId = playerAction.itemId ?? 1
    const { success, wobbleCount, modifiedCatchRate } = performCatchAttempt(state.wildPokemon, ballId)
    events.push({ type: 'CATCH_ATTEMPT', ballId, shakeCount: wobbleCount })
    events.push({ type: 'CATCH_RESULT', success })
    if (success) {
      state.wildPokemon.caughtAt = 'PLAYER'
      state.caughtPokemon = state.wildPokemon
      state.battleOver = true
      events.push({ type: 'MESSAGE', text: `Gotcha! ${state.wildPokemon.nickname ?? '???'} was caught!` })
    } else {
      events.push({ type: 'MESSAGE', text: `Oh no! The Pokemon broke free! (rate: ${modifiedCatchRate})` })
    }
    if (!success) {
      // AI still gets a turn
      const aiMove = getMoveForSlot(state.wildPokemon, aiAction.moveIndex)
      const { prevented, events: statusEvents } = checkStatusPreventsMove(state.wildPokemon, 'wild', state.sleepTurns)
      events.push(...statusEvents)
      if (!prevented) {
        executeAttack(state, 'wild', aiAction.moveIndex, events)
      }
    }
    applyEndOfTurnStatus(state, events)
    return events
  }

  // Determine turn order by speed (Gen 1: higher speed goes first; ties are random)
  const playerSpeed = state.playerPokemon.stats.speed
  const wildSpeed = state.wildPokemon.stats.speed
  const playerFirst = playerSpeed > wildSpeed || (playerSpeed === wildSpeed && Math.random() < 0.5)

  const order: Array<{ side: 'player' | 'wild'; moveIndex: number }> = playerFirst
    ? [
        { side: 'player', moveIndex: playerAction.moveIndex ?? 0 },
        { side: 'wild', moveIndex: aiAction.moveIndex },
      ]
    : [
        { side: 'wild', moveIndex: aiAction.moveIndex },
        { side: 'player', moveIndex: playerAction.moveIndex ?? 0 },
      ]

  for (const { side, moveIndex } of order) {
    const attacker = side === 'player' ? state.playerPokemon : state.wildPokemon
    if (attacker.currentHp <= 0) continue

    const { prevented, events: statusEvents } = checkStatusPreventsMove(attacker, side, state.sleepTurns)
    events.push(...statusEvents)

    if (!prevented) {
      executeAttack(state, side, moveIndex, events)
    }

    // Check if battle ended after this attack
    if (state.playerPokemon.currentHp <= 0 || state.wildPokemon.currentHp <= 0) break
  }

  // End of turn status damage
  applyEndOfTurnStatus(state, events)

  // Post-battle checks
  if (state.wildPokemon.currentHp <= 0 && !state.battleOver) {
    state.battleOver = true
    const expAmount = calculateWildExp(state.wildPokemon)
    const expEvents = applyExpGain(state.playerPokemon, expAmount, 0)
    events.push(...expEvents.events)
  }

  if (state.playerPokemon.currentHp <= 0 && !state.battleOver) {
    state.battleOver = true
    events.push({ type: 'MESSAGE', text: 'You have no more Pokemon!' })
  }

  return events
}

function applyEndOfTurnStatus(state: BattleState, events: BattleEvent[]): void {
  if (state.playerPokemon.currentHp > 0) {
    const { events: e } = applyStatusAtTurnEnd(state.playerPokemon, 'player')
    events.push(...e)
    if (state.playerPokemon.currentHp <= 0 && !state.battleOver) {
      state.battleOver = true
      events.push({ type: 'FAINT', who: 'player' })
    }
  }
  if (state.wildPokemon.currentHp > 0 && !state.battleOver) {
    const { events: e } = applyStatusAtTurnEnd(state.wildPokemon, 'wild')
    events.push(...e)
    if (state.wildPokemon.currentHp <= 0 && !state.battleOver) {
      state.battleOver = true
      const expAmount = calculateWildExp(state.wildPokemon)
      const expEvents = applyExpGain(state.playerPokemon, expAmount, 0)
      events.push(...expEvents.events)
      events.push({ type: 'FAINT', who: 'wild' })
    }
  }
}
