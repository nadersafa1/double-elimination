import { TournamentMatch, TournamentOptions } from './types.js'
import { generateSingleElimination } from './generateSingleElimination.js'
import { generateDoubleElimination } from './generateDoubleElimination.js'
import { generateRoundRobin } from './generateRoundRobin.js'

/**
 * Generates a tournament in whichever format `options.format` names.
 *
 * Useful when the format is data — a column in your database, a value from a
 * form — rather than something known when the code is written. Each format
 * accepts its own options, and all of them return the same match shape.
 *
 * ```typescript
 * const matches = generateTournament({
 *   format: 'round-robin',
 *   eventId: 'league-2026',
 *   participants,
 *   idFactory: () => crypto.randomUUID(),
 *   legs: 2,
 * })
 * ```
 */
export const generateTournament = (
  options: TournamentOptions
): TournamentMatch[] => {
  switch (options.format) {
    case 'single-elimination':
      return generateSingleElimination(options)
    case 'double-elimination':
      return generateDoubleElimination(options)
    case 'round-robin':
      return generateRoundRobin(options)
    default: {
      const { format } = options as { format: string }
      throw new Error(
        `Unknown format: "${format}". Expected 'single-elimination', 'double-elimination' or 'round-robin'`
      )
    }
  }
}
