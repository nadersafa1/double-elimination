import { describe, it, expect } from 'vitest'
import { generateDoubleElimination, type BracketMatch } from '../src'
import {
  chalk,
  createIdFactory,
  createParticipants,
  fedSlots,
  seededPicker,
  simulate,
} from './helpers'

const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 16, 17, 23, 32, 33, 48, 64]

const generate = (count: number, overrides = {}) =>
  generateDoubleElimination({
    eventId: 'event-1',
    participants: createParticipants(count),
    idFactory: createIdFactory(),
    ...overrides,
  })

/** Structural checks that must hold for every bracket the library produces. */
const expectWellFormed = (matches: BracketMatch[]) => {
  const byId = new Map(matches.map((m) => [m.id, m]))
  expect(byId.size).toBe(matches.length)

  const feederCount = new Map<string, number>()

  for (const match of matches) {
    const links: [string | null, number | null][] = [
      [match.winnerTo, match.winnerToSlot],
      [match.loserTo, match.loserToSlot],
    ]

    for (const [target, slot] of links) {
      if (target === null) {
        expect(slot).toBeNull()
        continue
      }
      expect(byId.has(target)).toBe(true)
      expect([1, 2]).toContain(slot)
      // A match never routes backwards into an already-decided round.
      const targetMatch = byId.get(target)!
      if (targetMatch.bracketType === match.bracketType) {
        expect(targetMatch.round).toBeGreaterThan(match.round)
      }
      const key = `${target}#${slot}`
      feederCount.set(key, (feederCount.get(key) ?? 0) + 1)
    }
  }

  // Two matches feeding one slot would silently overwrite a player.
  for (const [slot, count] of feederCount) {
    expect(`${slot} has ${count} feeder(s)`).toBe(`${slot} has 1 feeder(s)`)
  }
}

describe.each(SIZES)('bracket invariants for %i participants', (count) => {
  it('is structurally well formed', () => {
    expectWellFormed(generate(count))
    if (count >= 3) expectWellFormed(generate(count, { grandFinal: 'reset' }))
  })

  it('places every participant exactly once', () => {
    const matches = generate(count)
    const placed = matches
      .filter((m) => m.bracketType === 'winners' && m.round === 1)
      .flatMap((m) => [m.registration1Id, m.registration2Id])
      .filter((id): id is string => id !== null)

    expect(new Set(placed).size).toBe(count)
    expect(placed).toHaveLength(count)
  })

  it('runs to completion without stalling on a missing opponent', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const matches = generate(count)
      const result = simulate(matches, seededPicker(seed))
      expect(result.stalled).toEqual([])
      expect(result.champion).not.toBeNull()
    }
  })

  it('runs to completion with a grand final and bracket reset', () => {
    if (count < 3) return
    for (const seed of [1, 7, 99]) {
      const matches = generate(count, { grandFinal: 'reset' })
      const result = simulate(matches, seededPicker(seed))
      expect(result.stalled).toEqual([])
      expect(result.champion).not.toBeNull()
    }
  })

  it('eliminates everyone but the champion after exactly two losses', () => {
    if (count < 3) return
    for (const seed of [1, 7, 99, 12345]) {
      const matches = generate(count, { grandFinal: 'reset' })
      const { losses, champion } = simulate(matches, seededPicker(seed))

      const survivors = createParticipants(count)
        .map((p) => p.registrationId)
        .filter((id) => (losses.get(id) ?? 0) < 2)

      expect(survivors).toEqual([champion])
      for (const [, count_] of losses) expect(count_).toBeLessThanOrEqual(2)
    }
  })

  it('leaves exactly three players standing without a grand final', () => {
    if (count < 4) return
    const matches = generate(count)
    const { losses } = simulate(matches, seededPicker(31))

    // Champion (0 losses), runner-up and losers bracket winner (1 loss each).
    const survivors = createParticipants(count)
      .map((p) => p.registrationId)
      .filter((id) => (losses.get(id) ?? 0) < 2)

    expect(survivors).toHaveLength(3)
  })

  it('never routes a walkover winner into a match that cannot be reached', () => {
    const matches = generate(count)
    const fed = fedSlots(matches)

    for (const match of matches) {
      const abandoned =
        match.registration1Id === null &&
        match.registration2Id === null &&
        !fed.has(`${match.id}#1`) &&
        !fed.has(`${match.id}#2`)

      // An unreachable match must not claim to send anyone anywhere.
      if (abandoned) {
        expect(match.winnerTo).toBeNull()
        expect(match.loserTo).toBeNull()
      }
    }
  })
})

describe('seeding', () => {
  it.each([4, 8, 16, 32, 64])(
    'sends the top two seeds to the winners final for %i participants',
    (count) => {
      const matches = generate(count)
      const { played } = simulate(matches, chalk)

      const winnersFinal = played.find(
        (p) =>
          p.match.bracketType === 'winners' &&
          p.match.round === Math.log2(count)
      )

      expect(winnersFinal).toBeDefined()
      expect([winnersFinal!.winner, winnersFinal!.loser].sort()).toEqual([
        'player-1',
        'player-2',
      ])
    }
  )

  it('gives the top seeds the byes', () => {
    const matches = generate(5)
    const byes = matches.filter(
      (m) =>
        m.bracketType === 'winners' &&
        m.round === 1 &&
        (m.registration1Id === null) !== (m.registration2Id === null)
    )

    const advanced = byes.map((m) => m.registration1Id ?? m.registration2Id)
    expect(advanced.sort()).toEqual(['player-1', 'player-2', 'player-3'])
  })
})

describe('rematch prevention', () => {
  // Rematches cannot be eliminated entirely, but they must stay rare and late.
  it.each([
    [16, 4],
    [32, 5],
    [64, 7],
  ])(
    'keeps rematches out of the early losers rounds for %i participants',
    (count, earliestAllowedRound) => {
      let total = 0
      let earliest = Number.POSITIVE_INFINITY

      for (let seed = 1; seed <= 200; seed++) {
        const { rematches } = simulate(
          generate(count),
          seededPicker(seed * 7919)
        )
        total += rematches.length
        for (const rematch of rematches) {
          earliest = Math.min(earliest, rematch.round)
        }
      }

      expect(earliest).toBeGreaterThanOrEqual(earliestAllowedRound)
      expect(total / 200).toBeLessThan(1)
    }
  )
})

describe('performance', () => {
  it('generates an 8192 player bracket without quadratic blowup', () => {
    const start = performance.now()
    generate(8192)
    const elapsed = performance.now() - start

    // ~70ms on a laptop. The bound is deliberately loose so a shared CI runner
    // does not flake, while still catching an accidental O(n^2) rewrite, which
    // costs seconds at this size.
    expect(elapsed).toBeLessThan(3000)
  })
})
