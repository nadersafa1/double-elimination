import { describe, it, expect } from 'vitest'
import { generateDoubleElimination, Participant } from '../src'

const createIdFactory = () => {
  let counter = 0
  return () => `match-${++counter}`
}

const createParticipants = (count: number): Participant[] =>
  Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))

describe('generateDoubleElimination', () => {
  it('throws if fewer than 2 participants', () => {
    expect(() =>
      generateDoubleElimination({
        eventId: 'event-1',
        participants: [{ registrationId: 'p1', seed: 1 }],
        idFactory: createIdFactory(),
      })
    ).toThrow('At least 2 participants required')
  })

  it('generates correct structure for 8 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // 8 participants: 3 winners rounds (4+2+1=7), 3 losers rounds (2+2+1=5)
    // No grand finals: WB finals determines 1st/2nd, LB finals determines 3rd/4th
    expect(winners).toHaveLength(7)
    expect(losers).toHaveLength(5)
  })

  it('generates correct structure for 7 participants with bye', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(7),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const round1 = winners.filter((m) => m.round === 1)

    // One match should have auto-advanced (seed 1 has bye)
    const byeMatch = round1.find(
      (m) => m.registration1Id !== null && m.registration2Id === null
    )
    expect(byeMatch).toBeDefined()
  })

  it('correctly wires winner routing in winners bracket', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const round1 = winners.filter((m) => m.round === 1)
    const round2 = winners.filter((m) => m.round === 2)

    // Match 0 and 1 from round 1 should both go to round 2 match 0
    const r1m0 = round1.find((m) => m.bracketPosition === 0)
    const r1m1 = round1.find((m) => m.bracketPosition === 1)
    const r2m0 = round2.find((m) => m.bracketPosition === 0)

    expect(r1m0?.winnerTo).toBe(r2m0?.id)
    expect(r1m0?.winnerToSlot).toBe(1)
    expect(r1m1?.winnerTo).toBe(r2m0?.id)
    expect(r1m1?.winnerToSlot).toBe(2)
  })

  it('correctly wires loser routing to losers bracket', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // WB Round 1 losers go to LB Round 1
    const wbR1 = winners.filter((m) => m.round === 1)
    const lbR1 = losers.filter((m) => m.round === 1)

    // First 2 WB R1 matches go to LB R1 M0
    expect(wbR1[0]?.loserTo).toBe(lbR1[0]?.id)
    expect(wbR1[1]?.loserTo).toBe(lbR1[0]?.id)
  })

  it('auto-advances byes in round 1', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(5),
      idFactory: createIdFactory(),
    })

    // With 5 participants in bracket of 8, we have 3 byes
    const winners = matches.filter((m) => m.bracketType === 'winners')
    const round2 = winners.filter((m) => m.round === 2)

    // Check that some players were auto-advanced to round 2
    const advancedCount = round2.filter(
      (m) => m.registration1Id !== null || m.registration2Id !== null
    ).length
    expect(advancedCount).toBeGreaterThan(0)
  })
})
