import { describe, it, expect } from 'vitest'
import { generateDoubleElimination } from '../src'
import {
  createIdFactory,
  createParticipants,
  fedSlots,
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

describe('bye handling', () => {
  it('auto-advances a first round bye', () => {
    const matches = generate(7)
    const wbR1 = roundOf(matches, 'winners', 1)
    const wbR2 = roundOf(matches, 'winners', 2)

    const byeMatch = wbR1.find((m) => m.registration2Id === null)!
    expect(byeMatch.registration1Id).toBe('player-1')

    const target = wbR2.find((m) => m.id === byeMatch.winnerTo)!
    const slot =
      byeMatch.winnerToSlot === 1
        ? target.registration1Id
        : target.registration2Id
    expect(slot).toBe('player-1')
  })

  it('does not send a loser out of a match nobody played', () => {
    const matches = generate(7)
    const byeMatch = roundOf(matches, 'winners', 1).find(
      (m) => m.registration2Id === null
    )!

    // A walkover produces no loser, so it must not reserve a losers bracket slot.
    expect(byeMatch.loserTo).toBeNull()
    expect(byeMatch.loserToSlot).toBeNull()
  })

  it('routes past losers bracket matches that can only ever have one player', () => {
    // 5 of 8: three byes, so the losers bracket receives only three players.
    const matches = generate(5)
    const wbR1 = roundOf(matches, 'winners', 1)
    const lbR1 = roundOf(matches, 'losers', 1)
    const lbR2 = roundOf(matches, 'losers', 2)

    const contested = wbR1.find(
      (m) => m.registration1Id !== null && m.registration2Id !== null
    )!

    // Its loser is the only entrant LB round 1 would get, so it skips ahead.
    expect(contested.loserTo).not.toBeNull()
    const target = matches.find((m) => m.id === contested.loserTo)!
    expect(target.round).toBe(2)
    expect(lbR2.map((m) => m.id)).toContain(target.id)

    // The bypassed matches stay in place but lead nowhere.
    const unreachable = lbR1.filter((m) => {
      const fed = fedSlots(matches)
      return !fed.has(`${m.id}#1`) && !fed.has(`${m.id}#2`)
    })
    expect(unreachable.length).toBeGreaterThan(0)
    for (const match of unreachable) {
      expect(match.winnerTo).toBeNull()
      expect(match.registration1Id).toBeNull()
      expect(match.registration2Id).toBeNull()
    }
  })

  it('marks a walkover whose entrant is not yet known', () => {
    // 3 players: seed 1 has a bye, so only one player loses a semifinal and
    // the third place match can never be contested.
    const matches = generate(3)
    const fed = fedSlots(matches)

    const willFill = (match: (typeof matches)[number], slot: 1 | 2) =>
      (slot === 1 ? match.registration1Id : match.registration2Id) !== null ||
      fed.has(`${match.id}#${slot}`)

    const thirdPlace = matches.find((m) => m.bracketType === 'losers')!

    // Exactly one side can arrive, so consumers can tell this apart from a
    // match that is merely waiting on an earlier round.
    expect(willFill(thirdPlace, 1) !== willFill(thirdPlace, 2)).toBe(true)
    expect(thirdPlace.winnerTo).toBeNull()
  })

  it.each([3, 5, 6, 7, 9, 11, 23, 33])(
    'completes the losers bracket with %i participants',
    (count) => {
      const { stalled, champion } = simulate(
        generate(count),
        seededPicker(2024)
      )
      expect(stalled).toEqual([])
      expect(champion).not.toBeNull()
    }
  )

  it('keeps the losers bracket playable with a grand final', () => {
    const { stalled, losses, champion } = simulate(
      generate(11, { grandFinal: 'reset' }),
      seededPicker(5)
    )

    expect(stalled).toEqual([])
    const survivors = createParticipants(11)
      .map((p) => p.registrationId)
      .filter((id) => (losses.get(id) ?? 0) < 2)
    expect(survivors).toEqual([champion])
  })
})
