import { BracketMatch, GeneratorOptions, Participant } from './types'
import { nextPowerOf2 } from './bracketUtils'
import { createWinnersBracket } from './createWinnersBracket'
import { createLosersBracket } from './createLosersBracket'
import { wireLoserRouting } from './wireLoserRouting'
import { processByes } from './processByes'

export const generateDoubleElimination = (
  options: GeneratorOptions
): BracketMatch[] => {
  const {
    eventId,
    participants,
    idFactory,
    losersStartRoundsBeforeFinal,
  } = options

  if (participants.length < 2) {
    throw new Error('At least 2 participants required')
  }

  const bracketSize = nextPowerOf2(participants.length)
  const winnersRounds = Math.log2(bracketSize)

  // Validate losersStartRoundsBeforeFinal
  if (losersStartRoundsBeforeFinal !== undefined) {
    if (losersStartRoundsBeforeFinal < 0) {
      throw new Error(
        'losersStartRoundsBeforeFinal must be at least 0 (0 = pure single elimination)'
      )
    }
    // Special case: losersStartRoundsBeforeFinal=1 requires at least 4 participants (semifinals)
    // Check this before the >= winnersRounds check
    if (losersStartRoundsBeforeFinal === 1 && winnersRounds < 2) {
      throw new Error(
        'losersStartRoundsBeforeFinal=1 requires at least 4 participants (semifinals needed)'
      )
    }
    if (losersStartRoundsBeforeFinal >= winnersRounds) {
      throw new Error(
        `losersStartRoundsBeforeFinal must be less than winnersRounds (${winnersRounds})`
      )
    }
  }

  // Calculate which WB round starts feeding into LB
  // Default: round 1 (full double elimination)
  const startFromWbRound = losersStartRoundsBeforeFinal !== undefined
    ? winnersRounds - losersStartRoundsBeforeFinal
    : 1

  // Number of WB rounds that feed losers (excludes finals)
  const feederRounds = losersStartRoundsBeforeFinal !== undefined
    ? losersStartRoundsBeforeFinal
    : winnersRounds - 1

  // Calculate losers bracket rounds
  // For losersStartRoundsBeforeFinal=0: no losers bracket
  // For losersStartRoundsBeforeFinal=1: only 1 match (3rd place)
  // For losersStartRoundsBeforeFinal>=2: standard double elimination
  let losersRounds = 0
  if (losersStartRoundsBeforeFinal === 0) {
    losersRounds = 0 // Pure single elimination
  } else if (losersStartRoundsBeforeFinal === 1) {
    losersRounds = 1 // Single match for 3rd place
  } else {
    // Standard: LB rounds = feederRounds * 2 - 1
    losersRounds = feederRounds * 2 - 1
  }

  // Sort participants by seed
  const sorted = [...participants].sort((a, b) => a.seed - b.seed)

  // Create bracket structures
  const winnersMatches = createWinnersBracket(
    eventId,
    bracketSize,
    winnersRounds,
    idFactory
  )

  let losersMatches: BracketMatch[] = []
  if (losersRounds > 0) {
    losersMatches = createLosersBracket(
      eventId,
      bracketSize,
      losersRounds,
      startFromWbRound,
      idFactory,
      winnersRounds
    )

    // Wire loser routing from winners to losers bracket
    wireLoserRouting(
      winnersMatches,
      losersMatches,
      winnersRounds,
      startFromWbRound
    )
  }

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

/**
 * Generate seed pairs using standard tournament seeding algorithm.
 * This ensures seeds 1 and 2 can only meet in the finals,
 * seeds 1-4 can only meet in semifinals at earliest, etc.
 */
const generateSeedPairs = (size: number): [number, number][] => {
  // Build positions array iteratively, doubling each time
  // [1, 2] -> [1, 4, 2, 3] -> [1, 8, 4, 5, 2, 7, 3, 6] -> ...
  let positions = [1, 2]

  while (positions.length < size) {
    const newPositions: number[] = []
    const sum = positions.length * 2 + 1

    for (const pos of positions) {
      newPositions.push(pos)
      newPositions.push(sum - pos)
    }

    positions = newPositions
  }

  // Convert positions array to match pairs
  // Adjacent positions form a match
  const pairs: [number, number][] = []
  for (let i = 0; i < positions.length; i += 2) {
    pairs.push([positions[i], positions[i + 1]])
  }
  return pairs
}
