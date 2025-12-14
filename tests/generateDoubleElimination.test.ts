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

  it('seeds 1 and 2 are in opposite halves for 32 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(32),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const round1 = winners
      .filter((m) => m.round === 1)
      .sort((a, b) => a.matchNumber - b.matchNumber)

    // Find which match position has seed 1 and seed 2
    const seed1MatchIdx = round1.findIndex(
      (m) =>
        m.registration1Id === 'player-1' || m.registration2Id === 'player-1'
    )
    const seed2MatchIdx = round1.findIndex(
      (m) =>
        m.registration1Id === 'player-2' || m.registration2Id === 'player-2'
    )

    // Seed 1 should be in top half (matches 0-7)
    // Seed 2 should be in bottom half (matches 8-15)
    expect(seed1MatchIdx).toBeGreaterThanOrEqual(0)
    expect(seed1MatchIdx).toBeLessThan(8)
    expect(seed2MatchIdx).toBeGreaterThanOrEqual(8)
    expect(seed2MatchIdx).toBeLessThan(16)
  })

  it('seeds 1, 2, 3, 4 are in different quarters for 32 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(32),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const round1 = winners
      .filter((m) => m.round === 1)
      .sort((a, b) => a.matchNumber - b.matchNumber)

    const findSeedQuarter = (seed: number) => {
      const matchIdx = round1.findIndex(
        (m) =>
          m.registration1Id === `player-${seed}` ||
          m.registration2Id === `player-${seed}`
      )
      return Math.floor(matchIdx / 4) // 0-3 = Q0, 4-7 = Q1, 8-11 = Q2, 12-15 = Q3
    }

    const quarters = [
      findSeedQuarter(1),
      findSeedQuarter(2),
      findSeedQuarter(3),
      findSeedQuarter(4),
    ]

    // All 4 seeds should be in different quarters
    const uniqueQuarters = new Set(quarters)
    expect(uniqueQuarters.size).toBe(4)
  })
})

