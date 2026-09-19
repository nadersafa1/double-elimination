import { describe, it, expect } from 'vitest'
import { generateDoubleElimination } from '../src'
import { createIdFactory, createParticipants, roundOf } from './helpers'

const base = {
  eventId: 'event-1',
  participants: createParticipants(8),
  idFactory: createIdFactory(),
}

describe('option validation', () => {
  it('rejects fewer than 2 participants', () => {
    expect(() =>
      generateDoubleElimination({
        ...base,
        participants: createParticipants(1),
      })
    ).toThrow('At least 2 participants required')
  })

  it('rejects a missing eventId', () => {
    expect(() => generateDoubleElimination({ ...base, eventId: '' })).toThrow(
      'eventId must be a non-empty string'
    )
  })

  it('rejects an idFactory that is not a function', () => {
    expect(() =>
      // @ts-expect-error deliberately wrong type
      generateDoubleElimination({ ...base, idFactory: 'nope' })
    ).toThrow('idFactory must be a function')
  })

  it('rejects an idFactory that repeats ids', () => {
    expect(() =>
      generateDoubleElimination({ ...base, idFactory: () => 'same-id' })
    ).toThrow('duplicate id')
  })

  it('rejects duplicate seeds', () => {
    expect(() =>
      generateDoubleElimination({
        ...base,
        participants: [
          { registrationId: 'a', seed: 1 },
          { registrationId: 'b', seed: 1 },
        ],
      })
    ).toThrow('Duplicate seed: 1')
  })

  it('rejects duplicate registration ids', () => {
    expect(() =>
      generateDoubleElimination({
        ...base,
        participants: [
          { registrationId: 'a', seed: 1 },
          { registrationId: 'a', seed: 2 },
        ],
      })
    ).toThrow('Duplicate registrationId: "a"')
  })

  it('rejects non-numeric seeds', () => {
    expect(() =>
      generateDoubleElimination({
        ...base,
        participants: [
          { registrationId: 'a', seed: 1 },
          // @ts-expect-error deliberately wrong type
          { registrationId: 'b', seed: 'two' },
        ],
      })
    ).toThrow('non-numeric seed')
  })

  it('rejects a fractional losersStartRoundsBeforeFinal', () => {
    expect(() =>
      generateDoubleElimination({ ...base, losersStartRoundsBeforeFinal: 1.5 })
    ).toThrow('non-negative integer')
  })

  it('rejects an unknown grandFinal format', () => {
    expect(() =>
      // @ts-expect-error deliberately wrong type
      generateDoubleElimination({ ...base, grandFinal: 'bracket-reset' })
    ).toThrow("grandFinal must be 'none', 'single' or 'reset'")
  })

  it('rejects a grand final without a losers bracket', () => {
    expect(() =>
      generateDoubleElimination({
        ...base,
        losersStartRoundsBeforeFinal: 0,
        grandFinal: 'single',
      })
    ).toThrow('grandFinal requires a losers bracket')
  })
})

describe('seed normalization', () => {
  it('ranks arbitrary ascending seeds instead of dropping participants', () => {
    const matches = generateDoubleElimination({
      ...base,
      idFactory: createIdFactory(),
      participants: [
        { registrationId: 'a', seed: 10 },
        { registrationId: 'b', seed: 20 },
        { registrationId: 'c', seed: 30 },
        { registrationId: 'd', seed: 40 },
      ],
    })

    const placed = roundOf(matches, 'winners', 1).flatMap((m) => [
      m.registration1Id,
      m.registration2Id,
    ])

    expect(placed).toEqual(['a', 'd', 'b', 'c'])
  })

  it('seeds identically whatever order participants arrive in', () => {
    const ordered = generateDoubleElimination({
      ...base,
      idFactory: createIdFactory(),
      participants: createParticipants(8),
    })
    const shuffled = generateDoubleElimination({
      ...base,
      idFactory: createIdFactory(),
      participants: [...createParticipants(8)].reverse(),
    })

    const layout = (matches: typeof ordered) =>
      roundOf(matches, 'winners', 1).map((m) => [
        m.registration1Id,
        m.registration2Id,
      ])

    expect(layout(shuffled)).toEqual(layout(ordered))
  })
})
