/** A competitor entered into the bracket. */
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
 * Which bracket a match belongs to.
 *
 * `grandFinal` matches are only produced when the `grandFinal` option is
 * enabled.
 */
export type BracketType = 'winners' | 'losers' | 'grandFinal'

export interface BracketMatch {
  id: string
  eventId: string
  /** 1-based round index, counted within `bracketType`. */
  round: number
  /** 1-based index of the match within its round (`bracketPosition + 1`). */
  matchNumber: number
  registration1Id: string | null
  registration2Id: string | null
  /** 0-based index of the match within its round, top to bottom. */
  bracketPosition: number
  /** Match the winner advances to, or `null` if the match ends the bracket. */
  winnerTo: string | null
  /** Slot (1 or 2) the winner occupies in `winnerTo`. */
  winnerToSlot: number | null
  /** Match the loser drops to, or `null` if losing eliminates the player. */
  loserTo: string | null
  /** Slot (1 or 2) the loser occupies in `loserTo`. */
  loserToSlot: number | null
  bracketType: BracketType
}

export type IdFactory = () => string

/**
 * How the winners-bracket winner and losers-bracket winner meet.
 *
 * - `'none'` (default): no grand final. The winners final decides 1st/2nd and
 *   the losers final decides 3rd/4th.
 * - `'single'`: one grand final match. The winners final loser drops to the
 *   losers final, and the losers bracket winner plays the winners bracket
 *   winner once for the title.
 * - `'reset'`: as `'single'`, plus a bracket-reset match. The reset is played
 *   only when the losers bracket representative wins the first grand final,
 *   so that both finalists have been beaten twice.
 */
export type GrandFinalFormat = 'none' | 'single' | 'reset'

export interface GeneratorOptions {
  eventId: string
  participants: Participant[]
  idFactory: IdFactory
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
