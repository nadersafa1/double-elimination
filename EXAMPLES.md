# Examples

This document provides comprehensive examples of using the `double-elimination` package for various tournament scenarios.

## Table of Contents

- [Basic Tournament Setup](#basic-tournament-setup)
- [Small Tournament (4-8 Participants)](#small-tournament-4-8-participants)
- [Medium Tournament (16-32 Participants)](#medium-tournament-16-32-participants)
- [Large Tournament (64+ Participants)](#large-tournament-64-participants)
- [Single Elimination Mode](#single-elimination-mode)
- [Delayed Losers Bracket](#delayed-losers-bracket)
- [Handling Odd Participant Counts](#handling-odd-participant-counts)
- [Grand Final](#grand-final)
- [Integration with Database](#integration-with-database)
- [Visualizing Brackets](#visualizing-brackets)
- [Custom ID Generation](#custom-id-generation)

## Basic Tournament Setup

### Simple 8-Player Tournament

```typescript
import { generateDoubleElimination } from 'double-elimination'

const participants = [
  { registrationId: 'player-1', seed: 1 },
  { registrationId: 'player-2', seed: 2 },
  { registrationId: 'player-3', seed: 3 },
  { registrationId: 'player-4', seed: 4 },
  { registrationId: 'player-5', seed: 5 },
  { registrationId: 'player-6', seed: 6 },
  { registrationId: 'player-7', seed: 7 },
  { registrationId: 'player-8', seed: 8 },
]

const matches = generateDoubleElimination({
  eventId: 'tournament-2024-01',
  participants,
  idFactory: () => crypto.randomUUID(),
})

console.log(`Generated ${matches.length} matches`)
// Output: Generated 12 matches

// Filter winners bracket matches
const winnersMatches = matches.filter((m) => m.bracketType === 'winners')
console.log(`Winners bracket: ${winnersMatches.length} matches`)
// Output: Winners bracket: 7 matches

// Filter losers bracket matches
const losersMatches = matches.filter((m) => m.bracketType === 'losers')
console.log(`Losers bracket: ${losersMatches.length} matches`)
// Output: Losers bracket: 5 matches
```

## Small Tournament (4-8 Participants)

### 4-Player Tournament

Perfect for small local tournaments or testing:

```typescript
const smallTournament = generateDoubleElimination({
  eventId: 'local-tournament',
  participants: [
    { registrationId: 'alice', seed: 1 },
    { registrationId: 'bob', seed: 2 },
    { registrationId: 'charlie', seed: 3 },
    { registrationId: 'diana', seed: 4 },
  ],
  idFactory: () => crypto.randomUUID(),
})

// Get first round matches
const round1 = smallTournament.filter(
  (m) => m.round === 1 && m.bracketType === 'winners',
)
console.log('Round 1 matchups:')
round1.forEach((match) => {
  console.log(`  ${match.registration1Id} vs ${match.registration2Id}`)
})
// Output:
//   alice vs diana
//   bob vs charlie
```

## Medium Tournament (16-32 Participants)

### 16-Player Esports Tournament

```typescript
// Generate participants from team data
const teams = [
  { id: 'team-alpha', rank: 1 },
  { id: 'team-beta', rank: 2 },
  { id: 'team-gamma', rank: 3 },
  // ... 13 more teams
]

const participants = teams.map((team) => ({
  registrationId: team.id,
  seed: team.rank,
}))

const esportsBracket = generateDoubleElimination({
  eventId: 'esports-championship-2024',
  participants,
  idFactory: () => crypto.randomUUID(),
})

// Organize matches by round
const matchesByRound = esportsBracket.reduce(
  (acc, match) => {
    const key = `${match.bracketType}-round-${match.round}`
    if (!acc[key]) acc[key] = []
    acc[key].push(match)
    return acc
  },
  {} as Record<string, typeof esportsBracket>,
)

console.log('Tournament structure:')
Object.keys(matchesByRound).forEach((key) => {
  console.log(`  ${key}: ${matchesByRound[key].length} matches`)
})
```

### 32-Player Tournament

```typescript
// Create 32 participants
const createParticipants = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))
}

const largeBracket = generateDoubleElimination({
  eventId: 'mega-tournament',
  participants: createParticipants(32),
  idFactory: () => crypto.randomUUID(),
})

console.log(`Total matches: ${largeBracket.length}`)
// Output: Total matches: 60 (31 winners + 29 losers)
```

## Large Tournament (64+ Participants)

### 64-Player Championship

```typescript
const championship = generateDoubleElimination({
  eventId: 'world-championship-2024',
  participants: createParticipants(64),
  idFactory: () => crypto.randomUUID(),
})

// Calculate tournament statistics
const stats = {
  totalMatches: championship.length,
  winnersMatches: championship.filter((m) => m.bracketType === 'winners')
    .length,
  losersMatches: championship.filter((m) => m.bracketType === 'losers').length,
  totalRounds: Math.max(...championship.map((m) => m.round)),
}

console.log('Tournament Statistics:', stats)
// Output:
// {
//   totalMatches: 124,
//   winnersMatches: 63,
//   losersMatches: 61,
//   totalRounds: 9   // the losers bracket runs 9 rounds; the winners bracket 6
// }
```

## Single Elimination Mode

### Pure Single Elimination

No losers bracket - one loss and you're out:

```typescript
const singleElimination = generateDoubleElimination({
  eventId: 'single-elim-tournament',
  participants: createParticipants(16),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 0, // No losers bracket
})

// Only winners bracket matches exist
const allWinners = singleElimination.every((m) => m.bracketType === 'winners')
console.log(`All matches are winners bracket: ${allWinners}`)
// Output: All matches are winners bracket: true
```

### Single Elimination with 3rd Place Match

Only semifinal losers compete for 3rd place:

```typescript
const withThirdPlace = generateDoubleElimination({
  eventId: 'tournament-with-third',
  participants: createParticipants(8),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 1, // Only semifinal losers
})

// Check losers bracket exists
const hasLosersBracket = withThirdPlace.some((m) => m.bracketType === 'losers')
console.log(`Has losers bracket: ${hasLosersBracket}`)
// Output: Has losers bracket: true
```

## Delayed Losers Bracket

### 16-Player Tournament with Delayed LB

Losers bracket starts at quarterfinals:

```typescript
const delayedLB = generateDoubleElimination({
  eventId: 'delayed-lb-tournament',
  participants: createParticipants(16),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 2, // QF and SF losers go to LB
})

// Round 1 losers are eliminated (no LB matches for them)
const round1Losers = delayedLB.filter(
  (m) => m.round === 1 && m.bracketType === 'winners',
)
console.log(`Round 1 matches: ${round1Losers.length}`)
// Round 1 losers don't have corresponding LB matches
```

## Handling Odd Participant Counts

### Tournament with 7 Participants

Byes are resolved at generation time, so nothing in the bracket waits on a
player who does not exist:

```typescript
const oddCount = generateDoubleElimination({
  eventId: 'odd-participants',
  participants: createParticipants(7), // 7 players, bracket size = 8
  idFactory: () => crypto.randomUUID(),
})

// A bye is a first round match with exactly one participant.
const byes = oddCount.filter(
  (m) =>
    m.bracketType === 'winners' &&
    m.round === 1 &&
    (m.registration1Id === null) !== (m.registration2Id === null),
)

console.log(`Byes: ${byes.length}`)
// Output: Byes: 1 (seed 1 gets a bye in round 1)

// The bye winner is already placed in the next round, and the match produces
// no loser, so it does not hold a losers bracket slot.
console.log(byes[0].loserTo) // null
```

### Tournament with 13 Participants

```typescript
const thirteenPlayers = generateDoubleElimination({
  eventId: 'thirteen-players',
  participants: createParticipants(13), // 13 players, bracket size = 16
  idFactory: () => crypto.randomUUID(),
})

const byes = thirteenPlayers.filter(
  (m) =>
    m.bracketType === 'winners' &&
    m.round === 1 &&
    (m.registration1Id === null) !== (m.registration2Id === null),
)

console.log(`Byes: ${byes.length}`)
// Output: Byes: 3 (seeds 1, 2, 3 get byes)
```

### Telling "waiting" apart from "never happening"

With byes, some losers bracket matches cannot be reached at all. They stay in
the array so positions remain stable, but they carry no routing:

```typescript
const fed = new Set(
  matches.flatMap((m) => [
    m.winnerTo ? `${m.winnerTo}#${m.winnerToSlot}` : null,
    m.loserTo ? `${m.loserTo}#${m.loserToSlot}` : null,
  ]),
)

const isUnused = (match: BracketMatch) =>
  match.registration1Id === null &&
  match.registration2Id === null &&
  !fed.has(`${match.id}#1`) &&
  !fed.has(`${match.id}#2`)

const playable = matches.filter((m) => !isUnused(m))
```

## Grand Final

### Standard Double Elimination

```typescript
const matches = generateDoubleElimination({
  eventId: 'fighting-game-major',
  participants: createParticipants(16),
  idFactory: () => crypto.randomUUID(),
  grandFinal: 'reset',
})

const [grandFinal, reset] = matches
  .filter((m) => m.bracketType === 'grandFinal')
  .sort((a, b) => a.round - b.round)

// Slot 1 is the winners bracket representative, slot 2 the losers bracket one.
console.log(grandFinal.round) // 1
console.log(reset.round) // 2
```

### Deciding Whether the Reset Is Played

```typescript
const reportGrandFinal = (winnerId: string) => {
  const fromLosersBracket = winnerId === grandFinal.registration2Id

  if (!fromLosersBracket) {
    // The winners bracket representative is unbeaten: the reset is not played.
    return { champion: winnerId, resetRequired: false }
  }

  // Both finalists now have one loss each, so they play again.
  return { champion: null, resetRequired: true }
}
```

## Integration with Database

### Saving Matches to Database

```typescript
import { generateDoubleElimination, BracketMatch } from 'double-elimination'

async function createTournament(eventId: string, participants: Participant[]) {
  // Generate bracket
  const matches = generateDoubleElimination({
    eventId,
    participants,
    idFactory: () => crypto.randomUUID(),
  })

  // Save to database
  await db.matches.insertMany(
    matches.map((match) => ({
      id: match.id,
      eventId: match.eventId,
      round: match.round,
      matchNumber: match.matchNumber,
      player1Id: match.registration1Id,
      player2Id: match.registration2Id,
      bracketPosition: match.bracketPosition,
      winnerToMatchId: match.winnerTo,
      winnerToSlot: match.winnerToSlot,
      loserToMatchId: match.loserTo,
      loserToSlot: match.loserToSlot,
      bracketType: match.bracketType,
      status: 'pending',
      createdAt: new Date(),
    })),
  )

  return matches
}
```

### Loading Participants from Database

```typescript
async function generateBracketFromDatabase(eventId: string) {
  // Load participants from database
  const registrations = await db.registrations
    .find({
      eventId,
      status: 'confirmed',
    })
    .sort({ seed: 1 })

  const participants = registrations.map((reg) => ({
    registrationId: reg.id,
    seed: reg.seed,
  }))

  // Generate bracket
  return generateDoubleElimination({
    eventId,
    participants,
    idFactory: () => crypto.randomUUID(),
  })
}
```

## Visualizing Brackets

### Group Matches by Round and Type

```typescript
function organizeBracket(matches: BracketMatch[]) {
  const organized: Record<string, BracketMatch[]> = {}

  matches.forEach((match) => {
    const key = `${match.bracketType}-round-${match.round}`
    if (!organized[key]) {
      organized[key] = []
    }
    organized[key].push(match)
  })

  // Sort matches within each round by bracket position
  Object.keys(organized).forEach((key) => {
    organized[key].sort((a, b) => a.bracketPosition - b.bracketPosition)
  })

  return organized
}

const organized = organizeBracket(matches)

// Display bracket structure
Object.keys(organized)
  .sort()
  .forEach((key) => {
    console.log(`\n${key.toUpperCase()}:`)
    organized[key].forEach((match) => {
      const p1 = match.registration1Id || 'BYE'
      const p2 = match.registration2Id || 'BYE'
      console.log(`  Match ${match.matchNumber}: ${p1} vs ${p2}`)
    })
  })
```

### Find Match Dependencies

```typescript
function getMatchDependencies(matches: BracketMatch[], matchId: string) {
  const match = matches.find((m) => m.id === matchId)
  if (!match) return null

  const dependencies: BracketMatch[] = []

  // Find matches that feed into this match
  matches.forEach((m) => {
    if (m.winnerTo === matchId || m.loserTo === matchId) {
      dependencies.push(m)
    }
  })

  return {
    match,
    dependencies,
  }
}

// Example: Find what matches feed into the winners bracket finals.
// Round numbers restart per bracket, so compare within the winners bracket:
// the losers bracket runs more rounds than the winners bracket.
const winners = matches.filter((m) => m.bracketType === 'winners')
const finalsMatch = winners.find(
  (m) => m.round === Math.max(...winners.map((w) => w.round)),
)
if (finalsMatch) {
  const deps = getMatchDependencies(matches, finalsMatch.id)
  console.log('Finals dependencies:', deps?.dependencies.length)
}
```

## Custom ID Generation

### Using Database IDs

```typescript
let matchCounter = 0

const matches = generateDoubleElimination({
  eventId: 'tournament-1',
  participants: createParticipants(8),
  idFactory: () => {
    matchCounter++
    return `match-${Date.now()}-${matchCounter}`
  },
})
```

### Using UUID Library

```typescript
import { v4 as uuidv4 } from 'uuid'

const matches = generateDoubleElimination({
  eventId: 'tournament-1',
  participants: createParticipants(8),
  idFactory: () => uuidv4(),
})
```

### Using Sequential IDs

```typescript
function createSequentialIdFactory(prefix: string) {
  let counter = 0
  return () => `${prefix}-${++counter}`
}

const matches = generateDoubleElimination({
  eventId: 'tournament-1',
  participants: createParticipants(8),
  idFactory: createSequentialIdFactory('MATCH'),
})
```

## Advanced Use Cases

### Tournament with Custom Seeding

```typescript
// Custom seeding based on rating
const players = [
  { id: 'player-a', rating: 2500 },
  { id: 'player-b', rating: 2400 },
  { id: 'player-c', rating: 2300 },
  // ... more players
]

// Sort by rating and assign seeds
const participants = players
  .sort((a, b) => b.rating - a.rating)
  .map((player, index) => ({
    registrationId: player.id,
    seed: index + 1,
  }))

const matches = generateDoubleElimination({
  eventId: 'rated-tournament',
  participants,
  idFactory: () => crypto.randomUUID(),
})
```

### Multiple Tournaments

```typescript
function generateMultipleTournaments(
  events: Array<{ eventId: string; participants: Participant[] }>,
) {
  return events.map((event) =>
    generateDoubleElimination({
      eventId: event.eventId,
      participants: event.participants,
      idFactory: () => crypto.randomUUID(),
    }),
  )
}

const tournaments = generateMultipleTournaments([
  {
    eventId: 'tournament-1',
    participants: createParticipants(8),
  },
  {
    eventId: 'tournament-2',
    participants: createParticipants(16),
  },
])
```