describe('delayed losers bracket', () => {
  it('generates compressed LB for 16 participants with losersStartRoundsBeforeFinal=2', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(16),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 2,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // 16 participants: 4 WB rounds (8+4+2+1=15 matches)
    expect(winners).toHaveLength(15)

    // With losersStartRoundsBeforeFinal=2:
    // LB rounds = 2 * 2 - 1 = 3
    // LB R1: 2 matches, LB R2: 2 matches, LB R3: 1 match = 5 total
    expect(losers).toHaveLength(5)
  })

  it('only routes losers from QF onwards (16 players, startRounds=2)', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(16),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 2,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')

    // Round 1 (Ro16) losers should NOT route to LB (single elimination)
    const wbR1 = winners.filter((m) => m.round === 1)
    wbR1.forEach((m) => {
      expect(m.loserTo).toBeNull()
    })

    // Round 2 (QF) losers SHOULD route to LB
    const wbR2 = winners.filter((m) => m.round === 2)
    wbR2.forEach((m) => {
      expect(m.loserTo).not.toBeNull()
    })

    // Round 3 (SF) losers SHOULD route to LB
    const wbR3 = winners.filter((m) => m.round === 3)
    wbR3.forEach((m) => {
      expect(m.loserTo).not.toBeNull()
    })

    // Round 4 (Finals) loser should NOT route (2nd place)
    const wbR4 = winners.filter((m) => m.round === 4)
    wbR4.forEach((m) => {
      expect(m.loserTo).toBeNull()
    })
  })

  it('routes QF losers to LB R1 correctly', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(16),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 2,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    const wbR2 = winners.filter((m) => m.round === 2)
    const lbR1 = losers.filter((m) => m.round === 1)

    // QF match 0 and 1 losers → LB R1 match 0
    expect(wbR2[0]?.loserTo).toBe(lbR1[0]?.id)
    expect(wbR2[0]?.loserToSlot).toBe(1)
    expect(wbR2[1]?.loserTo).toBe(lbR1[0]?.id)
    expect(wbR2[1]?.loserToSlot).toBe(2)

    // QF match 2 and 3 losers → LB R1 match 1
    expect(wbR2[2]?.loserTo).toBe(lbR1[1]?.id)
    expect(wbR2[2]?.loserToSlot).toBe(1)
    expect(wbR2[3]?.loserTo).toBe(lbR1[1]?.id)
    expect(wbR2[3]?.loserToSlot).toBe(2)
  })

  it('routes SF losers to LB R2 correctly (mirrored to avoid rematches)', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(16),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 2,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    const wbR3 = winners.filter((m) => m.round === 3)
    const lbR2 = losers.filter((m) => m.round === 2)

    // SF match 0 loser → LB R2 match 1 (mirrored position) slot 2
    expect(wbR3[0]?.loserTo).toBe(lbR2[1]?.id)
    expect(wbR3[0]?.loserToSlot).toBe(2)

    // SF match 1 loser → LB R2 match 0 (mirrored position) slot 2
    expect(wbR3[1]?.loserTo).toBe(lbR2[0]?.id)
    expect(wbR3[1]?.loserToSlot).toBe(2)
  })

  it('behaves as full double elim when losersStartRoundsBeforeFinal equals WB rounds - 1', () => {
    // For 8 participants with 3 WB rounds, setting losersStartRoundsBeforeFinal=2
    // should be equivalent to full double elim (all rounds except finals feed LB)
    const fullDoubleElim = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
    })

    const delayedStart = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 2, // 3 WB rounds - 1 = 2
    })

    const fullLosers = fullDoubleElim.filter((m) => m.bracketType === 'losers')
    const delayedLosers = delayedStart.filter((m) => m.bracketType === 'losers')

    // Should have same number of losers matches
    expect(delayedLosers).toHaveLength(fullLosers.length)
  })

  it('allows losersStartRoundsBeforeFinal=1 (single elim with 3rd place match)', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 1,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // Should have winners bracket (7 matches for 8 participants)
    expect(winners).toHaveLength(7)

    // Should have only 1 losers match (3rd place)
    expect(losers).toHaveLength(1)

    // Only semifinal losers should route to LB
    const wbR2 = winners.filter((m) => m.round === 2) // Semifinals
    wbR2.forEach((m) => {
      expect(m.loserTo).not.toBeNull()
    })

    // Round 1 losers should NOT route to LB
    const wbR1 = winners.filter((m) => m.round === 1)
    wbR1.forEach((m) => {
      expect(m.loserTo).toBeNull()
    })
  })

  it('allows losersStartRoundsBeforeFinal=0 (pure single elimination)', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 0,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // Should have winners bracket only
    expect(winners).toHaveLength(7)
    expect(losers).toHaveLength(0)

    // No losers should route to LB
    winners.forEach((m) => {
      expect(m.loserTo).toBeNull()
    })
  })

  it('allows losersStartRoundsBeforeFinal=0 with 2 participants (minimum case)', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(2),
      idFactory: createIdFactory(),
      losersStartRoundsBeforeFinal: 0,
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // Should have winners bracket only (1 match for 2 participants)
    expect(winners).toHaveLength(1)
    expect(losers).toHaveLength(0)

    // No losers should route to LB
    winners.forEach((m) => {
      expect(m.loserTo).toBeNull()
    })
  })

  it('throws error for losersStartRoundsBeforeFinal=1 with fewer than 4 participants', () => {
    expect(() =>
      generateDoubleElimination({
        eventId: 'event-1',
        participants: createParticipants(2), // Only 2 participants = 1 WB round
        idFactory: createIdFactory(),
        losersStartRoundsBeforeFinal: 1,
      })
    ).toThrow('losersStartRoundsBeforeFinal=1 requires at least 4 participants')
  })

  it('throws error if losersStartRoundsBeforeFinal >= winnersRounds', () => {
    expect(() =>
      generateDoubleElimination({
        eventId: 'event-1',
        participants: createParticipants(8), // 3 WB rounds
        idFactory: createIdFactory(),
        losersStartRoundsBeforeFinal: 3, // equals winnersRounds
      })
    ).toThrow('losersStartRoundsBeforeFinal must be less than winnersRounds')
  })

})

