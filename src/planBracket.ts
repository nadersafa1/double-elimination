import { GeneratorOptions, GrandFinalFormat, Participant } from './types.js'
import { log2, nextPowerOf2 } from './bracketUtils.js'

export interface BracketPlan {
  eventId: string
  /** Participants sorted by seed, re-ranked to 1..N. */
  participants: Participant[]
  bracketSize: number
  winnersRounds: number
  losersRounds: number
  /** First winners bracket round whose losers drop into the losers bracket. */
  startFromWbRound: number
  grandFinal: GrandFinalFormat
}

/** Validates the options and derives every number the generators need. */
export const planBracket = (options: GeneratorOptions): BracketPlan => {
  const {
    eventId,
    participants,
    idFactory,
    losersStartRoundsBeforeFinal,
    grandFinal = 'none',
  } = options

  if (typeof eventId !== 'string' || eventId.length === 0) {
    throw new Error('eventId must be a non-empty string')
  }
  if (typeof idFactory !== 'function') {
    throw new Error('idFactory must be a function returning unique ids')
  }
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('At least 2 participants required')
  }
  if (
    grandFinal !== 'none' &&
    grandFinal !== 'single' &&
    grandFinal !== 'reset'
  ) {
    throw new Error(`grandFinal must be 'none', 'single' or 'reset'`)
  }

  const ranked = rankParticipants(participants)

  const bracketSize = nextPowerOf2(ranked.length)
  const winnersRounds = log2(bracketSize)

  if (losersStartRoundsBeforeFinal !== undefined) {
    if (
      !Number.isInteger(losersStartRoundsBeforeFinal) ||
      losersStartRoundsBeforeFinal < 0
    ) {
      throw new Error(
        'losersStartRoundsBeforeFinal must be a non-negative integer (0 = pure single elimination)'
      )
    }
    if (losersStartRoundsBeforeFinal === 1 && winnersRounds < 2) {
      throw new Error(
        'losersStartRoundsBeforeFinal=1 requires at least 3 participants (there must be a semifinal round)'
      )
    }
    if (losersStartRoundsBeforeFinal >= winnersRounds) {
      throw new Error(
        `losersStartRoundsBeforeFinal must be less than winnersRounds (${winnersRounds})`
      )
    }
  }

  // Winners bracket rounds (excluding the final) whose losers feed the LB.
  const feederRounds = losersStartRoundsBeforeFinal ?? winnersRounds - 1
  const startFromWbRound = winnersRounds - feederRounds

  if (grandFinal !== 'none' && feederRounds < 1) {
    throw new Error(
      'grandFinal requires a losers bracket: losersStartRoundsBeforeFinal must be at least 1 and there must be at least 3 participants'
    )
  }

  // Each feeder round adds a crossover round (fresh winners bracket losers)
  // plus a consolidation round, minus the consolidation round that would
  // follow the last feeder round. With a grand final the winners final loser
  // becomes an extra feeder, which adds the losers final back.
  let losersRounds = Math.max(0, feederRounds * 2 - 1)
  if (grandFinal !== 'none') losersRounds += 1

  return {
    eventId,
    participants: ranked,
    bracketSize,
    winnersRounds,
    losersRounds,
    startFromWbRound,
    grandFinal,
  }
}

/**
 * Sorts by seed and re-ranks to 1..N.
 *
 * Callers commonly pass sparse or 0-based seeds; ranking makes those behave the
 * same as 1..N instead of silently leaving participants out of the bracket.
 */
const rankParticipants = (participants: Participant[]): Participant[] => {
  const seenIds = new Set<string>()
  const seenSeeds = new Set<number>()

  for (const participant of participants) {
    if (
      !participant ||
      typeof participant.registrationId !== 'string' ||
      participant.registrationId.length === 0
    ) {
      throw new Error('Every participant needs a non-empty registrationId')
    }
    if (
      typeof participant.seed !== 'number' ||
      !Number.isFinite(participant.seed)
    ) {
      throw new Error(
        `Participant "${participant.registrationId}" has a non-numeric seed`
      )
    }
    if (seenIds.has(participant.registrationId)) {
      throw new Error(
        `Duplicate registrationId: "${participant.registrationId}"`
      )
    }
    if (seenSeeds.has(participant.seed)) {
      throw new Error(`Duplicate seed: ${participant.seed}`)
    }
    seenIds.add(participant.registrationId)
    seenSeeds.add(participant.seed)
  }

  return [...participants]
    .sort((a, b) => a.seed - b.seed)
    .map((participant, index) => ({
      registrationId: participant.registrationId,
      seed: index + 1,
    }))
}
