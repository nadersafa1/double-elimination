import { describe, it, expect } from 'vitest'
import {
  generateDoubleElimination,
  recordResult,
  type TournamentMatch,
} from '../src'
import {
  chalk,
  createIdFactory,
  createParticipants,
  seededPicker,
} from './helpers'

const generate = (count: number, overrides = {}) =>
  generateDoubleElimination({
    eventId: 'event-1',
    participants: createParticipants(count),
    idFactory: createIdFactory(),
    ...overrides,
  })

const grandFinals = (matches: TournamentMatch[]) =>
  matches
    .filter((m) => m.bracketType === 'grandFinal')
    .sort((a, b) => a.round - b.round)

/** Plays every ready match through recordResult until nothing is left. */
const playOut = (
  initial: TournamentMatch[],
  pickWinner: (a: string, b: string, match: TournamentMatch) => string
) => {
  let matches = initial
  const recorded = new Set<string>()
  const results: { match: TournamentMatch; winner: string }[] = []

  for (;;) {
    const ready = matches.find(
      (m) => !recorded.has(m.id) && m.registration1Id && m.registration2Id
    )
    if (!ready) break
    const winner = pickWinner(
      ready.registration1Id!,
      ready.registration2Id!,
      ready
    )
    matches = recordResult(matches, { matchId: ready.id, winnerId: winner })
    recorded.add(ready.id)
    results.push({ match: ready, winner })
  }

  return { matches, results, champion: results[results.length - 1]?.winner }
}

describe('recordResult', () => {
  it('moves the winner and loser to their next matches', () => {
    const matches = generate(8)
    const first = matches.find((m) => m.registration1Id && m.registration2Id)!

    const updated = recordResult(matches, {
      matchId: first.id,
      score1: 1,
      score2: 3,
    })

    const winnerMatch = updated.find((m) => m.id === first.winnerTo)!
    const loserMatch = updated.find((m) => m.id === first.loserTo)!
    const slotOf = (m: TournamentMatch, slot: number | null) =>
      slot === 1 ? m.registration1Id : m.registration2Id

    expect(slotOf(winnerMatch, first.winnerToSlot)).toBe(first.registration2Id)
    expect(slotOf(loserMatch, first.loserToSlot)).toBe(first.registration1Id)
  })

  it('does not mutate its input', () => {
    const matches = generate(8)
    const snapshot = structuredClone(matches)
    const first = matches.find((m) => m.registration1Id && m.registration2Id)!

    recordResult(matches, {
      matchId: first.id,
      winnerId: first.registration1Id,
    })

    expect(matches).toEqual(snapshot)
  })

  it('skips the reset when the winners bracket representative wins', () => {
    const matches = generate(8, { grandFinal: 'reset' })
    const [, reset] = grandFinals(matches)

    const { matches: final, results, champion } = playOut(matches, chalk)

    expect(champion).toBe('player-1')
    expect(final.find((m) => m.id === reset.id)).toBeUndefined()
    expect(results.some((r) => r.match.id === reset.id)).toBe(false)

    const [first] = grandFinals(final)
    expect(first.winnerTo).toBeNull()
    expect(first.loserTo).toBeNull()
  })

  it('plays the reset when the losers bracket representative wins', () => {
    const matches = generate(8, { grandFinal: 'reset' })
    const [first, reset] = grandFinals(matches)

    // Better seed wins everything, except the losers bracket side takes the
    // first grand final.
    const { matches: final, results } = playOut(matches, (a, b, match) =>
      match.id === first.id ? b : chalk(a, b)
    )

    const gf1 = results.find((r) => r.match.id === first.id)!
    expect(gf1.winner).toBe(gf1.match.registration2Id)

    const played = results.find((r) => r.match.id === reset.id)
    expect(played).toBeDefined()
    expect(final.find((m) => m.id === reset.id)).toBeDefined()
    expect(played!.match.registration1Id).toBe(gf1.winner)
    expect(played!.match.registration2Id).toBe('player-1')
  })

  it('always finishes with a single champion', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const matches = generate(7, { grandFinal: 'reset' })
      const [first, reset] = grandFinals(matches)
      const { matches: final, results } = playOut(matches, seededPicker(seed))

      const gf1 = results.find((r) => r.match.id === first.id)!
      const resetKept = final.some((m) => m.id === reset.id)
      expect(resetKept).toBe(gf1.winner === gf1.match.registration2Id)
      expect(results.some((r) => r.match.id === reset.id)).toBe(resetKept)
    }
  })

  it('rejects unusable results', () => {
    const matches = generate(8, { grandFinal: 'reset' })
    const ready = matches.find((m) => m.registration1Id && m.registration2Id)!
    const [first] = grandFinals(matches)

    expect(() =>
      recordResult(matches, { matchId: 'nope', winnerId: 'x' })
    ).toThrow(/Unknown match/)
    expect(() =>
      recordResult(matches, { matchId: ready.id, winnerId: 'stranger' })
    ).toThrow(/did not play/)
    expect(() =>
      recordResult(matches, { matchId: ready.id, score1: 2, score2: 2 })
    ).toThrow(/draw/)
    expect(() =>
      recordResult(matches, { matchId: first.id, winnerId: 'x' })
    ).toThrow(/two participants/)
  })
})
