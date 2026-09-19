import {
  Participant,
  QualifierComparator,
  QualifierOrder,
  QualifiersOptions,
  Standing,
} from './types.js'
import { readInteger } from './participants.js'

/** Sort keys, compared highest first, mirroring `calculateStandings`. */
const ORDER_KEYS: Record<QualifierOrder, (row: Standing) => number[]> = {
  // Finishing position first: every winner above every runner-up.
  rankThenPoints: (row) => [
    -row.rank,
    row.points,
    row.scoreDifference,
    row.scoreFor,
    row.won,
  ],
  // Record first: a strong third-placed row can outseed a weak group winner.
  pointsThenRank: (row) => [
    row.points,
    row.scoreDifference,
    row.scoreFor,
    row.won,
    -row.rank,
  ],
}

const ORDERS = Object.keys(ORDER_KEYS) as QualifierOrder[]

/**
 * Selects the participants who advance from a group stage and seeds them.
 *
 * The step between two stages of a championship: hand it a table from
 * {@link calculateStandings} and it returns `Participant[]`, ready to pass
 * straight to any generator as the next stage's field.
 *
 * ```typescript
 * const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })
 *
 * const playoffs = generateDoubleElimination({
 *   eventId: 'champions-2026-playoffs',
 *   participants: qualifiers,
 *   idFactory,
 *   grandFinal: 'single',
 * })
 * ```
 *
 * Who qualifies is never guessed. Because participants nothing separates share
 * a rank, a tie across the cut line would make the cut arbitrary — one row
 * advancing over another by array order — so it throws instead. End the
 * `tiebreakers` you pass to {@link calculateStandings} with `'seed'` to
 * guarantee a strict table, or resolve the tie yourself and rank again.
 *
 * Seeding is a softer question: everyone selected is through either way, so
 * qualifiers the `order` cannot separate keep the order they had in
 * `standings`.
 */
export const qualifiersFromStandings = (
  options: QualifiersOptions
): Participant[] => {
  const { standings } = options

  if (!Array.isArray(standings)) throw new Error('standings must be an array')
  if (options.perGroup === undefined && options.bestRemaining === undefined) {
    throw new Error(
      'qualifiersFromStandings needs perGroup, bestRemaining, or both'
    )
  }

  const perGroup = readInteger(options.perGroup, 0, 0, 'perGroup')
  const bestRemaining = readInteger(
    options.bestRemaining,
    0,
    0,
    'bestRemaining'
  )

  if (perGroup + bestRemaining === 0) {
    throw new Error(
      'perGroup and bestRemaining are both 0, so nobody would qualify'
    )
  }

  const compare = readOrder(options.order)
  const groups = collectGroups(standings)

  const qualified: Standing[] = []
  const leftBehind: Standing[] = []

  for (const [group, rows] of groups) {
    const cut = rows.filter((row) => row.rank <= perGroup)

    if (cut.length < perGroup) {
      throw new Error(
        `perGroup ${perGroup} exceeds ${describeGroup(group)}, which holds ${rows.length} participant(s)`
      )
    }
    if (cut.length > perGroup) {
      // A tie straddles the cut: the rows sharing the last qualifying rank
      // cannot all advance, and nothing in the table says which should.
      const lastRank = Math.max(...cut.map((row) => row.rank))
      const tied = cut.filter((row) => row.rank === lastRank)
      throw new Error(
        `${describeGroup(group)} has ${tied.length} participants tied on rank ${lastRank} for ${perGroup - (cut.length - tied.length)} remaining place(s): ${names(tied)}. Add 'seed' to the tiebreakers passed to calculateStandings, or resolve the tie before selecting`
      )
    }

    qualified.push(...cut)
    for (const row of rows) if (row.rank > perGroup) leftBehind.push(row)
  }

  if (bestRemaining > 0) {
    if (leftBehind.length < bestRemaining) {
      throw new Error(
        `bestRemaining ${bestRemaining} exceeds the ${leftBehind.length} participant(s) left after taking ${perGroup} from each group`
      )
    }

    const ordered = [...leftBehind].sort(compare)
    const last = ordered[bestRemaining - 1]
    const next = ordered[bestRemaining]

    if (next && compare(last, next) === 0) {
      // The rows level with the boundary run either side of it; taking some
      // and not the others would come down to sort order alone.
      let first = bestRemaining - 1
      while (first > 0 && compare(ordered[first - 1], last) === 0) first--
      let after = bestRemaining + 1
      while (after < ordered.length && compare(ordered[after], last) === 0)
        after++

      const tied = ordered.slice(first, after)
      throw new Error(
        `${tied.length} participants are level on the last of ${bestRemaining} best-remaining place(s): ${names(tied)}. Separate them with a custom order, or take all of them with bestRemaining ${after} — or none, with ${first}`
      )
    }

    qualified.push(...ordered.slice(0, bestRemaining))
  }

  // Array.prototype.sort is stable, so rows the order cannot separate keep the
  // position they arrived in: group order, then rank, then best-remaining.
  return qualified.sort(compare).map((row, index) => ({
    registrationId: row.registrationId,
    seed: index + 1,
  }))
}

const readOrder = (order: QualifiersOptions['order']): QualifierComparator => {
  if (order === undefined) return comparatorFor('rankThenPoints')
  if (typeof order === 'function') return order
  if (!ORDERS.includes(order)) {
    throw new Error(
      `Unknown order: "${order}". Expected ${ORDERS.join(' or ')}, or a comparator`
    )
  }
  return comparatorFor(order)
}

const comparatorFor = (order: QualifierOrder): QualifierComparator => {
  const key = ORDER_KEYS[order]
  return (a, b) => {
    const left = key(a)
    const right = key(b)
    for (let i = 0; i < left.length; i++) {
      const difference = right[i] - left[i]
      if (difference !== 0) return difference
    }
    return 0
  }
}

/** Buckets rows by group, validating them, and keeps the groups in order. */
const collectGroups = (
  standings: Standing[]
): [number | null, Standing[]][] => {
  const byGroup = new Map<number | null, Standing[]>()
  const seen = new Set<string>()

  for (const row of standings) {
    if (
      !row ||
      typeof row.registrationId !== 'string' ||
      row.registrationId.length === 0
    ) {
      throw new Error('Every standings row needs a non-empty registrationId')
    }
    if (!Number.isInteger(row.rank) || row.rank < 1) {
      throw new Error(
        `Standings row "${row.registrationId}" has a rank that is not a positive integer`
      )
    }
    if (seen.has(row.registrationId)) {
      throw new Error(
        `Duplicate registrationId in standings: "${row.registrationId}". Select from one stage's table at a time`
      )
    }
    seen.add(row.registrationId)

    const group = row.group ?? null
    const rows = byGroup.get(group)
    if (rows) rows.push(row)
    else byGroup.set(group, [row])
  }

  if (byGroup.size === 0) throw new Error('standings is empty')

  return [...byGroup.entries()].sort((a, b) => (a[0] ?? -1) - (b[0] ?? -1))
}

const describeGroup = (group: number | null): string =>
  group === null ? 'the standings' : `Group ${group}`

const names = (rows: Standing[]): string =>
  rows.map((row) => `"${row.registrationId}"`).join(', ')
