import { describe, it, expect } from 'vitest'
import {
  calculateStandings,
  generateRoundRobin,
  type MatchResult,
  type TournamentMatch,
} from '../src'
import { createIdFactory, createParticipants } from './helpers'

const generate = (count: number, overrides = {}) =>
  generateRoundRobin({
    eventId: 'league-1',
    participants: createParticipants(count),
    idFactory: createIdFactory(),
    ...overrides,
  })

/** Records a scoreline for the match between two named participants. */
const score = (
  matches: TournamentMatch[],
  a: string,
  b: string,
  scoreA: number,
  scoreB: number
): MatchResult => {
  const match = matches.find(
    (m) =>
      (m.registration1Id === a && m.registration2Id === b) ||
      (m.registration1Id === b && m.registration2Id === a)
  )
  if (!match) throw new Error(`no match between ${a} and ${b}`)

  return match.registration1Id === a
    ? { matchId: match.id, score1: scoreA, score2: scoreB }
    : { matchId: match.id, score1: scoreB, score2: scoreA }
}

const order = (standings: { registrationId: string }[]) =>
  standings.map((row) => row.registrationId)

describe('calculateStandings', () => {
  it('lists every participant before anything is played', () => {
    const matches = generate(4)
    const standings = calculateStandings({ matches, results: [] })

    expect(standings).toHaveLength(4)
    for (const row of standings) {
      expect(row.played).toBe(0)
      expect(row.points).toBe(0)
      expect(row.rank).toBe(1) // all level
    }
  })

  it('counts wins, draws, losses, scores and points', () => {
    const matches = generate(3)
    const results = [
      score(matches, 'player-1', 'player-2', 3, 1),
      score(matches, 'player-1', 'player-3', 2, 2),
      score(matches, 'player-2', 'player-3', 0, 4),
    ]

    const standings = calculateStandings({ matches, results })
    const row = (id: string) => standings.find((s) => s.registrationId === id)!

    expect(row('player-1')).toMatchObject({
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      scoreFor: 5,
      scoreAgainst: 3,
      scoreDifference: 2,
      points: 4,
    })
    // Level on points and level head-to-head (2-2), so score difference
    // decides and player-3 takes top spot.
    expect(row('player-3')).toMatchObject({
      played: 2,
      won: 1,
      drawn: 1,
      lost: 0,
      scoreFor: 6,
      scoreAgainst: 2,
      scoreDifference: 4,
      points: 4,
      rank: 1,
    })
    expect(row('player-1').rank).toBe(2)
    expect(row('player-2')).toMatchObject({
      played: 2,
      won: 0,
      drawn: 0,
      lost: 2,
      points: 0,
      rank: 3,
    })
  })

  it('counts only the matches that have results', () => {
    const matches = generate(4)
    const standings = calculateStandings({
      matches,
      results: [score(matches, 'player-1', 'player-4', 1, 0)],
    })

    expect(standings.find((s) => s.registrationId === 'player-1')!.played).toBe(
      1
    )
    expect(standings.find((s) => s.registrationId === 'player-2')!.played).toBe(
      0
    )
  })

  it('accepts results without scores', () => {
    const matches = generate(3)
    const byWinner = matches.map((match) => ({
      matchId: match.id,
      winnerId: match.registration1Id,
    }))

    const standings = calculateStandings({ matches, results: byWinner })

    expect(standings.reduce((total, row) => total + row.won, 0)).toBe(3)
    expect(standings.reduce((total, row) => total + row.drawn, 0)).toBe(0)
  })

  it('records a draw for a null winnerId', () => {
    const matches = generate(3)
    const standings = calculateStandings({
      matches,
      results: matches.map((match) => ({ matchId: match.id, winnerId: null })),
    })

    for (const row of standings) {
      expect(row.drawn).toBe(row.played)
      expect(row.points).toBe(row.played)
    }
  })

  it('honours a custom points table', () => {
    const matches = generate(3)
    const results = [score(matches, 'player-1', 'player-2', 1, 0)]

    const standings = calculateStandings({
      matches,
      results,
      points: { win: 2, draw: 0, loss: -1 },
    })

    expect(standings.find((s) => s.registrationId === 'player-1')!.points).toBe(
      2
    )
    expect(standings.find((s) => s.registrationId === 'player-2')!.points).toBe(
      -1
    )
  })
})

