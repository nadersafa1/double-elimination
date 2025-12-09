# double-elimination

A TypeScript library for generating double elimination tournament brackets with automatic bye handling.

## Features

- Generates complete winners and losers bracket structures
- Standard tournament seeding (1v8, 4v5, 2v7, 3v6 pattern)
- Automatic bye advancement when participant count isn't a power of 2
- **Delayed losers bracket start** - optionally eliminate early-round losers
- Configurable ID generation via factory function
- Full TypeScript support

## Installation

```bash
npm install double-elimination
```

## Quick Start

```typescript
import { generateDoubleElimination } from 'double-elimination'

const matches = generateDoubleElimination({
  eventId: 'tournament-1',
  participants: [
    { registrationId: 'player-1', seed: 1 },
    { registrationId: 'player-2', seed: 2 },
    { registrationId: 'player-3', seed: 3 },
    { registrationId: 'player-4', seed: 4 },
  ],
  idFactory: () => crypto.randomUUID(),
})
```

## API

### `generateDoubleElimination(options)`

Generates all matches for a double elimination bracket.

#### Options

| Property                       | Type            | Description                                               |
| ------------------------------ | --------------- | --------------------------------------------------------- |
| `eventId`                      | `string`        | Identifier for the tournament event                       |
| `participants`                 | `Participant[]` | Array of participants with seeds                          |
| `idFactory`                    | `() => string`  | Function that returns unique IDs for matches              |
| `losersStartRoundsBeforeFinal` | `number?`       | Rounds before finals where LB begins (min: 2). See below. |

#### Returns

`BracketMatch[]` - Array of all matches in the bracket

### Types

```typescript
interface Participant {
  registrationId: string
  seed: number
}

interface BracketMatch {
  id: string
  eventId: string
  round: number
  matchNumber: number
  registration1Id: string | null
  registration2Id: string | null
  bracketPosition: number
  winnerTo: string | null
  winnerToSlot: number | null
  loserTo: string | null
  loserToSlot: number | null
  bracketType: 'winners' | 'losers'
}
```

## Bracket Structure

### Placements

This library uses a simplified double elimination format without grand finals:

| Match                  | Winner    | Loser     |
| ---------------------- | --------- | --------- |
| Winners Bracket Finals | 1st Place | 2nd Place |
| Losers Bracket Finals  | 3rd Place | 4th Place |

### Match Counts

For `N` participants:

- Bracket size = next power of 2 ≥ N
- Winners rounds = log₂(bracket_size)
- Losers rounds = (winners_rounds - 1) × 2 - 1

| Participants | Bracket Size | Winners Matches | Losers Matches | Total |
| ------------ | ------------ | --------------- | -------------- | ----- |
| 4            | 4            | 3               | 1              | 4     |
| 5-8          | 8            | 7               | 5              | 12    |
| 9-16         | 16           | 15              | 13             | 28    |

## Match Routing

### Winners Bracket

- **Winner routing**: Position `P` → next round, position `⌊P/2⌋`, slot `(P % 2) + 1`
- **Loser routing**: Drops to losers bracket (except finals loser who gets 2nd place)

### Losers Bracket

- Receives losers from winners bracket rounds 1 and 2
- Winners from losers bracket finals get 3rd place, loser gets 4th

## Bye Handling

When participant count isn't a power of 2, byes are automatically created and processed:

```typescript
// 7 participants in bracket of 8 = 1 bye
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(7), // Seeds 1-7
  idFactory: () => crypto.randomUUID(),
})

// Seed 1 vs Seed 8 (missing) = Seed 1 auto-advances
```

Byes are pre-resolved at generation time - the advancing player is already placed in the next round.

## Delayed Losers Bracket

By default, all losers (except finals) drop to the losers bracket. Use `losersStartRoundsBeforeFinal` to start the losers bracket later - early round losers are permanently eliminated.

```typescript
// 16 players with losers bracket starting at Quarter-Finals
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(16),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 2, // QF and SF losers go to LB
})
```

### How It Works

For 16 participants (4 WB rounds) with `losersStartRoundsBeforeFinal: 2`:

| WB Round | Name   | Loser Fate                   |
| -------- | ------ | ---------------------------- |
| Round 1  | Ro16   | **Eliminated** (single elim) |
| Round 2  | QF     | Drops to LB R1               |
| Round 3  | SF     | Drops to LB R2               |
| Round 4  | Finals | 2nd Place                    |

### Constraints

- **Minimum value: 2** - A value of 1 would just be single elimination with a 3rd place match
- **Maximum value: winnersRounds - 1** - Cannot exceed available feeder rounds

## Example Output

For 8 participants:

```
WINNERS BRACKET:
Round 1: [1v8, 4v5, 2v7, 3v6] → losers drop to LB R1
Round 2: [R1 winners]         → losers drop to LB R2
Round 3: [Finals]             → winner=1st, loser=2nd

LOSERS BRACKET:
Round 1: [WB R1 losers pair up]
Round 2: [LB R1 winners + WB R2 losers]
Round 3: [Finals] → winner=3rd, loser=4th
```

## License

MIT
