import { BracketMatch, GeneratorOptions, Participant } from './types'
import { nextPowerOf2 } from './bracketUtils'
import { createWinnersBracket } from './createWinnersBracket'
import { createLosersBracket } from './createLosersBracket'
import { wireLoserRouting } from './wireLoserRouting'
import { processByes } from './processByes'

export const generateDoubleElimination = (
  options: GeneratorOptions
): BracketMatch[] => {
  const { eventId, participants, idFactory, losersStartRoundsBeforeFinal } =
    options

  if (participants.length < 2) {
    throw new Error('At least 2 participants required')
  }

  const bracketSize = nextPowerOf2(participants.length)
  const winnersRounds = Math.log2(bracketSize)

  // Calculate which WB round starts feeding into LB
  // Default: round 1 (full double elimination)
  const startFromWbRound = losersStartRoundsBeforeFinal
    ? winnersRounds - losersStartRoundsBeforeFinal
    : 1

  // Number of WB rounds that feed losers (excludes finals)
  const feederRounds = losersStartRoundsBeforeFinal
    ? losersStartRoundsBeforeFinal
    : winnersRounds - 1

  // LB rounds = feederRounds * 2 - 1
  const losersRounds = feederRounds * 2 - 1

  // Sort participants by seed
  const sorted = [...participants].sort((a, b) => a.seed - b.seed)

  // Create bracket structures
  const winnersMatches = createWinnersBracket(
    eventId,
    bracketSize,
    winnersRounds,
    idFactory
  )
  const losersMatches = createLosersBracket(
    eventId,
    bracketSize,
    losersRounds,
    startFromWbRound,
    idFactory
  )

  // Wire loser routing from winners to losers bracket
  wireLoserRouting(
    winnersMatches,
    losersMatches,
    winnersRounds,
    startFromWbRound
  )

  // Place participants in first round (seeded positions)
  placeParticipants(winnersMatches, sorted, bracketSize)

  const allMatches = [...winnersMatches, ...losersMatches]

  // Process byes (auto-advance where opponent is missing)
  processByes(allMatches)

  return allMatches
}

const placeParticipants = (
  matches: BracketMatch[],
  participants: Participant[],
  bracketSize: number
): void => {
  const round1 = matches.filter((m) => m.round === 1)
  const seedMap = new Map(participants.map((p) => [p.seed, p.registrationId]))

  // Standard seeding: 1vN, 4v(N-3), 2v(N-1), 3v(N-2) pattern
  const pairs = generateSeedPairs(bracketSize)

  pairs.forEach(([seed1, seed2], idx) => {
    const match = round1[idx]
    if (match) {
      match.registration1Id = seedMap.get(seed1) ?? null
      match.registration2Id = seedMap.get(seed2) ?? null
    }
  })
}

const generateSeedPairs = (size: number): [number, number][] => {
  const pairs: [number, number][] = []
  const buildPairs = (positions: number[]): void => {
    if (positions.length === 2) {
      pairs.push([positions[0], positions[1]])
      return
    }
    const half = positions.length / 2
    const upper = positions.slice(0, half)
    const lower = positions.slice(half)
    for (let i = 0; i < half / 2; i++) {
      buildPairs([upper[i], lower[half - 1 - i]])
      buildPairs([upper[half - 1 - i], lower[i]])
    }
  }
  const seeds = Array.from({ length: size }, (_, i) => i + 1)
  buildPairs(seeds)
  return pairs
}
