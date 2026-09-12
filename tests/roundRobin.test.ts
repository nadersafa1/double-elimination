import { describe, it, expect } from 'vitest'
import { generateRoundRobin, type TournamentMatch } from '../src'
import { createIdFactory, createParticipants } from './helpers'

const generate = (count: number, overrides = {}) =>
  generateRoundRobin({
    eventId: 'league-1',
    participants: createParticipants(count),
    idFactory: createIdFactory(),
    ...overrides,
  })

const pairingsOf = (matches: TournamentMatch[]): string[] =>
  matches.map((m) => [m.registration1Id, m.registration2Id].sort().join(' v '))

const roundsOf = (matches: TournamentMatch[], group: number | null = null) => {
  const rounds = new Map<number, TournamentMatch[]>()
  for (const match of matches.filter((m) => m.group === group)) {
    rounds.set(match.round, [...(rounds.get(match.round) ?? []), match])
  }
  return rounds
}

const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 16, 21]

describe.each(SIZES)('round robin for %i participants', (count) => {
  it('pairs every participant with every other exactly once', () => {
    const matches = generate(count)
    const pairings = pairingsOf(matches)

    expect(matches).toHaveLength((count * (count - 1)) / 2)
    expect(new Set(pairings).size).toBe(pairings.length)
  })

  it('never schedules a participant twice in the same round', () => {
    for (const [round, matches] of roundsOf(generate(count))) {
      const players = matches.flatMap((m) => [
        m.registration1Id,
        m.registration2Id,
      ])
      expect(new Set(players).size, `round ${round}`).toBe(players.length)
    }
  })

  it('runs the minimum number of rounds', () => {
    const matches = generate(count)
    const rounds = new Set(matches.map((m) => m.round))

    // An even field plays every round; an odd field needs one extra round
    // because somebody always sits out.
    expect(rounds.size).toBe(count % 2 === 0 ? count - 1 : count)
  })

  it('rests each participant exactly once when the field is odd', () => {
    if (count % 2 === 0) return
    const matches = generate(count)

    for (const { registrationId } of createParticipants(count)) {
      const played = new Set(
        matches
          .filter(
            (m) =>
              m.registration1Id === registrationId ||
              m.registration2Id === registrationId
          )
          .map((m) => m.round)
      )
      expect(played.size).toBe(count - 1)
    }
  })

  it('splits the two sides of the fixture as evenly as possible', () => {
    const matches = generate(count)
    const firstNamed = new Map<string, number>()
    for (const match of matches) {
      const id = match.registration1Id!
      firstNamed.set(id, (firstNamed.get(id) ?? 0) + 1)
    }

    const gamesEach = count - 1
    for (const { registrationId } of createParticipants(count)) {
      const home = firstNamed.get(registrationId) ?? 0
      // Perfect when everyone plays an even number of games, off by one
      // otherwise, which is the best any schedule can do.
      expect(Math.abs(home - (gamesEach - home))).toBeLessThanOrEqual(1)
    }
  })

  it('leaves both participants known and nothing to advance', () => {
    for (const match of generate(count)) {
      expect(match.registration1Id).not.toBeNull()
      expect(match.registration2Id).not.toBeNull()
      expect(match.winnerTo).toBeNull()
      expect(match.loserTo).toBeNull()
      expect(match.bracketType).toBe('roundRobin')
      expect(match.group).toBeNull()
      expect(match.leg).toBe(1)
    }
  })

  it('numbers matches contiguously within each round', () => {
    for (const [, matches] of roundsOf(generate(count))) {
      const ordered = [...matches].sort(
        (a, b) => a.bracketPosition - b.bracketPosition
      )
      ordered.forEach((match, index) => {
        expect(match.bracketPosition).toBe(index)
        expect(match.matchNumber).toBe(index + 1)
      })
    }
  })
})

describe('seeded scheduling', () => {
  it.each([4, 5, 8, 9, 16])(
    'saves the top two seeds for the final round with %i participants',
    (count) => {
      const matches = generate(count)
      const lastRound = Math.max(...matches.map((m) => m.round))

      const headliner = matches.find(
        (m) =>
          [m.registration1Id, m.registration2Id].sort().join() ===
          ['player-1', 'player-2'].sort().join()
      )!

      expect(headliner.round).toBe(lastRound)
    }
  )

  it('opens with the widest mismatch', () => {
    const matches = generate(8)
    const openingRound = matches.filter((m) => m.round === 1)

    expect(pairingsOf(openingRound)).toContain('player-1 v player-8')
  })
})

