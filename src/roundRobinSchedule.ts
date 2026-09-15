/**
 * Fixture scheduling for round robins, using the circle method.
 *
 * One entrant stays put while the rest rotate around them, which pairs every
 * entrant with every other exactly once in `n - 1` rounds. Entrants are passed
 * in seed order, so the marquee tie — the top two seeds — lands in the final
 * round and the first round is the widest mismatch.
 */

/** A bye is an empty seat at the table: whoever faces it sits the round out. */
const BYE = null

export interface Fixture {
  /** 0-based round index. */
  round: number
  /** Ordered pair of participant indexes (as passed in). */
  pair: [number, number]
}

/**
 * Builds one leg of fixtures for `count` entrants.
 *
 * With an odd `count` a bye seat is added, so every entrant sits out exactly
 * one round and each round holds `floor(count / 2)` matches.
 */
export const buildRoundRobinFixtures = (count: number): Fixture[] => {
  const seats: (number | typeof BYE)[] = Array.from(
    { length: count },
    (_, index) => index
  )
  if (seats.length % 2 === 1) seats.push(BYE)

  const size = seats.length
  const rounds = size - 1
  const half = size / 2

  const anchor = seats[0]
  let rotating = seats.slice(1)

  const fixtures: Fixture[] = []

  for (let round = 0; round < rounds; round++) {
    const seated = [anchor, ...rotating]

    for (let position = 0; position < half; position++) {
      const first = seated[position]
      const second = seated[size - 1 - position]
      if (first === BYE || second === BYE) continue

      // As the circle turns, every rotating entrant passes through every seat
      // and so takes each side of the fixture about equally. The anchor never
      // moves, so only their fixture needs flipping on alternate rounds.
      const swap = position === 0 && round % 2 === 1
      fixtures.push({
        round,
        pair: swap ? [second, first] : [first, second],
      })
    }

    // Rotate everyone but the anchor one seat clockwise.
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }

  return fixtures
}

/**
 * Splits ranked entrants into `groupCount` groups by snake seeding.
 *
 * Seeds run left to right across the groups, then right to left, so the groups
 * stay as even in strength as the seeding allows.
 */
export const snakeIntoGroups = <T>(ranked: T[], groupCount: number): T[][] => {
  const groups: T[][] = Array.from({ length: groupCount }, () => [])

  ranked.forEach((entrant, index) => {
    const row = Math.floor(index / groupCount)
    const column = index % groupCount
    const group = row % 2 === 0 ? column : groupCount - 1 - column
    groups[group].push(entrant)
  })

  return groups
}
