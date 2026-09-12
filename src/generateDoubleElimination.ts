import { BracketMatch, GeneratorOptions, Participant } from './types.js'
import { generateSeedPairs } from './bracketUtils.js'
import { planBracket } from './planBracket.js'
import { createWinnersBracket } from './createWinnersBracket.js'
import { createLosersBracket } from './createLosersBracket.js'
import { createGrandFinal } from './createGrandFinal.js'
import { wireLoserRouting } from './wireLoserRouting.js'
import { resolveByes } from './resolveByes.js'

/**
 * Generates every match of a tournament bracket, already wired together.
 *
 * Matches are returned winners bracket first, then losers bracket, then grand
 * final, each ordered by round and then by position.
 */
export const generateDoubleElimination = (
  options: GeneratorOptions
): BracketMatch[] => {
  const {
    eventId,
    participants,
    bracketSize,
    winnersRounds,
    losersRounds,
    startFromWbRound,
    grandFinal,
  } = planBracket(options)

  const { idFactory } = options

  const winnersMatches = createWinnersBracket(
    eventId,
    bracketSize,
    winnersRounds,
    idFactory
  )

  const losersMatches =
    losersRounds > 0
      ? createLosersBracket(
          eventId,
          bracketSize,
          losersRounds,
          startFromWbRound,
          idFactory
        )
      : []

  if (losersMatches.length > 0) {
    wireLoserRouting(
      winnersMatches,
      losersMatches,
      winnersRounds,
      startFromWbRound,
      grandFinal !== 'none'
    )
  }

  const grandFinalMatches = createGrandFinal(eventId, grandFinal, idFactory)
  if (grandFinalMatches.length > 0) {
    wireGrandFinal(winnersMatches, losersMatches, grandFinalMatches[0])
  }

  placeParticipants(winnersMatches, participants, bracketSize)

  const allMatches = [...winnersMatches, ...losersMatches, ...grandFinalMatches]
  assertUniqueIds(allMatches)

  resolveByes(allMatches)

  return allMatches
}

/** Sends both bracket winners into the grand final. */
const wireGrandFinal = (
  winnersMatches: BracketMatch[],
  losersMatches: BracketMatch[],
  grandFinalMatch: BracketMatch
): void => {
  const lastOf = (matches: BracketMatch[]): BracketMatch | undefined =>
    matches.reduce<BracketMatch | undefined>(
      (latest, match) =>
        !latest || match.round > latest.round ? match : latest,
      undefined
    )

  const winnersFinal = lastOf(winnersMatches)
  if (winnersFinal) {
    winnersFinal.winnerTo = grandFinalMatch.id
    winnersFinal.winnerToSlot = 1
  }

  const losersFinal = lastOf(losersMatches)
  if (losersFinal) {
    losersFinal.winnerTo = grandFinalMatch.id
    losersFinal.winnerToSlot = 2
  }
}

const placeParticipants = (
  matches: BracketMatch[],
  participants: Participant[],
  bracketSize: number
): void => {
  const round1 = matches.filter((match) => match.round === 1)
  const seedMap = new Map(
    participants.map((participant) => [
      participant.seed,
      participant.registrationId,
    ])
  )

  generateSeedPairs(bracketSize).forEach(([seed1, seed2], index) => {
    const match = round1[index]
    if (!match) return
    match.registration1Id = seedMap.get(seed1) ?? null
    match.registration2Id = seedMap.get(seed2) ?? null
  })
}

/** A repeating idFactory would silently cross-wire the bracket. */
const assertUniqueIds = (matches: BracketMatch[]): void => {
  const ids = new Set<string>()
  for (const match of matches) {
    if (typeof match.id !== 'string' || match.id.length === 0) {
      throw new Error('idFactory must return non-empty string ids')
    }
    if (ids.has(match.id)) {
      throw new Error(`idFactory returned a duplicate id: "${match.id}"`)
    }
    ids.add(match.id)
  }
}
