import type { BracketMatch, Participant } from '../src'

export const createIdFactory = () => {
  let counter = 0
  return () => `match-${++counter}`
}

export const createParticipants = (count: number): Participant[] =>
  Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))

export const bySortedPosition = (a: BracketMatch, b: BracketMatch): number =>
  a.round - b.round || a.bracketPosition - b.bracketPosition

export const roundOf = (
  matches: BracketMatch[],
  bracketType: BracketMatch['bracketType'],
  round: number
): BracketMatch[] =>
  matches
    .filter((m) => m.bracketType === bracketType && m.round === round)
    .sort(bySortedPosition)

/** Every slot that some other match feeds into, as `matchId#slot`. */
export const fedSlots = (matches: BracketMatch[]): Set<string> => {
  const fed = new Set<string>()
  for (const match of matches) {
    if (match.winnerTo) fed.add(`${match.winnerTo}#${match.winnerToSlot}`)
    if (match.loserTo) fed.add(`${match.loserTo}#${match.loserToSlot}`)
  }
  return fed
}

export interface SimulationResult {
  /** Losses per registrationId. */
  losses: Map<string, number>
  /** Matches that were actually contested, in play order. */
  played: { match: BracketMatch; winner: string; loser: string }[]
  /** Matches holding a player who never got an opponent. */
  stalled: BracketMatch[]
  /** Pairings that happened more than once, with the round they repeated in. */
  rematches: {
    bracketType: string
    round: number
    players: [string, string]
  }[]
  champion: string | null
}

/**
 * Plays a whole bracket with the supplied outcome picker.
 *
 * Mirrors what a consumer has to do: propagate `winnerTo` / `loserTo`, treat a
 * match whose empty slot has no feeder as a walkover, and skip the bracket
 * reset unless the losers bracket representative won the first grand final.
 */
export const simulate = (
  matches: BracketMatch[],
  pickWinner: (a: string, b: string) => string
): SimulationResult => {
  const sim = new Map(matches.map((m) => [m.id, { ...m }]))
  const fed = fedSlots(matches)
  const losses = new Map<string, number>()
  const played: SimulationResult['played'] = []
  const rematches: SimulationResult['rematches'] = []
  const seenPairings = new Set<string>()
  const done = new Set<string>()

  const canStillFill = (match: BracketMatch, slot: 1 | 2): boolean => {
    const occupied = slot === 1 ? match.registration1Id : match.registration2Id
    return occupied !== null || fed.has(`${match.id}#${slot}`)
  }

  const place = (targetId: string | null, slot: number | null, who: string) => {
    if (!targetId || !slot) return
    const target = sim.get(targetId)
    if (!target) return
    if (slot === 1) target.registration1Id = who
    else target.registration2Id = who
  }

  let progressed = true
  while (progressed) {
    progressed = false

    for (const match of sim.values()) {
      if (done.has(match.id)) continue

      // The bracket reset is only played when the losers bracket side (slot 2)
      // won the first grand final.
      if (match.bracketType === 'grandFinal' && match.round === 2) {
        const first = [...sim.values()].find(
          (m) => m.bracketType === 'grandFinal' && m.round === 1
        )
        const firstResult = played.find((p) => p.match.id === first?.id)
        if (!firstResult) continue
        if (firstResult.winner !== first?.registration2Id) {
          done.add(match.id)
          progressed = true
          continue
        }
      }

      const a = match.registration1Id
      const b = match.registration2Id

      if (!a || !b) {
        // Walkover: one slot can never be filled, so nothing is contested here.
        if (!canStillFill(match, 1) || !canStillFill(match, 2)) {
          done.add(match.id)
          progressed = true
        }
        continue
      }

      const pairing = a < b ? `${a}|${b}` : `${b}|${a}`
      if (seenPairings.has(pairing)) {
        rematches.push({
          bracketType: match.bracketType,
          round: match.round,
          players: [a, b],
        })
      }
      seenPairings.add(pairing)

      const winner = pickWinner(a, b)
      const loser = winner === a ? b : a
      losses.set(loser, (losses.get(loser) ?? 0) + 1)
      played.push({ match, winner, loser })

      place(match.winnerTo, match.winnerToSlot, winner)
      place(match.loserTo, match.loserToSlot, loser)

      done.add(match.id)
      progressed = true
    }
  }

  const stalled = [...sim.values()].filter(
    (m) =>
      !done.has(m.id) &&
      (m.registration1Id !== null || m.registration2Id !== null)
  )

  const last = played[played.length - 1]

  return { losses, played, stalled, rematches, champion: last?.winner ?? null }
}

/** Deterministic outcome picker: the better seed always wins. */
export const chalk = (a: string, b: string): string => {
  const seedOf = (id: string) => Number(id.replace('player-', ''))
  return seedOf(a) <= seedOf(b) ? a : b
}

/** Deterministic pseudo-random outcome picker. */
export const seededPicker = (seed: number) => {
  let state = seed
  return (a: string, b: string): string => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x80000000 < 0.5 ? a : b
  }
}
