import { IdFactory, TournamentMatch } from './types.js'
import { createMatch } from './participants.js'

/** Builds the winners bracket skeleton and wires winner advancement. */
export const createWinnersBracket = (
  eventId: string,
  bracketSize: number,
  rounds: number,
  idFactory: IdFactory
): TournamentMatch[] => {
  const matches: TournamentMatch[] = []
  const matchIdMap = new Map<string, string>()

  for (let round = 1; round <= rounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round)

    for (let pos = 0; pos < matchCount; pos++) {
      const match = createMatch(
        { eventId, round, bracketPosition: pos, bracketType: 'winners' },
        idFactory
      )
      matchIdMap.set(`${round}-${pos}`, match.id)
      matches.push(match)
    }
  }

  for (const match of matches) {
    if (match.round >= rounds) continue

    // Two adjacent matches feed the one above them, top match into slot 1.
    const nextMatchId = matchIdMap.get(
      `${match.round + 1}-${Math.floor(match.bracketPosition / 2)}`
    )
    if (nextMatchId) {
      match.winnerTo = nextMatchId
      match.winnerToSlot = (match.bracketPosition % 2) + 1
    }
  }

  return matches
}