describe('multiple legs', () => {
  it('plays every pairing once per leg', () => {
    const matches = generate(6, { legs: 2 })

    expect(matches).toHaveLength(30)
    const counts = new Map<string, number>()
    for (const pairing of pairingsOf(matches)) {
      counts.set(pairing, (counts.get(pairing) ?? 0) + 1)
    }
    for (const [, played] of counts) expect(played).toBe(2)
  })

  it('swaps the sides in the return leg', () => {
    const matches = generate(6, { legs: 2 })
    const firstLeg = matches.filter((m) => m.leg === 1)
    const secondLeg = matches.filter((m) => m.leg === 2)

    for (const home of firstLeg) {
      const reverse = secondLeg.find(
        (m) =>
          m.registration1Id === home.registration2Id &&
          m.registration2Id === home.registration1Id
      )
      expect(reverse, `return leg for ${home.id}`).toBeDefined()
    }
  })

  it('gives everyone an even split of sides over two legs', () => {
    const matches = generate(7, { legs: 2 })
    const firstNamed = new Map<string, number>()
    for (const match of matches) {
      const id = match.registration1Id!
      firstNamed.set(id, (firstNamed.get(id) ?? 0) + 1)
    }

    for (const { registrationId } of createParticipants(7)) {
      expect(firstNamed.get(registrationId)).toBe(6)
    }
  })

  it('continues round numbering across legs', () => {
    const matches = generate(4, { legs: 3 })
    const rounds = [...new Set(matches.map((m) => m.round))].sort(
      (a, b) => a - b
    )

    expect(rounds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(
      new Set(matches.filter((m) => m.round <= 3).map((m) => m.leg))
    ).toEqual(new Set([1]))
  })
})

describe('group stage', () => {
  it('spreads seeds across groups by snake seeding', () => {
    const matches = generate(8, { groupCount: 2 })

    const membersOf = (group: number) =>
      new Set(
        matches
          .filter((m) => m.group === group)
          .flatMap((m) => [m.registration1Id, m.registration2Id])
      )

    // Seeds 1 and 2 lead separate groups; 3 and 4 come back the other way.
    expect(membersOf(0)).toEqual(
      new Set(['player-1', 'player-4', 'player-5', 'player-8'])
    )
    expect(membersOf(1)).toEqual(
      new Set(['player-2', 'player-3', 'player-6', 'player-7'])
    )
  })

  it('keeps groups within one participant of each other', () => {
    const matches = generate(10, { groupCount: 3 })

    const sizes = [0, 1, 2].map(
      (group) =>
        new Set(
          matches
            .filter((m) => m.group === group)
            .flatMap((m) => [m.registration1Id, m.registration2Id])
        ).size
    )

    expect(sizes.sort()).toEqual([3, 3, 4])
  })

  it('never pairs participants from different groups', () => {
    const matches = generate(12, { groupCount: 4 })
    const groupOf = new Map<string, number>()

    for (const match of matches) {
      for (const id of [match.registration1Id!, match.registration2Id!]) {
        const known = groupOf.get(id)
        if (known === undefined) groupOf.set(id, match.group!)
        else expect(known).toBe(match.group)
      }
    }

    expect(groupOf.size).toBe(12)
  })

  it('numbers rounds from 1 within each group', () => {
    const matches = generate(11, { groupCount: 2 })

    for (const group of [0, 1]) {
      const rounds = [
        ...new Set(
          matches.filter((m) => m.group === group).map((m) => m.round)
        ),
      ].sort((a, b) => a - b)
      expect(rounds[0]).toBe(1)
      expect(rounds).toEqual(rounds.map((_, index) => index + 1))
    }
  })
})

describe('validation', () => {
  it('rejects fewer than 2 participants', () => {
    expect(() => generate(1)).toThrow('At least 2 participants required')
  })

  it('rejects a fractional number of legs', () => {
    expect(() => generate(4, { legs: 1.5 })).toThrow(
      'legs must be an integer of at least 1'
    )
  })

  it('rejects zero legs', () => {
    expect(() => generate(4, { legs: 0 })).toThrow(
      'legs must be an integer of at least 1'
    )
  })

  it('rejects more groups than participants can fill', () => {
    expect(() => generate(5, { groupCount: 3 })).toThrow(
      'leaves a group with fewer than 2 participants'
    )
  })

  it('rejects duplicate seeds', () => {
    expect(() =>
      generateRoundRobin({
        eventId: 'league-1',
        idFactory: createIdFactory(),
        participants: [
          { registrationId: 'a', seed: 1 },
          { registrationId: 'b', seed: 1 },
        ],
      })
    ).toThrow('Duplicate seed: 1')
  })

  it('rejects an idFactory that repeats ids', () => {
    expect(() =>
      generateRoundRobin({
        eventId: 'league-1',
        participants: createParticipants(4),
        idFactory: () => 'same-id',
      })
    ).toThrow('duplicate id')
  })
})
