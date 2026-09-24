/** A competitor entered into the tournament. */
export interface Participant {
  /** Caller-owned identifier written into match slots. Must be unique. */
  registrationId: string
  /**
   * Seeding rank. Lower is stronger.
   *
   * Seeds must be unique but need not be `1..N`: participants are ranked by
   * seed, so `[10, 20, 30]` seeds identically to `[1, 2, 3]`.
   */
  seed: number
}

/**
 * Which part of the tournament a match belongs to.
 *
 * `grandFinal` appears only when the `grandFinal` option is enabled, and
 * `roundRobin` only in round robin tournaments.
 */
export type MatchType = 'winners' | 'losers' | 'grandFinal' | 'roundRobin'

/** @deprecated Renamed to {@link MatchType}. */
export type BracketType = MatchType

/** One match, in any format. Every generator returns this same shape. */
export interface TournamentMatch {
  id: string
  eventId: string
  /** 1-based round index, counted within `bracketType` (and within `group`). */
  round: number
  /** 1-based index of the match within its round (`bracketPosition + 1`). */
  matchNumber: number
  registration1Id: string | null
  registration2Id: string | null
  /** 0-based index of the match within its round, top to bottom. */
  bracketPosition: number
  /** Match the winner advances to, or `null` if nobody advances from here. */
  winnerTo: string | null
  /** Slot (1 or 2) the winner occupies in `winnerTo`. */
  winnerToSlot: number | null
  /** Match the loser drops to, or `null` if losing eliminates the player. */
  loserTo: string | null
  /** Slot (1 or 2) the loser occupies in `loserTo`. */
  loserToSlot: number | null
  bracketType: MatchType
  /** 0-based group index in a round robin group stage; `null` in brackets. */
  group: number | null
  /** 1-based leg. Above 1 only in a multi-leg round robin. */
  leg: number
}

/** @deprecated Renamed to {@link TournamentMatch}. */
export type BracketMatch = TournamentMatch

export type IdFactory = () => string

/** Options every format shares. */
export interface BaseOptions {
  /** Identifier for the tournament, copied onto every match. */
  eventId: string
  participants: Participant[]
  /** Returns a unique id for each match, e.g. `() => crypto.randomUUID()`. */
  idFactory: IdFactory
}

/**
 * How the winners bracket winner and losers bracket winner meet.
 *
 * - `'none'` (default): no grand final. The winners final decides 1st/2nd and
 *   the losers final decides 3rd/4th.
 * - `'single'`: one grand final match. The winners final loser drops to the
 *   losers final, and the losers bracket winner plays the winners bracket
 *   winner once for the title.
 * - `'reset'`: as `'single'`, plus a bracket-reset match. The reset is played
 *   only when the losers bracket representative wins the first grand final,
 *   so that both finalists have been beaten twice. `recordResult` removes it
 *   when the winners bracket representative wins instead.
 */
export type GrandFinalFormat = 'none' | 'single' | 'reset'

export interface DoubleEliminationOptions extends BaseOptions {
  /**
   * Number of rounds before the finals where the losers bracket begins.
   * Players who lose before this point are permanently eliminated.
   *
   * - 0: Pure single elimination (no losers bracket)
   * - 1: Single elimination with 3rd place match (only semifinal losers go to LB)
   * - 2+: Delayed double elimination (losers from specified rounds go to LB)
   * - undefined: Full double elimination (all rounds except finals feed LB)
   *
   * Example: For 16 players (4 rounds), setting this to 2 means:
   * - Round 1: Single elimination (losers out)
   * - Rounds 2-3 (QF, SF): Losers go to losers bracket
   * - Round 4 (Finals): Loser = 2nd place
   */
  losersStartRoundsBeforeFinal?: number
  /**
   * Whether to append a grand final between the winners bracket winner and the
   * losers bracket winner. Defaults to `'none'` for backwards compatibility.
   *
   * Enabling it also adds one losers bracket round, because the winners final
   * loser drops into the losers final instead of being eliminated.
   */
  grandFinal?: GrandFinalFormat
}

/** @deprecated Renamed to {@link DoubleEliminationOptions}. */
export type GeneratorOptions = DoubleEliminationOptions

export interface SingleEliminationOptions extends BaseOptions {
  /**
   * Adds a match between the two semifinal losers. Defaults to `false`.
   *
   * Requires at least 3 participants, so that a semifinal round exists.
   */
  thirdPlaceMatch?: boolean
}

