import { describe, it, expect } from 'vitest'
import { generateDoubleElimination } from '../src'
import {
  chalk,
  createIdFactory,
  createParticipants,
  roundOf,
  seededPicker,
  simulate,
} from './helpers'

const generate = (count: number, overrides = {}) =>
  generateDoubleElimination({
    eventId: 'event-1',
    participants: createParticipants(count),
    idFactory: createIdFactory(),
    ...overrides,
  })

describe('grand final', () => {
  it('is absent by default', () => {
    const matches = generate(8)
    expect(matches.filter((m) => m.bracketType === 'grandFinal')).toHaveLength(
      0
    )
    expect(matches.filter((m) => m.bracketType === 'losers')).toHaveLength(5)
  })

  it('adds the losers final when enabled so the winners final loser drops', () => {
    const matches = generate(8, { grandFinal: 'single' })

    const losers = matches.filter((m) => m.bracketType === 'losers')
    // 8 players: winners 7 + losers 6 + grand final 1 = 2n - 2 matches.
    expect(losers).toHaveLength(6)
    expect(matches).toHaveLength(14)

    const winnersFinal = roundOf(matches, 'winners', 3)[0]
    const losersFinal = roundOf(matches, 'losers', 4)[0]

    expect(winnersFinal.loserTo).toBe(losersFinal.id)
    expect(winnersFinal.loserToSlot).toBe(2)
  })

  it('sends both bracket winners into the grand final', () => {
    const matches = generate(8, { grandFinal: 'single' })
    const grandFinal = matches.find((m) => m.bracketType === 'grandFinal')!
    const winnersFinal = roundOf(matches, 'winners', 3)[0]
    const losersFinal = roundOf(matches, 'losers', 4)[0]

    expect(winnersFinal.winnerTo).toBe(grandFinal.id)
    expect(winnersFinal.winnerToSlot).toBe(1)
    expect(losersFinal.winnerTo).toBe(grandFinal.id)
    expect(losersFinal.winnerToSlot).toBe(2)
    expect(grandFinal.winnerTo).toBeNull()
  })

  it('carries both finalists into the bracket reset match', () => {
    const matches = generate(8, { grandFinal: 'reset' })
    const grandFinals = matches
      .filter((m) => m.bracketType === 'grandFinal')
      .sort((a, b) => a.round - b.round)

    expect(grandFinals).toHaveLength(2)
    expect(grandFinals[0].winnerTo).toBe(grandFinals[1].id)
    expect(grandFinals[0].winnerToSlot).toBe(1)
    expect(grandFinals[0].loserTo).toBe(grandFinals[1].id)
    expect(grandFinals[0].loserToSlot).toBe(2)
    expect(grandFinals[1].winnerTo).toBeNull()
  })

  it('lets the winners bracket winner take the title in one match', () => {
    const matches = generate(8, { grandFinal: 'reset' })
    const { played, champion, losses } = simulate(matches, chalk)

    const reset = played.find(
      (p) => p.match.bracketType === 'grandFinal' && p.match.round === 2
    )

    // The top seed never loses, so the reset match is not needed.
    expect(champion).toBe('player-1')
    expect(reset).toBeUndefined()
    expect(losses.get('player-1') ?? 0).toBe(0)
  })

  it('plays the reset when the losers bracket representative wins', () => {
    // Search for an outcome where the losers bracket side wins the first final.
    let resetPlayed = false

    for (let seed = 1; seed <= 50 && !resetPlayed; seed++) {
      const { played, losses, champion } = simulate(
        generate(8, { grandFinal: 'reset' }),
        seededPicker(seed * 31)
      )
      const reset = played.find(
        (p) => p.match.bracketType === 'grandFinal' && p.match.round === 2
      )
      if (!reset) continue

      resetPlayed = true
      // Both finalists entered the reset with one loss each.
      expect(losses.get(champion!)).toBeLessThanOrEqual(1)
      expect(losses.get(reset.loser)).toBe(2)
    }

    expect(resetPlayed).toBe(true)
  })

  it('works with a delayed losers bracket', () => {
    const matches = generate(16, {
      losersStartRoundsBeforeFinal: 2,
      grandFinal: 'single',
    })

    const losers = matches.filter((m) => m.bracketType === 'losers')
    expect(losers).toHaveLength(6) // 2 + 2 + 1 + 1

    const { stalled, champion } = simulate(matches, seededPicker(11))
    expect(stalled).toEqual([])
    expect(champion).not.toBeNull()
  })
})
