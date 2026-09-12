# Examples

Practical recipes for `double-elimination`. For the full API see the
[README](README.md).

## Table of Contents

- [Setup](#setup)
- [Single Elimination](#single-elimination)
- [Double Elimination](#double-elimination)
- [Round Robin](#round-robin)
- [Standings](#standings)
- [Group Stage into a Playoff Bracket](#group-stage-into-a-playoff-bracket)
- [Picking a Format at Runtime](#picking-a-format-at-runtime)
- [Odd Participant Counts](#odd-participant-counts)
- [Recording Results](#recording-results)
- [Saving to a Database](#saving-to-a-database)
- [Rendering a Bracket](#rendering-a-bracket)
- [Custom ID Generation](#custom-id-generation)

## Setup

Every example uses these helpers:

```typescript
import {
  calculateStandings,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  generateTournament,
  type TournamentMatch,
} from 'double-elimination'

const createParticipants = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    registrationId: `player-${i + 1}`,
    seed: i + 1,
  }))

const idFactory = () => crypto.randomUUID()
```

## Single Elimination

### A straight knockout

```typescript
const cup = generateSingleElimination({
  eventId: 'friday-night-cup',
  participants: createParticipants(16),
  idFactory,
})

console.log(cup.length) // 15 — every match eliminates exactly one player
console.log(new Set(cup.map((m) => m.round)).size) // 4 rounds
```

### With a third place match

```typescript
const cup = generateSingleElimination({
  eventId: 'friday-night-cup',
  participants: createParticipants(8),
  idFactory,
  thirdPlaceMatch: true,
})

// The third place match is the only non-winners match in the array
const thirdPlace = cup.find((m) => m.bracketType === 'losers')!

// Both semifinals feed it
const semifinals = cup.filter(
  (m) => m.bracketType === 'winners' && m.round === 2
)
console.log(semifinals.every((m) => m.loserTo === thirdPlace.id)) // true
```

## Double Elimination

### Standard, with a grand final and bracket reset

```typescript
const major = generateDoubleElimination({
  eventId: 'spring-major',
  participants: createParticipants(16),
  idFactory,
  grandFinal: 'reset',
})

const counts = {
  winners: major.filter((m) => m.bracketType === 'winners').length, // 15
  losers: major.filter((m) => m.bracketType === 'losers').length, // 14
  grandFinal: major.filter((m) => m.bracketType === 'grandFinal').length, // 2
}
```

### Deciding whether the reset is played

```typescript
const [grandFinal, reset] = major
  .filter((m) => m.bracketType === 'grandFinal')
  .sort((a, b) => a.round - b.round)

const reportGrandFinal = (winnerId: string) => {
  // Slot 2 is the losers bracket representative.
  const fromLosersBracket = winnerId === grandFinal.registration2Id

  if (!fromLosersBracket) {
    // The winners bracket representative is unbeaten: skip the reset.
    return { champion: winnerId, resetMatch: null }
  }

  // Both finalists now have one loss each, so they play again.
  return { champion: null, resetMatch: reset }
}
```

### Without a grand final (the 1.x default)

```typescript
// Winners final decides 1st/2nd, losers final decides 3rd/4th
const bracket = generateDoubleElimination({
  eventId: 'club-night',
  participants: createParticipants(8),
  idFactory,
})

console.log(bracket.length) // 12
```

### Delayed losers bracket

Early rounds are single elimination; only the later losers get a second life.

```typescript
const compressed = generateDoubleElimination({
  eventId: 'one-day-event',
  participants: createParticipants(16),
  idFactory,
  losersStartRoundsBeforeFinal: 2, // QF and SF losers drop
})

const ro16 = compressed.filter(
  (m) => m.bracketType === 'winners' && m.round === 1
)
console.log(ro16.every((m) => m.loserTo === null)) // true — lose and you are out
```

## Round Robin

### A league season, home and away

```typescript
const season = generateRoundRobin({
  eventId: 'league-2026',
  participants: createParticipants(10),
  idFactory,
  legs: 2,
})

console.log(season.length) // 90 matches
console.log(Math.max(...season.map((m) => m.round))) // 18 rounds

// Round 1's fixtures, ready to publish
const opening = season
  .filter((m) => m.round === 1)
  .sort((a, b) => a.bracketPosition - b.bracketPosition)
  .map((m) => `${m.registration1Id} v ${m.registration2Id}`)
```

### Group stage

```typescript
const groups = generateRoundRobin({
  eventId: 'world-cup',
  participants: createParticipants(32),
  idFactory,
  groupCount: 8, // 8 groups of 4, snake seeded
})

const groupA = groups.filter((m) => m.group === 0)
console.log(groupA.length) // 6 matches

// Who is in each group
const membersOf = (group: number) => [
  ...new Set(
    groups
      .filter((m) => m.group === group)
      .flatMap((m) => [m.registration1Id!, m.registration2Id!])
  ),
]
```

### An odd field

```typescript
const nine = generateRoundRobin({
  eventId: 'club-ladder',
  participants: createParticipants(9),
  idFactory,
})

console.log(nine.length) // 36 matches over 9 rounds

// Whoever has no fixture this round is resting
const resting = (round: number) => {
  const playing = new Set(
    nine
      .filter((m) => m.round === round)
      .flatMap((m) => [m.registration1Id!, m.registration2Id!])
  )
  return createParticipants(9)
    .map((p) => p.registrationId)
    .filter((id) => !playing.has(id))
}
```

## Standings

### A league table

```typescript
const results = [
  { matchId: season[0].id, score1: 2, score2: 1 },
  { matchId: season[1].id, score1: 0, score2: 0 },
]

const table = calculateStandings({ matches: season, results })

for (const row of table) {
  console.log(
    `${row.rank}. ${row.registrationId}  ` +
      `${row.played} ${row.won} ${row.drawn} ${row.lost}  ` +
      `${row.scoreFor}:${row.scoreAgainst}  ${row.points}pts`
  )
}
```

Matches without a result simply count as unplayed, so the table is correct at
any point in the season.

### Results without scores

```typescript
const table = calculateStandings({
  matches: season,
  results: [
    { matchId: season[0].id, winnerId: 'player-3' },
    { matchId: season[1].id, winnerId: null }, // a draw
  ],
})
```

### Custom points and tiebreakers

```typescript
// Three points for a win, and goal difference outranks head-to-head
const table = calculateStandings({
  matches: season,
  results,
  points: { win: 3, draw: 1, loss: 0 },
  tiebreakers: ['scoreDifference', 'scoreFor', 'headToHead'],
})

// A format where a loss costs you
const table2 = calculateStandings({
  matches: season,
  results,
  points: { win: 2, draw: 0, loss: -1 },
})
```

### Qualifiers from a group stage

```typescript
const table = calculateStandings({ matches: groups, results })

// Top two from every group
const qualifiers = table.filter((row) => row.rank <= 2)

// Best third-placed teams across groups
const thirds = table
  .filter((row) => row.rank === 3)
  .sort((a, b) => b.points - a.points || b.scoreDifference - a.scoreDifference)
  .slice(0, 4)
```

## Group Stage into a Playoff Bracket

The common real-world shape: pools first, then a knockout bracket seeded by how
teams finished.

```typescript
const groupStage = generateRoundRobin({
  eventId: 'champions-league-2026',
  participants: createParticipants(32),
  idFactory,
  groupCount: 8,
})

// ...play the group stage, collecting results...

const table = calculateStandings({ matches: groupStage, results })

// Group winners are seeded above runners-up, then by points
const qualifiers = table
  .filter((row) => row.rank <= 2)
  .sort(
    (a, b) =>
      a.rank - b.rank ||
      b.points - a.points ||
      b.scoreDifference - a.scoreDifference
  )
  .map((row, index) => ({
    registrationId: row.registrationId,
    seed: index + 1,
  }))

const playoffs = generateDoubleElimination({
  eventId: 'champions-league-2026-playoffs',
  participants: qualifiers,
  idFactory,
  grandFinal: 'single',
})
```

Store the two stages as separate tournaments sharing an `eventId` prefix; each
is a self-contained set of matches.

## Picking a Format at Runtime

When the format comes from a form or a database column, use `generateTournament`
and keep the branching in one place.

```typescript
type Event = {
  id: string
  format: 'single-elimination' | 'double-elimination' | 'round-robin'
  entrants: { registrationId: string; seed: number }[]
}

const buildTournament = (event: Event) =>
  generateTournament({
    format: event.format,
    eventId: event.id,
    participants: event.entrants,
    idFactory,
    // Format-specific options are type-checked against the chosen format
    ...(event.format === 'round-robin'
      ? { legs: 2 }
      : { grandFinal: 'single' }),
  } as Parameters<typeof generateTournament>[0])
```

## Odd Participant Counts

Byes are resolved at generation time, so nothing waits on a player who does not
exist.

```typescript
const bracket = generateDoubleElimination({
  eventId: 'odd-field',
  participants: createParticipants(7), // bracket size 8
  idFactory,
})

// A bye is a first round match with exactly one participant
const byes = bracket.filter(
  (m) =>
    m.bracketType === 'winners' &&
    m.round === 1 &&
    (m.registration1Id === null) !== (m.registration2Id === null)
)

console.log(byes.length) // 1 — seed 1 gets it
console.log(byes[0].loserTo) // null — a walkover has no loser
```

### Telling "waiting" apart from "never happening"

With byes, some matches cannot be reached at all, and some will only ever see
one player. Both come down to whether an empty slot will ever be filled:

```typescript
const fed = new Set(
  bracket.flatMap((m) => [
    m.winnerTo ? `${m.winnerTo}#${m.winnerToSlot}` : null,
    m.loserTo ? `${m.loserTo}#${m.loserToSlot}` : null,
  ])
)

const willFill = (match: TournamentMatch, slot: 1 | 2) =>
  (slot === 1 ? match.registration1Id : match.registration2Id) !== null ||
  fed.has(`${match.id}#${slot}`)

const statusOf = (match: TournamentMatch) => {
  const [one, two] = [willFill(match, 1), willFill(match, 2)]
  if (!one && !two) return 'unused' // nobody can reach it
  if (!one || !two) return 'walkover' // one entrant, no opponent coming
  return 'playable'
}

const schedule = bracket.filter((m) => statusOf(m) === 'playable')
```

Walkovers are resolved for you wherever the advancing player is already known —
their slot in the next match is filled before the bracket is returned. The
exception is a walkover whose entrant is still unknown, which only happens in
brackets small enough for a bye to reach the last match (the third place match
in a 3-participant tournament, for instance).

## Recording Results

Brackets carry their own wiring, so one helper covers every bracket format.

```typescript
const applyResult = (
  matches: TournamentMatch[],
  matchId: string,
  winnerId: string
) => {
  const match = matches.find((m) => m.id === matchId)
  if (!match) throw new Error(`unknown match: ${matchId}`)

  const loserId =
    winnerId === match.registration1Id
      ? match.registration2Id
      : match.registration1Id

  const place = (
    targetId: string | null,
    slot: number | null,
    who: string | null
  ) => {
    if (!targetId || !slot || !who) return
    const target = matches.find((m) => m.id === targetId)!
    if (slot === 1) target.registration1Id = who
    else target.registration2Id = who
  }

  place(match.winnerTo, match.winnerToSlot, winnerId)
  place(match.loserTo, match.loserToSlot, loserId)

  return matches
}
```

Round robin matches have no routing, so recording a result there means storing
it and recalculating the standings.

## Saving to a Database

The match shape maps directly onto a table, whatever the format.

```typescript
await db.matches.createMany({
  data: matches.map((match) => ({
    id: match.id,
    eventId: match.eventId,
    round: match.round,
    matchNumber: match.matchNumber,
    bracketPosition: match.bracketPosition,
    bracketType: match.bracketType,
    groupIndex: match.group,
    leg: match.leg,
    registration1Id: match.registration1Id,
    registration2Id: match.registration2Id,
    winnerTo: match.winnerTo,
    winnerToSlot: match.winnerToSlot,
    loserTo: match.loserTo,
    loserToSlot: match.loserToSlot,
  })),
})
```

Because `idFactory` is yours, you can hand out ids your database already
understands:

```typescript
const matches = generateDoubleElimination({
  eventId: event.id,
  participants,
  idFactory: () => cuid(),
})
```

## Rendering a Bracket

### Group matches by bracket and round

```typescript
const organize = (matches: TournamentMatch[]) => {
  const columns = new Map<string, TournamentMatch[]>()

  for (const match of matches) {
    const key =
      match.group === null
        ? `${match.bracketType}-${match.round}`
        : `group-${match.group}-${match.round}`
    columns.set(key, [...(columns.get(key) ?? []), match])
  }

  for (const [, column] of columns) {
    column.sort((a, b) => a.bracketPosition - b.bracketPosition)
  }

  return columns
}
```

### Find what feeds a match

```typescript
const feedersOf = (matches: TournamentMatch[], matchId: string) =>
  matches.filter((m) => m.winnerTo === matchId || m.loserTo === matchId)

// Round numbers restart per bracket, so compare within one bracket: the losers
// bracket runs more rounds than the winners bracket.
const winners = matches.filter((m) => m.bracketType === 'winners')
const final = winners.find(
  (m) => m.round === Math.max(...winners.map((w) => w.round))
)!

console.log(feedersOf(matches, final.id).length) // 2
```

## Custom ID Generation

```typescript
// Sequential, for readable test fixtures
let counter = 0
const sequential = () => `match-${++counter}`

// UUIDs
const uuid = () => crypto.randomUUID()

// Your ORM's id generator
const ormIds = () => cuid()
```

Any factory works as long as it never repeats — a repeat throws rather than
cross-wiring the bracket.
