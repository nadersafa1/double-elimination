import { describe, it, expect } from 'vitest'
import {
  calculateStandings,
  generateDoubleElimination,
  generateRoundRobin,
  qualifiersFromStandings,
  type MatchResult,
  type Standing,
  type TournamentMatch,
} from '../src'
import { createIdFactory, createParticipants } from './helpers'

/**
 * Builds a table by hand, so a test can state the exact shape it cares about
 * instead of reverse-engineering scorelines that produce it.
 */
const row = (
  registrationId: string,
  group: number | null,
  rank: number,
  overrides: Partial<Standing> = {}
): Standing => ({
  registrationId,
  group,
  rank,
  played: 3,
  won: 0,
  drawn: 0,
  lost: 0,
  scoreFor: 0,
  scoreAgainst: 0,
  scoreDifference: 0,
  points: 0,
  ...overrides,
})

const ids = (qualifiers: { registrationId: string }[]) =>
  qualifiers.map((q) => q.registrationId)

describe('qualifiersFromStandings', () => {
  describe('selection', () => {
    it('takes the top N of every group', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('a3', 0, 3, { points: 3 }),
        row('b1', 1, 1, { points: 7 }),
        row('b2', 1, 2, { points: 5 }),
        row('b3', 1, 3, { points: 1 }),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(ids(qualifiers)).toEqual(['a1', 'b1', 'a2', 'b2'])
    })

    it('seeds the qualifiers 1..N', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('b1', 1, 1, { points: 7 }),
        row('b2', 1, 2, { points: 5 }),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(qualifiers.map((q) => q.seed)).toEqual([1, 2, 3, 4])
    })

    it('treats an ungrouped table as a single pool', () => {
      const standings = [
        row('p1', null, 1, { points: 9 }),
        row('p2', null, 2, { points: 6 }),
        row('p3', null, 3, { points: 3 }),
        row('p4', null, 4, { points: 0 }),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(ids(qualifiers)).toEqual(['p1', 'p2'])
    })

    it('carries no participant the table did not list', () => {
      const standings = [
        row('a1', 0, 1),
        row('a2', 0, 2),
        row('b1', 1, 1),
        row('b2', 1, 2),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 1 })

      expect(qualifiers).toHaveLength(2)
      expect(ids(qualifiers).sort()).toEqual(['a1', 'b1'])
    })
  })

  describe('ordering', () => {
    it('seeds every group winner above every runner-up by default', () => {
      const standings = [
        // The weakest winner still outranks the strongest runner-up.
        row('a1', 0, 1, { points: 4 }),
        row('a2', 0, 2, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 8 }),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(ids(qualifiers)).toEqual(['b1', 'a1', 'b2', 'a2'])
    })

    it('orders level finishers by points, then difference, then scored', () => {
      const standings = [
        row('a1', 0, 1, { points: 6, scoreDifference: 2, scoreFor: 5 }),
        row('b1', 1, 1, { points: 6, scoreDifference: 4, scoreFor: 9 }),
        row('c1', 2, 1, { points: 9, scoreDifference: 1, scoreFor: 3 }),
        row('d1', 3, 1, { points: 6, scoreDifference: 2, scoreFor: 8 }),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 1 })

      expect(ids(qualifiers)).toEqual(['c1', 'b1', 'd1', 'a1'])
    })

    it("lets record outrank finishing position under 'pointsThenRank'", () => {
      const standings = [
        row('a1', 0, 1, { points: 4 }),
        row('a2', 0, 2, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 8 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        order: 'pointsThenRank',
      })

      expect(ids(qualifiers)).toEqual(['b1', 'b2', 'a1', 'a2'])
    })

    it('accepts a comparator for rules of its own', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('b1', 1, 1, { points: 7 }),
        row('b2', 1, 2, { points: 5 }),
      ]

      // Alphabetical, which no built-in order would produce.
      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        order: (a, b) => b.registrationId.localeCompare(a.registrationId),
      })

      expect(ids(qualifiers)).toEqual(['b2', 'b1', 'a2', 'a1'])
    })

    it('keeps qualifiers the order cannot separate in table order', () => {
      // Identical records across four groups: seeding is arbitrary on merit,
      // so it must at least be stable and repeatable.
      const standings = [
        row('a1', 0, 1),
        row('b1', 1, 1),
        row('c1', 2, 1),
        row('d1', 3, 1),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 1 })

      expect(ids(qualifiers)).toEqual(['a1', 'b1', 'c1', 'd1'])
    })
  })

  describe('bestRemaining', () => {
    it('takes the best third-placed rows across the groups', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('a3', 0, 3, { points: 4 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 6 }),
        row('b3', 1, 3, { points: 1 }),
        row('c1', 2, 1, { points: 9 }),
        row('c2', 2, 2, { points: 6 }),
        row('c3', 2, 3, { points: 2 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        bestRemaining: 2,
      })

      expect(ids(qualifiers)).toHaveLength(8)
      expect(ids(qualifiers).slice(6)).toEqual(['a3', 'c3'])
      expect(ids(qualifiers)).not.toContain('b3')
    })

    it('prefers a weak third place to a strong fourth place by default', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 8 }),
        row('a3', 0, 3, { points: 7 }), // strong fourth-best, but 3rd
        row('a4', 0, 4, { points: 6 }),
        row('b1', 1, 1, { points: 5 }),
        row('b2', 1, 2, { points: 4 }),
        row('b3', 1, 3, { points: 1 }), // weak, but still a third place
        row('b4', 1, 4, { points: 0 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        bestRemaining: 2,
      })

      expect(ids(qualifiers).slice(4)).toEqual(['a3', 'b3'])
    })

    it("compares purely on record under 'pointsThenRank'", () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 8 }),
        row('a3', 0, 3, { points: 7 }),
        row('a4', 0, 4, { points: 6 }),
        row('b1', 1, 1, { points: 5 }),
        row('b2', 1, 2, { points: 4 }),
        row('b3', 1, 3, { points: 1 }),
        row('b4', 1, 4, { points: 0 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        bestRemaining: 2,
        order: 'pointsThenRank',
      })

      // a4 beats b3 on points once finishing position stops mattering.
      expect(ids(qualifiers)).toContain('a4')
      expect(ids(qualifiers)).not.toContain('b3')
    })

    it('selects purely on record when perGroup is 0', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 8 }),
        row('b1', 1, 1, { points: 3 }),
        row('b2', 1, 2, { points: 1 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 0,
        bestRemaining: 3,
        order: 'pointsThenRank',
      })

      expect(ids(qualifiers)).toEqual(['a1', 'a2', 'b1'])
    })

    it('seeds best-remaining rows into the field, not after it', () => {
      const standings = [
        row('a1', 0, 1, { points: 4 }),
        row('a2', 0, 2, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 8 }),
        row('b3', 1, 3, { points: 7 }),
        row('a3', 0, 3, { points: 1 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        bestRemaining: 1,
        order: 'pointsThenRank',
      })

      // b3's record puts it above both of group A's qualifiers.
      expect(ids(qualifiers)).toEqual(['b1', 'b2', 'b3', 'a1', 'a2'])
    })
  })

  describe('ties across the cut', () => {
    it('refuses to pick between participants level on the last place', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('a3', 0, 2, { points: 6 }), // shares rank 2
      ]

      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 2 })
      ).toThrowError(/tied on rank 2/)
    })

    it('names the tied participants and the way out', () => {
      const standings = [
        row('a1', 0, 1),
        row('a2', 0, 2),
        row('a3', 0, 2),
        row('a4', 0, 2),
      ]

      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 2 })
      ).toThrowError(/"a2", "a3", "a4".*'seed'/s)
    })

    it('allows a tie that sits entirely inside the qualifying places', () => {
      const standings = [
        row('a1', 0, 1),
        row('a2', 0, 1), // level, but both go through
        row('a3', 0, 3),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(ids(qualifiers)).toEqual(['a1', 'a2'])
    })

    it('allows a tie that sits entirely below the qualifying places', () => {
      const standings = [
        row('a1', 0, 1),
        row('a2', 0, 2),
        row('a3', 0, 3),
        row('a4', 0, 3),
      ]

      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(ids(qualifiers)).toEqual(['a1', 'a2'])
    })

    it('refuses to pick between level best-remaining rows', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('a3', 0, 3, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 6 }),
        row('b3', 1, 3, { points: 3 }), // identical to a3
      ]

      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 2, bestRemaining: 1 })
      ).toThrowError(/level on the last of 1 best-remaining place/)
    })

    it('accepts level best-remaining rows when all of them fit', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('a3', 0, 3, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 6 }),
        row('b3', 1, 3, { points: 3 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        bestRemaining: 2,
      })

      expect(ids(qualifiers)).toHaveLength(6)
    })

    it('reports the whole tied run, and a bestRemaining that clears it', () => {
      // Three third-placed rows level on 3 points, competing for 2 places.
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a3', 0, 3, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b3', 1, 3, { points: 3 }),
        row('c1', 2, 1, { points: 9 }),
        row('c3', 2, 3, { points: 3 }),
        row('d1', 3, 1, { points: 9 }),
        row('d3', 3, 3, { points: 1 }), // clear of the tie
      ]
      const select = (bestRemaining: number) =>
        qualifiersFromStandings({ standings, perGroup: 1, bestRemaining })

      expect(() => select(2)).toThrowError(
        /3 participants are level .*"a3", "b3", "c3".*bestRemaining 3 — or none, with 0/s
      )

      // Both numbers the message offers avoid splitting the tied run.
      expect(ids(select(3))).toHaveLength(7) // all three tied rows
      expect(ids(select(0))).toHaveLength(4) // none of them
    })

    it('lets a comparator separate rows the table could not', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('a3', 0, 3, { points: 3 }),
        row('b1', 1, 1, { points: 9 }),
        row('b2', 1, 2, { points: 6 }),
        row('b3', 1, 3, { points: 3 }),
      ]

      const qualifiers = qualifiersFromStandings({
        standings,
        perGroup: 2,
        bestRemaining: 1,
        order: (a, b) =>
          a.rank - b.rank ||
          b.points - a.points ||
          a.registrationId.localeCompare(b.registrationId),
      })

      expect(ids(qualifiers)).toContain('a3')
      expect(ids(qualifiers)).not.toContain('b3')
    })
  })

  describe('validation', () => {
    const standings = [row('a1', 0, 1), row('a2', 0, 2), row('a3', 0, 3)]

    it('rejects standings that are not an array', () => {
      expect(() =>
        qualifiersFromStandings({
          standings: undefined as unknown as Standing[],
          perGroup: 1,
        })
      ).toThrowError(/standings must be an array/)
    })

    it('rejects an empty table', () => {
      expect(() =>
        qualifiersFromStandings({ standings: [], perGroup: 1 })
      ).toThrowError(/standings is empty/)
    })

    it('rejects a table with neither perGroup nor bestRemaining', () => {
      expect(() => qualifiersFromStandings({ standings })).toThrowError(
        /needs perGroup, bestRemaining, or both/
      )
    })

    it('rejects a selection that takes nobody', () => {
      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 0, bestRemaining: 0 })
      ).toThrowError(/nobody would qualify/)
    })

    it('rejects a fractional or negative perGroup', () => {
      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 1.5 })
      ).toThrowError(/perGroup must be an integer of at least 0/)
      expect(() =>
        qualifiersFromStandings({ standings, perGroup: -1 })
      ).toThrowError(/perGroup must be an integer of at least 0/)
    })

    it('rejects a perGroup larger than a group', () => {
      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 4 })
      ).toThrowError(/perGroup 4 exceeds Group 0, which holds 3/)
    })

    it('rejects a bestRemaining larger than the field left behind', () => {
      expect(() =>
        qualifiersFromStandings({ standings, perGroup: 2, bestRemaining: 3 })
      ).toThrowError(/bestRemaining 3 exceeds the 1 participant/)
    })

    it('rejects an unknown order', () => {
      expect(() =>
        qualifiersFromStandings({
          standings,
          perGroup: 1,
          order: 'byVibes' as never,
        })
      ).toThrowError(/Unknown order: "byVibes"/)
    })

    it('rejects a row without a registrationId', () => {
      expect(() =>
        qualifiersFromStandings({
          standings: [row('', 0, 1)],
          perGroup: 1,
        })
      ).toThrowError(/non-empty registrationId/)
    })

    it('rejects a row whose rank is not a positive integer', () => {
      expect(() =>
        qualifiersFromStandings({
          standings: [row('a1', 0, 0)],
          perGroup: 1,
        })
      ).toThrowError(/rank that is not a positive integer/)
    })

    it('rejects two tables concatenated together', () => {
      expect(() =>
        qualifiersFromStandings({
          standings: [row('a1', 0, 1), row('a1', 1, 1)],
          perGroup: 1,
        })
      ).toThrowError(/Duplicate registrationId in standings: "a1"/)
    })
  })

  describe('feeding the next stage', () => {
    /** Plays every fixture, with the better seed always winning. */
    const playOut = (matches: TournamentMatch[]): MatchResult[] =>
      matches
        .filter((m) => m.registration1Id && m.registration2Id)
        .map((m) => {
          const seedOf = (id: string) => Number(id.replace('player-', ''))
          const first = seedOf(m.registration1Id!)
          const second = seedOf(m.registration2Id!)
          return {
            matchId: m.id,
            score1: first < second ? 2 : 0,
            score2: first < second ? 0 : 2,
          }
        })

    it('turns a real group stage into a bracket field', () => {
      const idFactory = createIdFactory()
      const participants = createParticipants(16)

      const groupStage = generateRoundRobin({
        eventId: 'champions-2026',
        participants,
        idFactory,
        groupCount: 4,
      })

      const table = calculateStandings({
        matches: groupStage,
        results: playOut(groupStage),
        participants,
        // 'seed' last, so the cut is always strict
        tiebreakers: [
          'headToHead',
          'scoreDifference',
          'scoreFor',
          'wins',
          'seed',
        ],
      })

      const qualifiers = qualifiersFromStandings({
        standings: table,
        perGroup: 2,
      })

      expect(qualifiers).toHaveLength(8)

      const playoffs = generateDoubleElimination({
        eventId: 'champions-2026-playoffs',
        participants: qualifiers,
        idFactory,
        grandFinal: 'single',
      })

      // A full 8-player field, so nobody needs a bye.
      expect(playoffs.filter((m) => m.bracketType === 'winners')).toHaveLength(
        7
      )
      for (const match of playoffs.filter(
        (m) => m.bracketType === 'winners' && m.round === 1
      )) {
        expect(match.registration1Id).not.toBeNull()
        expect(match.registration2Id).not.toBeNull()
      }
    })

    it('produces a field every generator accepts', () => {
      const standings = [
        row('a1', 0, 1, { points: 9 }),
        row('a2', 0, 2, { points: 6 }),
        row('b1', 1, 1, { points: 7 }),
        row('b2', 1, 2, { points: 5 }),
      ]
      const qualifiers = qualifiersFromStandings({ standings, perGroup: 2 })

      expect(() =>
        generateDoubleElimination({
          eventId: 'stage-2',
          participants: qualifiers,
          idFactory: createIdFactory(),
        })
      ).not.toThrow()
    })
  })
})
