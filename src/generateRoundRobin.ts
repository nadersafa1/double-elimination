import { RoundRobinOptions, TournamentMatch } from './types.js'
import {
  assertUniqueIds,
  createMatch,
  rankParticipants,
  readInteger,
} from './participants.js'
import {
  buildRoundRobinFixtures,
  snakeIntoGroups,
} from './roundRobinSchedule.js'

/**
 * Generates a round robin tournament: everyone plays everyone.
 *
 * Both participants are known up front, so unlike a bracket there is no
 * routing — `winnerTo` and `loserTo` are always `null`, and results are ranked
 * with {@link calculateStandings} instead.
 *
 * Matches are returned grouped by `group`, then `leg`, then `round`.
 */
export const generateRoundRobin = (
  options: RoundRobinOptions
): TournamentMatch[] => {
  const { eventId, idFactory } = options

  const ranked = rankParticipants(options)
  const legs = readInteger(options.legs, 1, 1, 'legs')
  const groupCount = readInteger(options.groupCount, 1, 1, 'groupCount')

  if (groupCount > Math.floor(ranked.length / 2)) {
    throw new Error(
      `groupCount ${groupCount} leaves a group with fewer than 2 participants (${ranked.length} participants allow at most ${Math.floor(ranked.length / 2)} groups)`
    )
  }

  const matches: TournamentMatch[] = []
  const groups = snakeIntoGroups(ranked, groupCount)

  groups.forEach((entrants, groupIndex) => {
    const fixtures = buildRoundRobinFixtures(entrants.length)
    const roundsPerLeg = fixtures.reduce(
      (highest, fixture) => Math.max(highest, fixture.round + 1),
      0
    )

    for (let leg = 1; leg <= legs; leg++) {
      // Later legs replay the same fixtures with the sides swapped, so a
      // two-leg round robin gives everyone an equal split of each side.
      const swapSides = leg % 2 === 0
      const positionsInRound = new Map<number, number>()

      for (const fixture of fixtures) {
        const round = (leg - 1) * roundsPerLeg + fixture.round + 1
        const position = positionsInRound.get(round) ?? 0
        positionsInRound.set(round, position + 1)

        const [first, second] = fixture.pair
        const home = swapSides ? second : first
        const away = swapSides ? first : second

        matches.push(
          createMatch(
            {
              eventId,
              round,
              bracketPosition: position,
              bracketType: 'roundRobin',
              registration1Id: entrants[home].registrationId,
              registration2Id: entrants[away].registrationId,
              group: groupCount > 1 ? groupIndex : null,
              leg,
            },
            idFactory
          )
        )
      }
    }
  })

  assertUniqueIds(matches)

  return matches
}
