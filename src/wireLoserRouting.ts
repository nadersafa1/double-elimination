import { BracketMatch } from './types.js'

/**
 * Reorders a round of winners bracket losers before they are dropped into the
 * losers bracket.
 *
 * `position` is the winners bracket match index, `count` the number of matches
 * in that round; the result is the losers bracket match index.
 */
type PositionOrdering = (position: number, count: number) => number

const natural: PositionOrdering = (position) => position
const reverse: PositionOrdering = (position, count) => count - 1 - position
const halfShift: PositionOrdering = (position, count) =>
  (position + (count >> 1)) % count
const reverseHalfShift: PositionOrdering = (position, count) =>
  (count - 1 - position + (count >> 1)) % count

/**
 * Applied to the 2nd, 3rd, 4th, 5th... round of losers entering the bracket
 * (the 1st round simply pairs up, so it needs no reordering).
 *
 * Rotating the ordering keeps a dropped player away from the section of the
 * bracket they came from for as long as possible. Repeating a single ordering
 * (or using `natural` throughout) lines players back up against opponents they
 * already beat: with 64 players, rotating pushes the first possible rematch
 * from losers round 4 to losers round 7 and cuts the expected number of
 * rematches per tournament from ~2.8 to ~0.4.
 */
const CROSSOVER_ORDERINGS: PositionOrdering[] = [
  reverse,
  reverseHalfShift,
  halfShift,
  natural,
]

/** Points every winners bracket match at the losers bracket match it feeds. */
export const wireLoserRouting = (
  winnersMatches: BracketMatch[],
  losersMatches: BracketMatch[],
  winnersRounds: number,
  startFromWbRound: number,
  winnersFinalFeedsLosers: boolean
): void => {
  const losersIdMap = new Map<string, string>()
  for (const match of losersMatches) {
    losersIdMap.set(`${match.round}-${match.bracketPosition}`, match.id)
  }

  for (const match of winnersMatches) {
    const routing = getLoserDestination(
      match.round,
      match.bracketPosition,
      winnersRounds,
      startFromWbRound,
      winnersFinalFeedsLosers
    )
    if (!routing) continue

    const targetId = losersIdMap.get(`${routing.lbRound}-${routing.lbPosition}`)
    if (targetId) {
      match.loserTo = targetId
      match.loserToSlot = routing.slot
    }
  }
}

interface LoserDestination {
  lbRound: number
  lbPosition: number
  slot: number
}

const getLoserDestination = (
  wbRound: number,
  wbPosition: number,
  totalWbRounds: number,
  startFromWbRound: number,
  winnersFinalFeedsLosers: boolean
): LoserDestination | null => {
  // Rounds before the losers bracket opens are single elimination.
  if (wbRound < startFromWbRound) return null

  // Without a grand final the winners final loser is 2nd place and stops here.
  if (wbRound === totalWbRounds && !winnersFinalFeedsLosers) return null

  // Round index counted from the first round that feeds the losers bracket.
  const relativeRound = wbRound - startFromWbRound + 1

  if (relativeRound === 1) {
    // The first wave of losers pairs off against itself.
    return {
      lbRound: 1,
      lbPosition: Math.floor(wbPosition / 2),
      slot: (wbPosition % 2) + 1,
    }
  }

  // Later waves drop into a crossover round that already holds one player, so
  // they always take slot 2. Round r of losers enters losers round 2r - 2.
  const matchesInWbRound = Math.pow(2, totalWbRounds - wbRound)
  const ordering =
    CROSSOVER_ORDERINGS[(relativeRound - 2) % CROSSOVER_ORDERINGS.length]

  return {
    lbRound: relativeRound * 2 - 2,
    lbPosition: ordering(wbPosition, matchesInWbRound),
    slot: 2,
  }
}
