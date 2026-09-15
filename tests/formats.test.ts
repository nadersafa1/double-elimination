import { describe, it, expect } from 'vitest'
import {
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  generateTournament,
  type TournamentMatch,
} from '../src'
import {
  chalk,
  createIdFactory,
  createParticipants,
  roundOf,
  seededPicker,
  simulate,
} from './helpers'

describe('generateSingleElimination', () => {
  it.each([2, 3, 4, 5, 8, 9, 16, 23])(
    'plays %i participants down to one champion',
    (count) => {
      const matches = generateSingleElimination({
        eventId: 'cup-1',
        participants: createParticipants(count),
        idFactory: createIdFactory(),
      })

      expect(matches.every((m) => m.bracketType === 'winners')).toBe(true)

      const { stalled, champion, losses } = simulate(matches, seededPicker(3))
      expect(stalled).toEqual([])
      expect(champion).not.toBeNull()

      // One loss and you are out, so nobody is beaten twice.
      for (const [, beaten] of losses) expect(beaten).toBe(1)
    }
  )

  it('eliminates every loser exactly once', () => {
    const matches = generateSingleElimination({
      eventId: 'cup-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
    })

    expect(matches).toHaveLength(7)
    for (const match of matches) expect(match.loserTo).toBeNull()
  })

  it('adds a third place match on request', () => {
    const matches = generateSingleElimination({
      eventId: 'cup-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
      thirdPlaceMatch: true,
    })

    const thirdPlace = matches.filter((m) => m.bracketType === 'losers')
    expect(thirdPlace).toHaveLength(1)

    // Both semifinal losers, and nobody else, land in it.
    const semifinals = roundOf(matches, 'winners', 2)
    for (const semifinal of semifinals) {
      expect(semifinal.loserTo).toBe(thirdPlace[0].id)
    }
    for (const first of roundOf(matches, 'winners', 1)) {
      expect(first.loserTo).toBeNull()
    }
  })

  it('sends the top two seeds to the final', () => {
    const matches = generateSingleElimination({
      eventId: 'cup-1',
      participants: createParticipants(16),
      idFactory: createIdFactory(),
    })

    const { played } = simulate(matches, chalk)
    const final = played[played.length - 1]

    expect([final.winner, final.loser].sort()).toEqual(['player-1', 'player-2'])
  })

  it('rejects a non-boolean thirdPlaceMatch', () => {
    expect(() =>
      generateSingleElimination({
        eventId: 'cup-1',
        participants: createParticipants(8),
        idFactory: createIdFactory(),
        // @ts-expect-error deliberately wrong type
        thirdPlaceMatch: 'yes',
      })
    ).toThrow('thirdPlaceMatch must be a boolean')
  })

  it('rejects a third place match without a semifinal', () => {
    expect(() =>
      generateSingleElimination({
        eventId: 'cup-1',
        participants: createParticipants(2),
        idFactory: createIdFactory(),
        thirdPlaceMatch: true,
      })
    ).toThrow('requires at least 3 participants')
  })
})

describe('generateTournament', () => {
  const participants = createParticipants(8)
  const base = { eventId: 'event-1', participants }

  const sameShape = (a: TournamentMatch[], b: TournamentMatch[]) => {
    const strip = (matches: TournamentMatch[]) =>
      matches.map(({ id, winnerTo, loserTo, ...rest }) => rest)
    expect(strip(a)).toEqual(strip(b))
  }

  it('dispatches to single elimination', () => {
    sameShape(
      generateTournament({
        format: 'single-elimination',
        ...base,
        idFactory: createIdFactory(),
      }),
      generateSingleElimination({ ...base, idFactory: createIdFactory() })
    )
  })

  it('dispatches to double elimination', () => {
    sameShape(
      generateTournament({
        format: 'double-elimination',
        ...base,
        idFactory: createIdFactory(),
        grandFinal: 'reset',
      }),
      generateDoubleElimination({
        ...base,
        idFactory: createIdFactory(),
        grandFinal: 'reset',
      })
    )
  })

  it('dispatches to round robin', () => {
    sameShape(
      generateTournament({
        format: 'round-robin',
        ...base,
        idFactory: createIdFactory(),
        legs: 2,
      }),
      generateRoundRobin({ ...base, idFactory: createIdFactory(), legs: 2 })
    )
  })

  it('rejects an unknown format', () => {
    expect(() =>
      generateTournament({
        // @ts-expect-error deliberately wrong value
        format: 'swiss',
        ...base,
        idFactory: createIdFactory(),
      })
    ).toThrow('Unknown format: "swiss"')
  })
})

describe('shared match shape', () => {
  const participants = createParticipants(8)

  it('returns the same fields in every format', () => {
    const formats = [
      generateSingleElimination({
        eventId: 'e',
        participants,
        idFactory: createIdFactory(),
      }),
      generateDoubleElimination({
        eventId: 'e',
        participants,
        idFactory: createIdFactory(),
        grandFinal: 'reset',
      }),
      generateRoundRobin({
        eventId: 'e',
        participants,
        idFactory: createIdFactory(),
        groupCount: 2,
      }),
    ]

    const expected = [
      'bracketPosition',
      'bracketType',
      'eventId',
      'group',
      'id',
      'leg',
      'loserTo',
      'loserToSlot',
      'matchNumber',
      'registration1Id',
      'registration2Id',
      'round',
      'winnerTo',
      'winnerToSlot',
    ]

    for (const matches of formats) {
      for (const match of matches) {
        expect(Object.keys(match).sort()).toEqual(expected)
        expect(match.eventId).toBe('e')
      }
    }
  })
})
