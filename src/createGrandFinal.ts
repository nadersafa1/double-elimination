import { GrandFinalFormat, IdFactory, TournamentMatch } from './types.js'
import { createMatch } from './participants.js'

/**
 * Creates the grand final (and, for `'reset'`, the bracket reset match).
 *
 * The reset is wired so that generic winner/loser propagation keeps working:
 * both players of grand final 1 carry over into grand final 2. It is only
 * *played* when the losers bracket representative wins grand final 1 — if the
 * winners bracket representative wins it, they are champion and match 2 is
 * dropped.
 */
export const createGrandFinal = (
  eventId: string,
  format: GrandFinalFormat,
  idFactory: IdFactory
): TournamentMatch[] => {
  if (format === 'none') return []

  const rounds = format === 'reset' ? 2 : 1
  const matches: TournamentMatch[] = []

  for (let round = 1; round <= rounds; round++) {
    matches.push(
      createMatch(
        { eventId, round, bracketPosition: 0, bracketType: 'grandFinal' },
        idFactory
      )
    )
  }

  if (matches.length === 2) {
    matches[0].winnerTo = matches[1].id
    matches[0].winnerToSlot = 1
    matches[0].loserTo = matches[1].id
    matches[0].loserToSlot = 2
  }

  return matches
}
