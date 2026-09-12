import { BracketMatch, IdFactory } from './types.js'

/**
 * Builds the losers bracket skeleton and wires winner advancement inside it.
 *
 * Round 1 pairs off the first wave of winners bracket losers. After that the
 * rounds alternate: even rounds take a fresh wave of losers into slot 2 and so
 * hold as many matches as the round before them, while odd rounds are played
 * between losers bracket survivors only and halve the match count.
 */
export const createLosersBracket = (
  eventId: string,
  bracketSize: number,
  rounds: number,
  startFromWbRound: number,
  idFactory: IdFactory
): BracketMatch[] => {
  const matches: BracketMatch[] = []
  const matchIdMap = new Map<string, string>()

  // Losers from winners rounds before startFromWbRound never enter the losers
  // bracket, so it is sized as if the tournament started at that round.
  const effectiveBracketSize = bracketSize / Math.pow(2, startFromWbRound - 1)

  for (let round = 1; round <= rounds; round++) {
    // R1,R2 hold effectiveBracketSize/4 matches, R3,R4 half that, and so on.
    const matchCount =
      effectiveBracketSize / Math.pow(2, Math.ceil(round / 2) + 1)

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

  wireLosersBracketWinners(matches, matchIdMap, rounds)

  return matches
}

const wireLosersBracketWinners = (
  matches: BracketMatch[],
  idMap: Map<string, string>,
  totalRounds: number
): void => {
  for (const match of matches) {
    if (match.round >= totalRounds) continue

    // The next round is even — it takes a fresh wave of winners bracket losers
    // — exactly when this round is odd. Those rounds keep the match count, so
    // the position carries over and slot 2 is left free for the incoming
    // loser. Advancing into an odd round halves the match count instead.
    const nextRoundTakesFreshLosers = match.round % 2 === 1

    const nextPos = nextRoundTakesFreshLosers
      ? match.bracketPosition
      : Math.floor(match.bracketPosition / 2)
    const nextSlot = nextRoundTakesFreshLosers
      ? 1
      : (match.bracketPosition % 2) + 1

    const nextMatchId = idMap.get(`${match.round + 1}-${nextPos}`)
    if (nextMatchId) {
      match.winnerTo = nextMatchId
      match.winnerToSlot = nextSlot
    }
  }
}