describe('rematch prevention', () => {
  it('routes WB Round 2 losers with reversed positions for 8 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(8),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    const wbR2 = winners
      .filter((m) => m.round === 2)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
    const lbR2 = losers
      .filter((m) => m.round === 2)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)

    // WB R2 has 2 matches (positions 0 and 1)
    // With reversal: WB R2 pos 0 → LB R2 pos 1, WB R2 pos 1 → LB R2 pos 0
    expect(wbR2[0]?.loserTo).toBe(lbR2[1]?.id)
    expect(wbR2[0]?.loserToSlot).toBe(2)
    expect(wbR2[1]?.loserTo).toBe(lbR2[0]?.id)
    expect(wbR2[1]?.loserToSlot).toBe(2)
  })

  it('routes WB Round 2 losers with reversed positions for 32 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(32),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    const wbR2 = winners
      .filter((m) => m.round === 2)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
    const lbR2 = losers
      .filter((m) => m.round === 2)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)

    // WB R2 has 8 matches (positions 0-7)
    // With reversal: WB R2 pos 0 → LB R2 pos 7, WB R2 pos 7 → LB R2 pos 0
    const totalMatches = wbR2.length
    expect(wbR2[0]?.loserTo).toBe(lbR2[totalMatches - 1]?.id)
    expect(wbR2[0]?.loserToSlot).toBe(2)
    expect(wbR2[totalMatches - 1]?.loserTo).toBe(lbR2[0]?.id)
    expect(wbR2[totalMatches - 1]?.loserToSlot).toBe(2)

    // Verify middle positions are also reversed
    const midPos = Math.floor(totalMatches / 2)
    expect(wbR2[midPos]?.loserTo).toBe(lbR2[totalMatches - 1 - midPos]?.id)
  })

  it('routes WB Round 3+ losers with same positions (not mirrored) for 32 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(32),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    const wbR3 = winners
      .filter((m) => m.round === 3)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
    const lbR4 = losers
      .filter((m) => m.round === 4)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)

    // WB R3 has 4 matches (positions 0-3)
    // Should use same positions: WB R3 pos 0 → LB R4 pos 0, etc.
    for (let i = 0; i < wbR3.length; i++) {
      expect(wbR3[i]?.loserTo).toBe(lbR4[i]?.id)
      expect(wbR3[i]?.loserToSlot).toBe(2)
    }

    // Verify Round 4 as well
    const wbR4 = winners
      .filter((m) => m.round === 4)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)
    const lbR6 = losers
      .filter((m) => m.round === 6)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)

    // WB R4 has 2 matches (positions 0-1)
    // Should use same positions
    for (let i = 0; i < wbR4.length; i++) {
      expect(wbR4[i]?.loserTo).toBe(lbR6[i]?.id)
      expect(wbR4[i]?.loserToSlot).toBe(2)
    }
  })

  it('prevents early rematches by ensuring Round 2 reversal separates bracket halves', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(16),
      idFactory: createIdFactory(),
    })

    const winners = matches.filter((m) => m.bracketType === 'winners')
    const losers = matches.filter((m) => m.bracketType === 'losers')

    // Track which players are in top half vs bottom half of WB R2
    const wbR2 = winners
      .filter((m) => m.round === 2)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)

    // Top half of WB R2 (positions 0-1) should go to bottom half of LB R2
    // Bottom half of WB R2 (positions 2-3) should go to top half of LB R2
    const lbR2 = losers
      .filter((m) => m.round === 2)
      .sort((a, b) => a.bracketPosition - b.bracketPosition)

    // Verify reversal: top WB → bottom LB, bottom WB → top LB
    const totalMatches = wbR2.length
    expect(wbR2[0]?.loserTo).toBe(lbR2[totalMatches - 1]?.id) // Top → Bottom
    expect(wbR2[totalMatches - 1]?.loserTo).toBe(lbR2[0]?.id) // Bottom → Top
  })

  it('generates correct losers bracket match counts for 32 participants', () => {
    const matches = generateDoubleElimination({
      eventId: 'event-1',
      participants: createParticipants(32),
      idFactory: createIdFactory(),
    })

    const losers = matches
      .filter((m) => m.bracketType === 'losers')
      .sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round
        return a.bracketPosition - b.bracketPosition
      })

    // Expected: R1: 8, R2: 8, R3: 4, R4: 4, R5: 2, R6: 2, R7: 1
    const roundCounts = new Map<number, number>()
    for (const match of losers) {
      roundCounts.set(match.round, (roundCounts.get(match.round) || 0) + 1)
    }

    expect(roundCounts.get(1)).toBe(8)
    expect(roundCounts.get(2)).toBe(8)
    expect(roundCounts.get(3)).toBe(4)
    expect(roundCounts.get(4)).toBe(4)
    expect(roundCounts.get(5)).toBe(2)
    expect(roundCounts.get(6)).toBe(2)
    expect(roundCounts.get(7)).toBe(1)
  })
})
