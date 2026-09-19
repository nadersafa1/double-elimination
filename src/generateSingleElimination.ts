import { SingleEliminationOptions, TournamentMatch } from './types.js'
import { generateDoubleElimination } from './generateDoubleElimination.js'

/**
 * Generates a single elimination tournament: one loss and you are out.
 *
 * With `thirdPlaceMatch: true` the two semifinal losers meet once more, and
 * that match is returned with `bracketType: 'losers'`.
 */
export const generateSingleElimination = (
  options: SingleEliminationOptions
): TournamentMatch[] => {
  const { thirdPlaceMatch = false, ...rest } = options

  if (typeof thirdPlaceMatch !== 'boolean') {
    throw new Error('thirdPlaceMatch must be a boolean')
  }

  // A single elimination bracket is a double elimination bracket whose losers
  // bracket never opens; the third place match is the one round of it that
  // only semifinal losers reach.
  return generateDoubleElimination({
    ...rest,
    losersStartRoundsBeforeFinal: thirdPlaceMatch ? 1 : 0,
  })
}
