# double-elimination

[![npm version](https://img.shields.io/npm/v/double-elimination.svg)](https://www.npmjs.com/package/double-elimination)
[![npm weekly downloads](https://img.shields.io/npm/dw/double-elimination.svg)](https://www.npmjs.com/package/double-elimination)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/nadersafa1/double-elimination.svg?style=social)](https://github.com/nadersafa1/double-elimination)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_it!-6366f1.svg)](https://nadersafa1.github.io/double-elimination/)

A TypeScript library for generating double elimination tournament brackets with automatic seeding and bye handling. Perfect for esports tournaments, sports competitions, and any competitive event management system.

## Table of Contents

- [Why Double Elimination?](#why-double-elimination)
- [When to Use This Package](#when-to-use-this-package)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Use Cases](#use-cases)
- [API](#api)
- [Bracket Structure](#bracket-structure)
- [Match Routing](#match-routing)
- [Bye Handling](#bye-handling)
- [Delayed Losers Bracket and Single Elimination](#delayed-losers-bracket-and-single-elimination)
- [Grand Final](#grand-final)
- [Seeding](#seeding)
- [Example Output](#example-output)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

## Why Double Elimination?

Double elimination tournaments are the gold standard for competitive events because they:

- **Ensure fairness**: Players must lose twice to be eliminated, reducing the impact of bad luck or upsets
- **Provide accurate rankings**: Top 4 placements are determined through structured competition
- **Increase engagement**: More matches mean more content and viewer engagement
- **Reduce early elimination**: Strong players who face tough early matchups get a second chance

This library implements the standard double elimination format used in major
esports tournaments, fighting game competitions, and sports events worldwide —
including the grand final and bracket reset when you want them.

## When to Use This Package

Use `double-elimination` when you need to:

- **Build tournament management systems** for esports, sports, or gaming platforms
- **Generate bracket structures** programmatically with proper seeding
- **Handle variable participant counts** with automatic bye management
- **Support multiple tournament formats** including single elimination and delayed double elimination
- **Ensure fair matchups** using standard tournament seeding algorithms
- **Integrate tournament brackets** into existing applications or websites

Perfect for developers building:

- Esports tournament platforms
- Sports competition management systems
- Gaming tournament organizers
- Bracket visualization tools
- Tournament scheduling applications

## Features

- ✅ **Complete bracket generation** - Winners bracket, losers bracket, and optional grand final
- ✅ **Standard tournament seeding** - Ensures seeds 1 and 2 can only meet in finals, seeds 1-4 can only meet in semifinals, etc.
- ✅ **Automatic bye handling** - Byes are resolved through the whole bracket, so odd participant counts still run to completion
- ✅ **Flexible tournament formats** - Double elimination with or without a grand final and bracket reset, single elimination, and delayed losers bracket
- ✅ **Rematch prevention** - Rotating loser routing keeps players away from opponents they already beat
- ✅ **Validated input** - Duplicate seeds, duplicate ids, and repeated match ids throw instead of corrupting the bracket
- ✅ **TypeScript support** - Full type definitions, ESM and CommonJS builds
- ✅ **Zero dependencies** - Lightweight and fast
- ✅ **Configurable ID generation** - Use any ID factory function

## Installation

```bash
npm install double-elimination
```

Ships both ES module and CommonJS builds with TypeScript types, so `import` and
`require` both work on Node 18+ and in any bundler.

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

| Property                       | Type                            | Description                                                    |
| ------------------------------ | ------------------------------- | -------------------------------------------------------------- |
| `eventId`                      | `string`                        | Identifier for the tournament event                            |
| `participants`                 | `Participant[]`                 | Array of participants with seeds                               |
| `idFactory`                    | `() => string`                  | Function that returns unique IDs for matches                   |
| `losersStartRoundsBeforeFinal` | `number?`                       | Rounds before finals where LB begins (min: 0). See below.      |
| `grandFinal`                   | `'none' \| 'single' \| 'reset'` | Whether to add a grand final. Defaults to `'none'`. See below. |

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
  bracketType: 'winners' | 'losers' | 'grandFinal'
}
```

Seeds must be unique but need not be `1..N` — participants are ranked by seed,
so `[10, 20, 30]` seeds identically to `[1, 2, 3]`. Duplicate seeds, duplicate
`registrationId`s and a non-unique `idFactory` throw instead of silently
producing a broken bracket.

## Bracket Structure

### Placements

By default there is no grand final: the winners final decides 1st/2nd and the
losers final decides 3rd/4th.

| Match                  | Winner    | Loser     |
| ---------------------- | --------- | --------- |
| Winners Bracket Finals | 1st Place | 2nd Place |
| Losers Bracket Finals  | 3rd Place | 4th Place |

With `grandFinal: 'single'` or `'reset'` the bracket runs as a standard double
elimination instead — the winners final loser drops into the losers final, and
the two bracket winners meet:

| Match                  | Winner        | Loser           |
| ---------------------- | ------------- | --------------- |
| Winners Bracket Finals | → Grand Final | → Losers Finals |
| Losers Bracket Finals  | → Grand Final | 3rd Place       |
| Grand Final            | 1st Place     | 2nd Place       |

### Match Counts

For `N` participants:

- Bracket size = next power of 2 ≥ N
- Winners rounds = log₂(bracket_size)
- Losers rounds = (winners_rounds - 1) × 2 - 1, plus one more with a grand final

| Participants | Bracket Size | Winners | Losers | Total | Total with `grandFinal: 'single'` |
| ------------ | ------------ | ------- | ------ | ----- | --------------------------------- |
| 4            | 4            | 3       | 1      | 4     | 6                                 |
| 5-8          | 8            | 7       | 5      | 12    | 14                                |
| 9-16         | 16           | 15      | 13     | 28    | 30                                |

Matches are returned winners bracket first, then losers bracket, then grand
final, each ordered by round and then by `bracketPosition`.

## Match Routing

### Winners Bracket

- **Winner routing**: Position `P` → next round, position `⌊P/2⌋`, slot `(P % 2) + 1`
- **Loser routing**: Drops to the losers bracket. Without a grand final the
  winners final loser is 2nd place; with one they drop to the losers final. A
  walkover has no loser, so its `loserTo` is `null`.

### Losers Bracket

- Round 1 pairs off the first wave of winners bracket losers
- Even rounds receive a fresh wave of winners bracket losers into slot 2, so
  they hold as many matches as the round before them
- Odd rounds after round 1 are played between losers bracket survivors only,
  halving the match count
- Without a grand final, the losers final winner is 3rd and the loser is 4th

### Cross-Bracket Matchups

A player dropping into the losers bracket must not immediately run into someone
they already beat, so each wave of winners bracket losers is reordered before it
is dropped in. The ordering rotates from one wave to the next:

| Losers entering               | Ordering applied                  |
| ----------------------------- | --------------------------------- |
| 1st wave (first feeder round) | Paired up (`⌊position / 2⌋`)      |
| 2nd wave                      | Reversed                          |
| 3rd wave                      | Reversed and shifted by half      |
| 4th wave                      | Shifted by half                   |
| 5th wave                      | Unchanged, then the cycle repeats |

Rotating the ordering matters most in large brackets. Measured over 200 random
64-player tournaments, rotating pushes the first possible rematch from losers
round 4 out to losers round 7, and cuts rematches from ~2.8 per tournament to
~0.4. A rematch in the last losers rounds is unavoidable in any double
elimination bracket.

## Bye Handling

When the participant count isn't a power of 2, byes are created and resolved at
generation time — through the whole bracket, not just the first round:

```typescript
// 7 participants in a bracket of 8 = 1 bye
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(7), // Seeds 1-7
  idFactory: () => crypto.randomUUID(),
})

// Seed 1 vs Seed 8 (missing) = Seed 1 is already placed in round 2
```

Three things follow from a bye, and all of them are handled for you:

- **The advancing player is pre-placed.** Their slot in the next match is filled
  before the bracket is returned.
- **A walkover produces no loser.** The match's `loserTo` is `null`, so nothing
  waits on a loser that never arrives.
- **Losers bracket matches that would only ever get one player are skipped.**
  The feeding match is re-pointed at whatever came after them, so the losers
  bracket always runs to completion.

A match that nobody can reach stays in the returned array with empty slots and
no routing (`winnerTo`, `loserTo`, and both slots are `null`), which keeps
round and position numbering stable for rendering. To tell "waiting for an
opponent" apart from "nobody is coming", check whether anything feeds the slot:

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
```

## Delayed Losers Bracket and Single Elimination

By default, all losers (except finals) drop to the losers bracket. Use `losersStartRoundsBeforeFinal` to start the losers bracket later - early round losers are permanently eliminated.

### Single Elimination Modes

You can create pure single elimination or single elimination with a 3rd place match:

```typescript
// Pure single elimination (no losers bracket)
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(8),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 0, // No losers bracket
})

// Single elimination with 3rd place match (only semifinal losers)
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(8),
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 1, // Only semifinal losers go to LB
})
```

### Delayed Double Elimination

For delayed double elimination, use values >= 2:

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

- **Minimum value: 0** - Pure single elimination (no losers bracket)
- **Value: 1** - Single elimination with optional 3rd place match (requires at least 3 participants)
- **Value: 2+** - Delayed double elimination
- **Maximum value: winnersRounds - 1** - Cannot exceed available feeder rounds

## Grand Final

By default the winners final decides 1st and 2nd place. Pass `grandFinal` to run
a standard double elimination instead, where the winners final loser drops to
the losers final and the two bracket winners meet:

```typescript
// One grand final match
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(8),
  idFactory: () => crypto.randomUUID(),
  grandFinal: 'single',
})

// Grand final plus bracket reset
const withReset = generateDoubleElimination({
  eventId: 'event-1',
  participants: createParticipants(8),
  idFactory: () => crypto.randomUUID(),
  grandFinal: 'reset',
})
```

Enabling it adds one losers bracket round (the losers final, where the winners
final loser enters) and the grand final itself, which is returned with
`bracketType: 'grandFinal'`.

### Bracket Reset

With `grandFinal: 'reset'` the grand final is two matches, `round: 1` and
`round: 2`. Match 2 is **only played when the losers bracket representative wins
match 1** — otherwise the winners bracket representative is champion with an
unbeaten record and match 2 is dropped.

Both finalists are routed into the reset match (`winnerTo` into slot 1,
`loserTo` into slot 2) so the usual propagation works unchanged. Your code
decides whether the match happens:

```typescript
const [grandFinal, reset] = matches
  .filter((m) => m.bracketType === 'grandFinal')
  .sort((a, b) => a.round - b.round)

// slot 2 of the grand final is the losers bracket representative
const resetRequired = grandFinalWinnerId === grandFinal.registration2Id
```

### Constraints

`grandFinal` requires a losers bracket, so it cannot be combined with
`losersStartRoundsBeforeFinal: 0`, and needs at least 3 participants.

## Seeding

The library uses standard tournament seeding to ensure fair bracket placement:

- **Seeds 1 and 2** can only meet in the Finals
- **Seeds 1-4** can only meet in Semifinals or later
- **Seeds 1-8** can only meet in Quarterfinals or later

For 8 participants, Round 1 matchups are: `1v8, 4v5, 2v7, 3v6`

For 32 participants:

- Seed 1 is in matches 0-7 (top half)
- Seed 2 is in matches 8-15 (bottom half)
- Seeds 3-4 are in opposite quarters from seeds 1-2

Participants are ranked by seed before placement, so the seed values only need
to be unique and correctly ordered — `[10, 20, 30]` and `[1, 2, 3]` produce the
same bracket. Byes go to the strongest seeds.

## Use Cases

### Esports Tournament Platform

Generate brackets for competitive gaming tournaments with proper seeding and fair matchups.

```typescript
const esportsBracket = generateDoubleElimination({
  eventId: 'valorant-championship-2024',
  participants: teams.map((team, index) => ({
    registrationId: team.id,
    seed: team.rank,
  })),
  idFactory: () => crypto.randomUUID(),
})
```

### Sports Competition Management

Create tournament brackets for sports leagues, ensuring top seeds don't meet until later rounds.

### Gaming Tournament Organizer

Run local or online gaming tournaments with automatic bracket generation and bye handling.

### Bracket Visualization

Generate bracket data for visualization libraries like D3.js, React components, or custom renderers.

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

With `grandFinal: 'single'`:

```
WINNERS BRACKET:
Round 3: [Finals] → winner to Grand Final, loser drops to LB R4

LOSERS BRACKET:
Round 4: [Finals] → winner to Grand Final, loser=3rd

GRAND FINAL:
Round 1: [WB winner vs LB winner] → winner=1st, loser=2nd
```

Run `npm run demo -- <participants> [none|single|reset]` to print any bracket.

## Performance

Generation is O(n) in the number of participants, with no runtime dependencies.
Measured on Node 22 (average of 20 runs):

| Participants | Time per bracket |
| ------------ | ---------------- |
| 128          | 0.7 ms           |
| 1024         | 3.1 ms           |
| 4096         | 14.3 ms          |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

## License

MIT
