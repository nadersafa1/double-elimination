import { BracketMatch, IdFactory } from './types'

export const createLosersBracket = (
  eventId: string,
  bracketSize: number,
  rounds: number,
  startFromWbRound: number,
  idFactory: IdFactory
): BracketMatch[] => {
  const matches: BracketMatch[] = []
  const matchIdMap = new Map<string, string>()

  // Calculate matches per round
  // Odd rounds (crossover): receive fresh losers, fewer matches
  // Even rounds (consolidation): no new entries
  for (let round = 1; round <= rounds; round++) {
    const matchCount = getLosersMatchCount(bracketSize, round, startFromWbRound)

    for (let pos = 0; pos < matchCount; pos++) {
      const matchId = idFactory()
      matchIdMap.set(`${round}-${pos}`, matchId)

      matches.push({
        id: matchId,
        eventId,
        round,
        matchNumber: pos + 1,
        registration1Id: null,
        registration2Id: null,
        bracketPosition: pos,
        winnerTo: null,
        winnerToSlot: null,
        loserTo: null,
        loserToSlot: null,
        bracketType: 'losers',
      })
    }
  }

  // Wire winner routing within losers bracket
  wireLosersBracketWinners(matches, matchIdMap, rounds)

  return matches
}

const getLosersMatchCount = (
  bracketSize: number,
  round: number,
  startFromWbRound: number
): number => {
  // For delayed losers bracket, calculate effective bracket size
  // based on which WB round starts feeding losers
  const effectiveBracketSize = bracketSize / Math.pow(2, startFromWbRound - 1)

  // Pattern: pairs of rounds with same match count, then halves
  // R1,R2: effectiveBracketSize/4, R3,R4: effectiveBracketSize/8...
  // Formula: effectiveBracketSize / 2^(ceil(round/2) + 1)
  return effectiveBracketSize / Math.pow(2, Math.ceil(round / 2) + 1)
}

const wireLosersBracketWinners = (
  matches: BracketMatch[],
  idMap: Map<string, string>,
  totalRounds: number
): void => {
  for (const match of matches) {
    if (match.round >= totalRounds) continue

    const isOddRound = match.round % 2 === 1
    let nextPos: number
    let nextSlot: number

    if (isOddRound) {
      // From Crossover Round (odd) → Consolidation Round (even)
      // Next round has same match count, so same position, slot 1
      nextPos = match.bracketPosition
      nextSlot = 1
    } else {
      // From Consolidation Round (even) → Crossover Round (odd)
      // Next round has half the matches, so halve position, alternating slots
      nextPos = Math.floor(match.bracketPosition / 2)
      nextSlot = (match.bracketPosition % 2) + 1
    }

    const nextMatchId = idMap.get(`${match.round + 1}-${nextPos}`)
    if (nextMatchId) {
      match.winnerTo = nextMatchId
      match.winnerToSlot = nextSlot
    }
  }
}