describe('tiebreakers', () => {
  it('separates level teams on head-to-head first', () => {
    const matches = generate(4)
    // player-2 and player-3 both finish on 6 points, but player-3 won between
    // them; player-2 has the better goal difference, which must not count yet.
    const results = [
      score(matches, 'player-1', 'player-2', 0, 1),
      score(matches, 'player-1', 'player-3', 1, 0),
      score(matches, 'player-1', 'player-4', 0, 1),
      score(matches, 'player-2', 'player-3', 0, 1),
      score(matches, 'player-2', 'player-4', 5, 0),
      score(matches, 'player-3', 'player-4', 1, 0),
    ]

    const standings = calculateStandings({ matches, results })

    expect(order(standings).slice(0, 2)).toEqual(['player-3', 'player-2'])
  })

  it('falls back to score difference when head-to-head is level', () => {
    const matches = generate(4)
    const results = [
      score(matches, 'player-1', 'player-2', 1, 1),
      score(matches, 'player-1', 'player-3', 4, 0),
      score(matches, 'player-1', 'player-4', 0, 1),
      score(matches, 'player-2', 'player-3', 1, 0),
      score(matches, 'player-2', 'player-4', 0, 1),
      score(matches, 'player-3', 'player-4', 0, 1),
    ]

    const standings = calculateStandings({ matches, results })
    const one = standings.find((s) => s.registrationId === 'player-1')!
    const two = standings.find((s) => s.registrationId === 'player-2')!

    expect(one.points).toBe(two.points)
    expect(one.rank).toBeLessThan(two.rank)
  })

  it('applies tiebreakers in the order given', () => {
    const matches = generate(4)
    const results = [
      score(matches, 'player-1', 'player-2', 0, 1),
      score(matches, 'player-1', 'player-3', 1, 0),
      score(matches, 'player-1', 'player-4', 0, 1),
      score(matches, 'player-2', 'player-3', 0, 1),
      score(matches, 'player-2', 'player-4', 5, 0),
      score(matches, 'player-3', 'player-4', 1, 0),
    ]

    // Same results as the head-to-head test, but score difference leads.
    const standings = calculateStandings({
      matches,
      results,
      tiebreakers: ['scoreDifference', 'headToHead'],
    })

    expect(order(standings).slice(0, 2)).toEqual(['player-2', 'player-3'])
  })

  it('shares a rank when nothing separates two participants', () => {
    const matches = generate(3)
    const standings = calculateStandings({
      matches,
      results: matches.map((match) => ({ matchId: match.id, winnerId: null })),
    })

    expect(standings.map((row) => row.rank)).toEqual([1, 1, 1])
  })

  it('numbers ranks so that a shared rank consumes the places below it', () => {
    const matches = generate(4)
    const results = [
      score(matches, 'player-1', 'player-2', 1, 0),
      score(matches, 'player-1', 'player-3', 1, 0),
      score(matches, 'player-1', 'player-4', 1, 0),
      score(matches, 'player-2', 'player-3', 0, 0),
      score(matches, 'player-2', 'player-4', 0, 0),
      score(matches, 'player-3', 'player-4', 0, 0),
    ]

    const standings = calculateStandings({ matches, results })

    expect(standings.map((row) => row.rank)).toEqual([1, 2, 2, 2])
  })

  it('can break a tie on seed as a last resort', () => {
    const matches = generate(3)
    const participants = createParticipants(3)
    const standings = calculateStandings({
      matches,
      participants,
      results: matches.map((match) => ({ matchId: match.id, winnerId: null })),
      tiebreakers: ['seed'],
    })

    expect(order(standings)).toEqual(['player-1', 'player-2', 'player-3'])
    expect(standings.map((row) => row.rank)).toEqual([1, 2, 3])
  })
})

describe('group standings', () => {
  it('ranks each group independently', () => {
    const matches = generate(8, { groupCount: 2 })
    const results = matches.map((match) => ({
      matchId: match.id,
      // The stronger seed always wins.
      winnerId:
        Number(match.registration1Id!.replace('player-', '')) <
        Number(match.registration2Id!.replace('player-', ''))
          ? match.registration1Id
          : match.registration2Id,
    }))

    const standings = calculateStandings({ matches, results })

    expect(standings).toHaveLength(8)
    expect(
      standings.filter((row) => row.group === 0).map((row) => row.rank)
    ).toEqual([1, 2, 3, 4])
    expect(standings.filter((row) => row.group === 1)[0].registrationId).toBe(
      'player-2'
    )
    expect(standings.filter((row) => row.group === 0)[0].registrationId).toBe(
      'player-1'
    )
  })

  it('keeps head-to-head inside the group', () => {
    const matches = generate(8, { groupCount: 2 })
    const standings = calculateStandings({ matches, results: [] })

    for (const row of standings) {
      expect([0, 1]).toContain(row.group)
      expect(row.rank).toBe(1)
    }
  })
})

describe('standings validation', () => {
  it('rejects a result for an unknown match', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({
        matches,
        results: [{ matchId: 'nope', score1: 1, score2: 0 }],
      })
    ).toThrow('Result references unknown match: "nope"')
  })

  it('rejects two results for the same match', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({
        matches,
        results: [
          { matchId: matches[0].id, score1: 1, score2: 0 },
          { matchId: matches[0].id, score1: 0, score2: 1 },
        ],
      })
    ).toThrow('Duplicate result for match')
  })

  it('rejects half a scoreline', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({
        matches,
        results: [{ matchId: matches[0].id, score1: 1 }],
      })
    ).toThrow('needs both score1 and score2, or neither')
  })

  it('rejects a result with no outcome at all', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({ matches, results: [{ matchId: matches[0].id }] })
    ).toThrow('needs score1 and score2, or a winnerId')
  })

  it('rejects a winner who did not play in the match', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({
        matches,
        results: [{ matchId: matches[0].id, winnerId: 'stranger' }],
      })
    ).toThrow('did not play in match')
  })

  it('rejects points as a tiebreaker, since it always applies first', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({
        matches,
        results: [],
        // @ts-expect-error points is not a tiebreaker
        tiebreakers: ['points'],
      })
    ).toThrow('Unknown tiebreaker: "points"')
  })

  it('rejects an unknown tiebreaker', () => {
    const matches = generate(3)
    expect(() =>
      calculateStandings({
        matches,
        results: [],
        // @ts-expect-error deliberately wrong value
        tiebreakers: ['coinToss'],
      })
    ).toThrow('Unknown tiebreaker: "coinToss"')
  })
})
