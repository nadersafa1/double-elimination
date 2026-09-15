import {
  MatchResult,
  PointsConfig,
  Standing,
  StandingsOptions,
  Tiebreaker,
  TournamentMatch,
} from './types.js'

const DEFAULT_POINTS: PointsConfig = { win: 3, draw: 1, loss: 0 }

const TIEBREAKERS: Tiebreaker[] = [
  'headToHead',
  'scoreDifference',
  'scoreFor',
  'wins',
  'seed',
]

const DEFAULT_TIEBREAKERS: Tiebreaker[] = [
  'headToHead',
  'scoreDifference',
  'scoreFor',
  'wins',
]

/**
 * Builds a standings table from recorded results.
 *
 * Pass the matches you want ranked — typically one round robin, group stage
 * included — along with whatever results exist so far; matches without a
 * result simply count as unplayed. Rows are returned ordered by group, then by
 * rank. Participants the tiebreakers cannot separate share a rank, and are
 * listed strongest seed first.
 */
export const calculateStandings = (options: StandingsOptions): Standing[] => {
  const {
    matches,
    results,
    participants = [],
    points: pointsOverride,
    tiebreakers = DEFAULT_TIEBREAKERS,
  } = options

  if (!Array.isArray(matches)) throw new Error('matches must be an array')
  if (!Array.isArray(results)) throw new Error('results must be an array')

  const points: PointsConfig = { ...DEFAULT_POINTS, ...pointsOverride }
  for (const tiebreaker of tiebreakers) {
    if (!TIEBREAKERS.includes(tiebreaker)) {
      throw new Error(
        `Unknown tiebreaker: "${tiebreaker}". Expected one of ${TIEBREAKERS.join(', ')}`
      )
    }
  }

  const seedOf = new Map(
    participants.map((participant) => [
      participant.registrationId,
      participant.seed,
    ])
  )
  const matchById = new Map(matches.map((match) => [match.id, match]))
  const outcomes = readResults(results, matchById)

  // Head-to-head only ever looks at the games a tied participant played, so
  // index those once instead of rescanning every fixture for every row.
  const playedBy = new Map<string, PlayedMatch[]>()
  const recordPlayed = (game: PlayedMatch) => {
    const existing = playedBy.get(game.registrationId)
    if (existing) existing.push(game)
    else playedBy.set(game.registrationId, [game])
  }

  // One row per participant per group, created from the fixtures so that
  // everyone appears even before a ball is kicked.
  const rows = new Map<string, Standing>()
  const keyOf = (registrationId: string, group: number | null) =>
    `${group ?? 'all'}::${registrationId}`

  const rowFor = (registrationId: string, group: number | null): Standing => {
    const key = keyOf(registrationId, group)
    const existing = rows.get(key)
    if (existing) return existing

    const created: Standing = {
      registrationId,
      group,
      rank: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreDifference: 0,
      points: 0,
    }
    rows.set(key, created)
    return created
  }

  for (const match of matches) {
    const { registration1Id, registration2Id } = match
    if (!registration1Id || !registration2Id) continue

    const first = rowFor(registration1Id, match.group)
    const second = rowFor(registration2Id, match.group)

    const outcome = outcomes.get(match.id)
    if (!outcome) continue

    applyOutcome(first, outcome.score1, outcome.score2, points)
    applyOutcome(second, outcome.score2, outcome.score1, points)

    recordPlayed({
      registrationId: registration1Id,
      opponentId: registration2Id,
      group: match.group,
      scoreFor: outcome.score1,
      scoreAgainst: outcome.score2,
    })
    recordPlayed({
      registrationId: registration2Id,
      opponentId: registration1Id,
      group: match.group,
      scoreFor: outcome.score2,
      scoreAgainst: outcome.score1,
    })
  }

  const byGroup = new Map<number | null, Standing[]>()
  for (const row of rows.values()) {
    const group = byGroup.get(row.group)
    if (group) group.push(row)
    else byGroup.set(row.group, [row])
  }

  const ranked: Standing[] = []
  const groupKeys = [...byGroup.keys()].sort((a, b) => (a ?? -1) - (b ?? -1))

  for (const group of groupKeys) {
    const groupRows = byGroup.get(group)!
    const blocks = separate(groupRows, ['points', ...tiebreakers], {
      playedBy,
      points,
      seedOf,
    })

    let position = 1
    for (const block of blocks) {
      const ordered = [...block].sort(
        (a, b) =>
          (seedOf.get(a.registrationId) ?? Number.MAX_SAFE_INTEGER) -
          (seedOf.get(b.registrationId) ?? Number.MAX_SAFE_INTEGER)
      )
      for (const row of ordered) {
        row.rank = position
        ranked.push(row)
      }
      position += block.length
    }
  }

  return ranked
}

interface Outcome {
  score1: number
  score2: number
}