export interface RoundRobinOptions extends BaseOptions {
  /**
   * How many times everyone plays everyone. Defaults to `1`.
   *
   * Later legs repeat the same fixtures with the sides swapped, which is how a
   * home-and-away league season is built.
   */
  legs?: number
  /**
   * Split participants into this many groups, each playing its own round
   * robin. Defaults to `1` (a single pool).
   *
   * Participants are distributed by snake seeding, so group strength stays
   * even: seeds 1..G go to groups 1..G, seeds G+1..2G come back the other way.
   */
  groupCount?: number
}

export type TournamentFormat =
  | 'single-elimination'
  | 'double-elimination'
  | 'round-robin'

/** Options for {@link generateTournament}, discriminated by `format`. */
export type TournamentOptions =
  | ({ format: 'single-elimination' } & SingleEliminationOptions)
  | ({ format: 'double-elimination' } & DoubleEliminationOptions)
  | ({ format: 'round-robin' } & RoundRobinOptions)

/**
 * The outcome of one match, as reported by your application.
 *
 * Supply `score1`/`score2` when you track scores, or `winnerId` when you only
 * track who won (`winnerId: null` records a draw).
 */
export interface MatchResult {
  matchId: string
  score1?: number
  score2?: number
  winnerId?: string | null
}

/** Points awarded per outcome. Defaults to 3 / 1 / 0. */
export interface PointsConfig {
  win: number
  draw: number
  loss: number
}

/**
 * Comparisons applied, in order, to participants level on points.
 *
 * - `headToHead`: points, then score difference, in the matches the tied
 *   participants played against each other
 * - `scoreDifference`: `scoreFor - scoreAgainst`
 * - `scoreFor`: total scored
 * - `wins`: number of wins
 * - `seed`: the stronger seed ranks higher (a deterministic last resort)
 */
export type Tiebreaker =
  | 'headToHead'
  | 'scoreDifference'
  | 'scoreFor'
  | 'wins'
  | 'seed'

export interface StandingsOptions {
  /** The matches to rank, typically the output of `generateRoundRobin`. */
  matches: TournamentMatch[]
  /** Results recorded so far. Matches without a result count as unplayed. */
  results: MatchResult[]
  /** Needed only for the `seed` tiebreaker and to order equal rows. */
  participants?: Participant[]
  points?: Partial<PointsConfig>
  /** Defaults to `['headToHead', 'scoreDifference', 'scoreFor', 'wins']`. */
  tiebreakers?: Tiebreaker[]
}

/** One row of a standings table. */
export interface Standing {
  registrationId: string
  /** The group this row belongs to, or `null` outside a group stage. */
  group: number | null
  /** 1-based position within the group. Tied rows share a rank. */
  rank: number
  played: number
  won: number
  drawn: number
  lost: number
  scoreFor: number
  scoreAgainst: number
  scoreDifference: number
  points: number
}

/**
 * How qualifiers are ordered before they are seeded into the next stage.
 *
 * - `'rankThenPoints'` (default): finishing position first, so every group
 *   winner is seeded above every runner-up, and record separates the rows
 *   that finished level. This is the usual shape of a seeded playoff draw.
 * - `'pointsThenRank'`: record first, ignoring which group it was earned in.
 *   Only fair when the groups are the same size and of comparable strength.
 *
 * Supply a comparator instead for anything else; it follows the
 * `Array.prototype.sort` contract, so return a negative number when `a`
 * should be seeded above `b`.
 */
export type QualifierOrder = 'rankThenPoints' | 'pointsThenRank'

/** Orders two standings rows. Negative means `a` is seeded above `b`. */
export type QualifierComparator = (a: Standing, b: Standing) => number

export interface QualifiersOptions {
  /** The table to read, typically the output of {@link calculateStandings}. */
  standings: Standing[]
  /**
   * How many qualify from each group, taken by `rank`.
   *
   * `0` takes nobody automatically, which is how you select purely on record
   * with `bestRemaining`.
   */
  perGroup?: number
  /**
   * Additionally take this many of the best rows that `perGroup` left behind,
   * compared across every group.
   *
   * Under the default `order` this is the "best third-placed teams" rule:
   * finishing position is compared first, so every third-placed row is
   * considered ahead of every fourth-placed one. Defaults to `0`.
   */
  bestRemaining?: number
  /** Defaults to `'rankThenPoints'`. */
  order?: QualifierOrder | QualifierComparator
}
