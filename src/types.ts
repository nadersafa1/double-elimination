export interface Participant {
  registrationId: string
  seed: number
}

export interface BracketMatch {
  id: string
  eventId: string
  round: number
  matchNumber: number
  registration1Id: string | null
  registration2Id: string | null
  bracketPosition: number
  winnerTo: string | null
  winnerToSlot: number | null
  loserTo: string | null
  loserToSlot: number | null
  bracketType: 'winners' | 'losers'
}

export type IdFactory = () => string

export interface GeneratorOptions {
  eventId: string
  participants: Participant[]
  idFactory: IdFactory
  /**
   * Number of rounds before the finals where the losers bracket begins.
   * Players who lose before this point are permanently eliminated.
   * Example: For 16 players (4 rounds), setting this to 2 means:
   * - Round 1: Single elimination (losers out)
   * - Rounds 2-3 (QF, SF): Losers go to losers bracket
   * - Round 4 (Finals): Loser = 2nd place
   * If undefined, full double elimination is used.
   */
  losersStartRoundsBeforeFinal?: number
}