/** Turns reported results into comparable scores, rejecting unusable input. */
const readResults = (
  results: MatchResult[],
  matchById: Map<string, TournamentMatch>
): Map<string, Outcome> => {
  const outcomes = new Map<string, Outcome>()

  for (const result of results) {
    const match = matchById.get(result.matchId)
    if (!match) {
      throw new Error(`Result references unknown match: "${result.matchId}"`)
    }
    if (outcomes.has(result.matchId)) {
      throw new Error(`Duplicate result for match: "${result.matchId}"`)
    }
    if (!match.registration1Id || !match.registration2Id) {
      throw new Error(
        `Match "${result.matchId}" has no participants recorded, so it cannot have a result`
      )
    }

    const hasScores =
      typeof result.score1 === 'number' || typeof result.score2 === 'number'

    if (hasScores) {
      if (!Number.isFinite(result.score1) || !Number.isFinite(result.score2)) {
        throw new Error(
          `Match "${result.matchId}" needs both score1 and score2, or neither`
        )
      }
      outcomes.set(result.matchId, {
        score1: result.score1 as number,
        score2: result.score2 as number,
      })
      continue
    }

    if (!('winnerId' in result)) {
      throw new Error(
        `Result for match "${result.matchId}" needs score1 and score2, or a winnerId`
      )
    }

    // No scores recorded: stand in a 1-0 win or a 0-0 draw so that wins and
    // losses still count. Score columns stay meaningless either way.
    if (result.winnerId === null) {
      outcomes.set(result.matchId, { score1: 0, score2: 0 })
    } else if (result.winnerId === match.registration1Id) {
      outcomes.set(result.matchId, { score1: 1, score2: 0 })
    } else if (result.winnerId === match.registration2Id) {
      outcomes.set(result.matchId, { score1: 0, score2: 1 })
    } else {
      throw new Error(
        `winnerId "${result.winnerId}" did not play in match "${result.matchId}"`
      )
    }
  }

  return outcomes
}

const applyOutcome = (
  row: Standing,
  scoreFor: number,
  scoreAgainst: number,
  points: PointsConfig
): void => {
  row.played += 1
  row.scoreFor += scoreFor
  row.scoreAgainst += scoreAgainst
  row.scoreDifference = row.scoreFor - row.scoreAgainst

  if (scoreFor > scoreAgainst) {
    row.won += 1
    row.points += points.win
  } else if (scoreFor === scoreAgainst) {
    row.drawn += 1
    row.points += points.draw
  } else {
    row.lost += 1
    row.points += points.loss
  }
}

/** One side's view of a game that has a result. */
interface PlayedMatch {
  registrationId: string
  opponentId: string
  group: number | null
  scoreFor: number
  scoreAgainst: number
}

interface RankingContext {
  playedBy: Map<string, PlayedMatch[]>
  points: PointsConfig
  seedOf: Map<string, number>
}

/** Sort keys, compared highest first. */
type SortKey = (
  row: Standing,
  block: Standing[],
  context: RankingContext
) => number[]

const TIEBREAKER_KEYS: Record<Tiebreaker | 'points', SortKey> = {
  points: (row) => [row.points],
  scoreDifference: (row) => [row.scoreDifference],
  scoreFor: (row) => [row.scoreFor],
  wins: (row) => [row.won],
  seed: (row, _block, context) => [
    -(context.seedOf.get(row.registrationId) ?? Number.MAX_SAFE_INTEGER),
  ],
  // A mini-league over the matches the tied participants played each other.
  headToHead: (row, block, context) => {
    if (block.length < 2) return [0, 0, 0]
    const tied = new Set(block.map((entry) => entry.registrationId))

    let points = 0
    let scoreFor = 0
    let scoreAgainst = 0

    for (const game of context.playedBy.get(row.registrationId) ?? []) {
      if (game.group !== row.group) continue
      if (!tied.has(game.opponentId)) continue

      scoreFor += game.scoreFor
      scoreAgainst += game.scoreAgainst
      if (game.scoreFor > game.scoreAgainst) points += context.points.win
      else if (game.scoreFor === game.scoreAgainst)
        points += context.points.draw
      else points += context.points.loss
    }

    return [points, scoreFor - scoreAgainst, scoreFor]
  },
}

const compareKeys = (a: number[], b: number[]): number => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (b[i] ?? 0) - (a[i] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

/**
 * Orders rows, applying each comparison only to rows the previous ones left
 * level. Returns blocks of rows nothing could separate — each block shares a
 * rank.
 */
const separate = (
  rows: Standing[],
  comparisons: (Tiebreaker | 'points')[],
  context: RankingContext
): Standing[][] => {
  if (rows.length < 2 || comparisons.length === 0) return [rows]

  const [comparison, ...remaining] = comparisons
  const key = TIEBREAKER_KEYS[comparison]

  const keyed = rows.map((row) => ({ row, key: key(row, rows, context) }))
  keyed.sort((a, b) => compareKeys(a.key, b.key))

  const blocks: Standing[][] = []
  let current: typeof keyed = []

  for (const entry of keyed) {
    if (current.length > 0 && compareKeys(current[0].key, entry.key) !== 0) {
      blocks.push(
        ...separate(
          current.map((e) => e.row),
          remaining,
          context
        )
      )
      current = []
    }
    current.push(entry)
  }
  if (current.length > 0) {
    blocks.push(
      ...separate(
        current.map((e) => e.row),
        remaining,
        context
      )
    )
  }

  return blocks
}
