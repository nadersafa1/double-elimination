# double-elimination

[![npm version](https://img.shields.io/npm/v/double-elimination.svg)](https://www.npmjs.com/package/double-elimination)
[![npm weekly downloads](https://img.shields.io/npm/dw/double-elimination.svg)](https://www.npmjs.com/package/double-elimination)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/nadersafa1/double-elimination.svg?style=social)](https://github.com/nadersafa1/double-elimination)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Try_it!-6366f1.svg)](https://nadersafa1.github.io/double-elimination/)

Generate a whole tournament from a list of participants — **double elimination**,
**single elimination** or **round robin** — with standard seeding, byes handled
end to end, optional grand finals, group stages and league standings.

Every format returns the same match objects, so one renderer, one database table
and one results screen serve all three.

```typescript
import { generateTournament } from 'double-elimination'

const matches = generateTournament({
  format: 'double-elimination',
  eventId: 'spring-major',
  participants,
  idFactory: () => crypto.randomUUID(),
  grandFinal: 'reset',
})
```

> **Why the name?** The package started as a double elimination generator and
> keeps the name on npm. It now covers three formats — see
> [Choosing a format](#choosing-a-format).

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Choosing a Format](#choosing-a-format)
- [The Match Shape](#the-match-shape)
- [API](#api)
  - [generateTournament](#generatetournamentoptions)
  - [generateSingleElimination](#generatesingleeliminationoptions)
  - [generateDoubleElimination](#generatedoubleeliminationoptions)
  - [generateRoundRobin](#generateroundrobinoptions)
  - [calculateStandings](#calculatestandingsoptions)
  - [qualifiersFromStandings](#qualifiersfromstandingsoptions)
- [Double Elimination](#double-elimination)
- [Round Robin](#round-robin)
- [Multi-Stage Tournaments](#multi-stage-tournaments)
- [Seeding](#seeding)
- [Bye Handling](#bye-handling)
- [Performance](#performance)
- [Migrating from 1.x](#migrating-from-1x)
- [Contributing](#contributing)
- [License](#license)

## Features

- ✅ **Three formats, one shape** — double elimination, single elimination and
  round robin all return the same `TournamentMatch[]`
- ✅ **Standard seeding** — seeds 1 and 2 can only meet in the final, seeds 1–4
  only in the semifinals, and so on
- ✅ **Byes handled end to end** — odd participant counts run to completion
  instead of stalling on an opponent who never arrives
- ✅ **Grand final and bracket reset** — optional, so the losers bracket winner
  gets a real shot at the title
- ✅ **Rematch prevention** — rotating loser routing keeps players away from
  opponents they already beat
- ✅ **Round robin done properly** — seeded fixtures, balanced sides, multi-leg
  seasons, snake-seeded group stages
- ✅ **Standings with tiebreakers** — points, head-to-head, score difference,
  score for, wins, seed — in the order your rules say
- ✅ **Multi-stage championships** — take the qualifiers out of a group stage
  and seed them into a bracket, without guessing at a tie
- ✅ **Validated input** — duplicate seeds, duplicate ids and repeated match ids
  throw instead of corrupting the tournament
- ✅ **Zero dependencies**, ESM and CommonJS builds, full TypeScript types

## Installation

```bash
npm install double-elimination
```

Works on Node 18+ and in any bundler; `import` and `require` both resolve.

## Quick Start

Every generator takes the same three things: an `eventId` copied onto each
match, your `participants`, and an `idFactory` that returns unique match ids.

```typescript
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateRoundRobin,
  calculateStandings,
} from 'double-elimination'

const participants = [
  { registrationId: 'player-1', seed: 1 },
  { registrationId: 'player-2', seed: 2 },
  { registrationId: 'player-3', seed: 3 },
  { registrationId: 'player-4', seed: 4 },
]

const options = {
  eventId: 'tournament-1',
  participants,
  idFactory: () => crypto.randomUUID(),
}

// One loss and you are out
const cup = generateSingleElimination({ ...options, thirdPlaceMatch: true })

// Two losses to go out, with a grand final and bracket reset
const major = generateDoubleElimination({ ...options, grandFinal: 'reset' })

// Everyone plays everyone, home and away
const league = generateRoundRobin({ ...options, legs: 2 })

// ...and once results come in
const table = calculateStandings({
  matches: league,
  results: [{ matchId: league[0].id, score1: 2, score2: 1 }],
})
```

## Choosing a Format

|                        | **Single elimination**                       | **Double elimination**                         | **Round robin**                                      |
| ---------------------- | -------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Losses to go out       | 1                                            | 2                                              | — everyone plays everyone                            |
| Matches for 16 players | 15                                           | 28, or 30 with a grand final                   | 120 (240 over two legs)                              |
| Rounds for 16 players  | 4                                            | 4 winners + 5 losers                           | 15                                                   |
| Ranks produced         | 1st, 2nd (+3rd with a third place match)     | 1st – 4th                                      | a full table                                         |
| Good for               | tight schedules, large fields, knockout days | fair results without doubling the field's time | leagues, group stages, small fields who came to play |
| Bad luck early         | ends your day                                | costs you the winners bracket                  | costs you three points                               |

Mixing formats is common and fully supported: run `generateRoundRobin` with
`groupCount` for the group stage, then hand the table to
`qualifiersFromStandings` and feed the result into `generateDoubleElimination`
as a new tournament. See [Multi-Stage Tournaments](#multi-stage-tournaments).

## The Match Shape

Every generator returns `TournamentMatch[]`:

```typescript
interface TournamentMatch {
  id: string
  eventId: string
  round: number // 1-based, counted within bracketType (and group)
  matchNumber: number // 1-based within the round
  bracketPosition: number // 0-based within the round, top to bottom
  registration1Id: string | null
  registration2Id: string | null
  winnerTo: string | null // match the winner advances to
  winnerToSlot: number | null // slot (1 or 2) they take there
  loserTo: string | null // match the loser drops to
  loserToSlot: number | null
  bracketType: 'winners' | 'losers' | 'grandFinal' | 'roundRobin'
  group: number | null // 0-based group index in a group stage
  leg: number // 1-based; above 1 only in multi-leg round robins
}
```

| Field                                 | Brackets                       | Round robin                              |
| ------------------------------------- | ------------------------------ | ---------------------------------------- |
| `registration1Id` / `registration2Id` | filled in as rounds are played | both known up front                      |
| `winnerTo` / `loserTo`                | where the players go next      | always `null`                            |
| `group`                               | `null`                         | group index, or `null` for a single pool |
| `leg`                                 | `1`                            | which time round the field this is       |

### Applying a result

Brackets carry their own wiring, so recording a result is the same three lines
whatever the format:

```typescript
const applyResult = (
  matches: TournamentMatch[],
  matchId: string,
  winnerId: string
) => {
  const match = matches.find((m) => m.id === matchId)!
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
}
```

Round robin matches have no routing — rank them with
[`calculateStandings`](#calculatestandingsoptions) instead.

## API

### `generateTournament(options)`

Generates whichever format `options.format` names. Use it when the format is
data — a column in your database, a value from a form — rather than something
known when the code is written.

```typescript
generateTournament({
  format: 'round-robin', // 'single-elimination' | 'double-elimination' | 'round-robin'
  eventId: 'league-2026',
  participants,
  idFactory: () => crypto.randomUUID(),
  legs: 2, // format-specific options come along too
})
```

The options are a discriminated union, so TypeScript offers exactly the options
that format accepts and rejects the others.

### Shared options

| Option         | Type            | Description                                            |
| -------------- | --------------- | ------------------------------------------------------ |
| `eventId`      | `string`        | Identifier for the tournament, copied onto every match |
| `participants` | `Participant[]` | `{ registrationId, seed }`, at least 2                 |
| `idFactory`    | `() => string`  | Returns a unique id per match                          |

Seeds must be unique but need not be `1..N` — participants are ranked by seed,
so `[10, 20, 30]` seeds identically to `[1, 2, 3]`. Duplicate seeds, duplicate
`registrationId`s and a repeating `idFactory` all throw rather than quietly
producing a broken tournament.

### `generateSingleElimination(options)`

| Option            | Type      | Default | Description                                                                          |
| ----------------- | --------- | ------- | ------------------------------------------------------------------------------------ |
| `thirdPlaceMatch` | `boolean` | `false` | Adds a match between the two semifinal losers, returned with `bracketType: 'losers'` |

Produces `bracketSize - 1` matches — one more with `thirdPlaceMatch` — where
the bracket size is the next power of two at or above the participant count.

### `generateDoubleElimination(options)`

| Option                         | Type                            | Default    | Description                                                              |
| ------------------------------ | ------------------------------- | ---------- | ------------------------------------------------------------------------ |
| `grandFinal`                   | `'none' \| 'single' \| 'reset'` | `'none'`   | Whether the bracket winners meet, and whether a bracket reset can follow |
| `losersStartRoundsBeforeFinal` | `number`                        | all rounds | Start the losers bracket later, eliminating early losers outright        |

See [Double Elimination](#double-elimination) for the structure it produces.

### `generateRoundRobin(options)`

| Option       | Type     | Default | Description                                                                |
| ------------ | -------- | ------- | -------------------------------------------------------------------------- |
| `legs`       | `number` | `1`     | How many times everyone plays everyone; later legs swap sides              |
| `groupCount` | `number` | `1`     | Split the field into snake-seeded groups, each playing its own round robin |

See [Round Robin](#round-robin) for scheduling details.

### `calculateStandings(options)`

Builds a standings table from whatever results exist so far.

```typescript
const table = calculateStandings({
  matches, // the fixtures to rank
  results, // [{ matchId, score1, score2 }] or [{ matchId, winnerId }]
  participants, // optional: enables the 'seed' tiebreaker
  points: { win: 3, draw: 1, loss: 0 },
  tiebreakers: ['headToHead', 'scoreDifference', 'scoreFor', 'wins'],
})
```

| Option         | Type                    | Default                                                 | Description                                                   |
| -------------- | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------- |
| `matches`      | `TournamentMatch[]`     | —                                                       | The fixtures to rank. Group stages are ranked per group       |
| `results`      | `MatchResult[]`         | —                                                       | Results so far; fixtures without one count as unplayed        |
| `participants` | `Participant[]`         | `[]`                                                    | Needed only for the `seed` tiebreaker and to order level rows |
| `points`       | `Partial<PointsConfig>` | `{ win: 3, draw: 1, loss: 0 }`                          | Points per outcome                                            |
| `tiebreakers`  | `Tiebreaker[]`          | `['headToHead', 'scoreDifference', 'scoreFor', 'wins']` | Applied in order to participants level on points              |

Returns one `Standing` per participant per group, ordered by group and then by
rank:

```typescript
interface Standing {
  registrationId: string
  group: number | null
  rank: number // 1-based; level participants share a rank
  played: number
  won: number
  drawn: number
  lost: number
  scoreFor: number
  scoreAgainst: number
  scoreDifference: number
  points: number
}
```

Results come in two shapes, and you can mix them:

```typescript
{ matchId, score1: 3, score2: 1 }  // scores: higher wins, equal is a draw
{ matchId, winnerId: 'player-7' }  // outcome only
{ matchId, winnerId: null }        // a draw with no score recorded
```

A result naming an unknown match, a duplicate result, half a scoreline, or a
winner who did not play in that match all throw.

### `qualifiersFromStandings(options)`

Selects who advances from a group stage and seeds them, turning a `Standing[]`
into the `Participant[]` the next stage needs.

```typescript
const qualifiers = qualifiersFromStandings({
  standings: table, // from calculateStandings
  perGroup: 2, // top two of every group
  bestRemaining: 0, // plus the best rows left behind, compared across groups
  order: 'rankThenPoints', // how the qualifiers are seeded
})

const playoffs = generateDoubleElimination({
  eventId: 'champions-2026-playoffs',
  participants: qualifiers,
  idFactory,
  grandFinal: 'single',
})
```

| Option          | Type                                                       | Default            | Description                                                   |
| --------------- | ---------------------------------------------------------- | ------------------ | ------------------------------------------------------------- |
| `standings`     | `Standing[]`                                               | —                  | The table to read, usually straight from `calculateStandings` |
| `perGroup`      | `number`                                                   | `0`                | How many qualify from each group, taken by `rank`             |
| `bestRemaining` | `number`                                                   | `0`                | Additionally take this many of the best rows `perGroup` left  |
| `order`         | `'rankThenPoints' \| 'pointsThenRank' \| (a, b) => number` | `'rankThenPoints'` | How the qualifiers are ordered before being seeded `1..N`     |

Pass at least one of `perGroup` and `bestRemaining`. A table with no groups
(`group: null`) counts as a single pool, which is how you take the top eight of
a league into a playoff.

**Ordering.** `'rankThenPoints'` compares finishing position first, so every
group winner is seeded above every runner-up and record only separates rows
that finished level — the usual shape of a seeded draw. `'pointsThenRank'`
compares record first and ignores which group it was earned in; only reach for
it when the groups are the same size, since points across unequal groups are
not comparable. Anything else is a comparator, following the
`Array.prototype.sort` contract.

`bestRemaining` follows the same order, so under the default it is the "best
third-placed teams" rule: every third-placed row is considered ahead of every
fourth-placed one. The rows it selects are seeded into the field rather than
appended after it, so under `'pointsThenRank'` a strong third-placed team can
outseed a weak group winner.

**Ties.** Participants nothing separates share a rank, so a tie across the cut
line would decide who advances by array order. It throws instead, naming the
tied participants:

```
Group 1 has 2 participants tied on rank 2 for 1 remaining place(s):
"player-7", "player-11". Add 'seed' to the tiebreakers passed to
calculateStandings, or resolve the tie before selecting
```

End the `tiebreakers` you pass to `calculateStandings` with `'seed'` to
guarantee a strict table, or resolve the tie yourself — a playoff, a drawing of
lots — and rank again. A tie that sits entirely inside or entirely outside the
qualifying places is not ambiguous and passes through.

Seeding is a softer question, since everyone selected is through either way:
qualifiers the `order` cannot separate keep the order they had in `standings`.

## Double Elimination

### Placements

By default there is no grand final: the winners final decides 1st/2nd and the
losers final decides 3rd/4th.

| Match                 | Winner    | Loser     |
| --------------------- | --------- | --------- |
| Winners bracket final | 1st place | 2nd place |
| Losers bracket final  | 3rd place | 4th place |

With `grandFinal: 'single'` or `'reset'` it runs as a standard double
elimination instead — the winners final loser drops into the losers final, and
the two bracket winners meet:

| Match                 | Winner        | Loser          |
| --------------------- | ------------- | -------------- |
| Winners bracket final | → grand final | → losers final |
| Losers bracket final  | → grand final | 3rd place      |
| Grand final           | 1st place     | 2nd place      |

### Match counts

For a bracket size `B` (the next power of two at or above the participant
count):

|                        | Winners | Losers  | Grand final         | Total    |
| ---------------------- | ------- | ------- | ------------------- | -------- |
| `grandFinal: 'none'`   | `B - 1` | `B - 3` | —                   | `2B - 4` |
| `grandFinal: 'single'` | `B - 1` | `B - 2` | 1                   | `2B - 2` |
| `grandFinal: 'reset'`  | `B - 1` | `B - 2` | 2 (one conditional) | `2B - 1` |

| Participants | Bracket size | No grand final | With `'single'` |
| ------------ | ------------ | -------------- | --------------- |
| 4            | 4            | 4              | 6               |
| 5–8          | 8            | 12             | 14              |
| 9–16         | 16           | 28             | 30              |
| 17–32        | 32           | 60             | 62              |

Matches are returned winners bracket first, then losers bracket, then grand
final, each ordered by round and then by `bracketPosition`.

### Match routing

**Winners bracket** — winner of position `P` goes to the next round at position
`⌊P/2⌋`, slot `(P % 2) + 1`. The loser drops to the losers bracket; without a
grand final the winners final loser is 2nd place, and a walkover has no loser
at all, so its `loserTo` is `null`.

**Losers bracket** — round 1 pairs off the first wave of losers. After that,
even rounds take a fresh wave of winners bracket losers into slot 2 and hold as
many matches as the round before them; odd rounds are played between losers
bracket survivors only, halving the match count.

**Crossover ordering** — a player dropping into the losers bracket must not
immediately run into someone they already beat, so each wave of losers is
reordered before it drops in, and the ordering rotates from wave to wave:

| Wave of losers | Ordering                          |
| -------------- | --------------------------------- |
| 1st            | paired up (`⌊position / 2⌋`)      |
| 2nd            | reversed                          |
| 3rd            | reversed and shifted by half      |
| 4th            | shifted by half                   |
| 5th            | unchanged, then the cycle repeats |

Rotating matters most in large brackets. Measured over 200 random 64-player
tournaments, it pushes the first possible rematch from losers round 4 out to
losers round 7 and cuts rematches from ~2.8 per tournament to ~0.4. A rematch
in the last losers rounds is unavoidable in any double elimination bracket.

### Grand final and bracket reset

```typescript
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants,
  idFactory: () => crypto.randomUUID(),
  grandFinal: 'reset',
})
```

Enabling a grand final adds one losers bracket round — the losers final, where
the winners final loser enters — plus the grand final itself, returned with
`bracketType: 'grandFinal'`.

With `'reset'` the grand final is two matches, `round: 1` and `round: 2`. Match
2 is **only played when the losers bracket representative wins match 1**;
otherwise the winners bracket representative is champion with an unbeaten
record and match 2 is dropped. Both finalists are routed into it (`winnerTo`
into slot 1, `loserTo` into slot 2) so the usual propagation works unchanged —
your code decides whether it happens:

```typescript
const [grandFinal, reset] = matches
  .filter((m) => m.bracketType === 'grandFinal')
  .sort((a, b) => a.round - b.round)

// slot 2 of the grand final is the losers bracket representative
const resetRequired = grandFinalWinnerId === grandFinal.registration2Id
```

A grand final needs a losers bracket, so it cannot be combined with
`losersStartRoundsBeforeFinal: 0`, and needs at least 3 participants.

### Delayed losers bracket

By default every loser except the finalist drops to the losers bracket. Use
`losersStartRoundsBeforeFinal` to open it later, so early losers are eliminated
outright — useful when a full double elimination would not fit the schedule.

```typescript
// 16 players: Ro16 is single elimination, QF and SF losers get a second life
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants,
  idFactory: () => crypto.randomUUID(),
  losersStartRoundsBeforeFinal: 2,
})
```

| WB round | Name  | Loser's fate            |
| -------- | ----- | ----------------------- |
| Round 1  | Ro16  | eliminated              |
| Round 2  | QF    | drops to losers round 1 |
| Round 3  | SF    | drops to losers round 2 |
| Round 4  | Final | 2nd place               |

| Value               | Result                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `0`                 | Pure single elimination — prefer [`generateSingleElimination`](#generatesingleeliminationoptions) |
| `1`                 | Single elimination with a third place match (needs at least 3 participants)                       |
| `2+`                | Delayed double elimination                                                                        |
| `winnersRounds - 1` | The default: full double elimination                                                              |

## Round Robin

Everyone plays everyone. Both participants are known when the fixture is
generated, so there is no routing to follow — record results and rank them with
[`calculateStandings`](#calculatestandingsoptions).

```typescript
const fixtures = generateRoundRobin({
  eventId: 'league-2026',
  participants, // 10 clubs
  idFactory: () => crypto.randomUUID(),
  legs: 2, // home and away
})
// 90 matches across 18 rounds
```

### Scheduling

Fixtures are built with the circle method: one entrant stays put while the rest
rotate around them, which pairs everyone exactly once in the fewest rounds
possible.

- **Rounds per leg** — `n - 1` for an even field, `n` for an odd one
- **Matches per round** — `⌊n / 2⌋`
- **Odd fields** — each participant sits out exactly one round; a rest is simply
  the absence of a fixture, never a match with an empty slot
- **Seeded** — entrants enter the circle in seed order, so the top two seeds
  meet in the final round and round 1 opens with the widest mismatch
- **Balanced sides** — `registration1Id` is the "home" side, and the schedule
  splits sides as evenly as the round count allows: exactly even when everyone
  plays an even number of games, off by one otherwise

### Legs

`legs: 2` replays every fixture with the sides swapped, which is how a
home-and-away season is built and leaves every participant with a perfectly even
split of sides. Round numbering continues across legs (a 6-team, 2-leg season
runs rounds 1–10), and each match carries the `leg` it belongs to.

### Group stages

`groupCount` splits the field into groups that each play their own round robin.
Participants are distributed by snake seeding, so group strength stays even:

```
Seeds 1 2 3 4 → groups A B C D
Seeds 5 6 7 8 → groups D C B A
```

```typescript
const groupStage = generateRoundRobin({
  eventId: 'world-cup',
  participants, // 32 teams
  idFactory: () => crypto.randomUUID(),
  groupCount: 8, // 8 groups of 4
})

const groupA = groupStage.filter((m) => m.group === 0)
```

Group sizes stay within one participant of each other, rounds are numbered from
1 within each group, and no fixture ever crosses groups. `group` is `null` when
there is only one pool.

### Standings and tiebreakers

```typescript
const table = calculateStandings({
  matches: groupStage,
  results,
  participants, // required by the 'seed' tiebreaker below
  // Ranks are shared when nothing separates two participants, so end with
  // 'seed' whenever you need a strict cut — seeds are unique, so it always
  // decides, and every rank becomes a distinct position.
  tiebreakers: ['headToHead', 'scoreDifference', 'scoreFor', 'wins', 'seed'],
})

const qualifiers = qualifiersFromStandings({ standings: table, perGroup: 2 })
```

Leave `seed` out and a three-way tie really does give you three rows at rank 1 —
which is the honest answer, and the one to show a human before a playoff draw.
`qualifiersFromStandings` will then throw rather than cut through the tie; see
[Multi-Stage Tournaments](#multi-stage-tournaments).

Rows are ranked on points first, then by each tiebreaker in turn — and each
tiebreaker only applies to the rows the previous one left level, exactly as a
real competition rulebook works:

| Tiebreaker        | Compares                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `headToHead`      | points, then score difference, in the matches the tied participants played against each other |
| `scoreDifference` | `scoreFor - scoreAgainst`                                                                     |
| `scoreFor`        | total scored                                                                                  |
| `wins`            | number of wins                                                                                |
| `seed`            | the stronger seed ranks higher — a deterministic last resort                                  |

Participants nothing can separate share a rank (`1, 2, 2, 4`) and are listed
strongest seed first. To follow a rulebook that puts goal difference before
head-to-head, just say so:

```typescript
calculateStandings({
  matches,
  results,
  tiebreakers: ['scoreDifference', 'scoreFor', 'headToHead'],
})
```

## Multi-Stage Tournaments

A championship is often more than one format: pools first, then a bracket for
whoever survives them. Each stage is a self-contained set of matches, and
`qualifiersFromStandings` is the join between them.

```typescript
// Stage 1 — eight groups of four
const groupStage = generateRoundRobin({
  eventId: 'champions-2026-groups',
  participants,
  idFactory,
  groupCount: 8,
})

// ...play it, collecting results...

const table = calculateStandings({
  matches: groupStage,
  results,
  participants,
  // 'seed' last, so the cut is always strict
  tiebreakers: ['headToHead', 'scoreDifference', 'scoreFor', 'wins', 'seed'],
})

// Stage 2 — the sixteen who came through, seeded by how they finished
const playoffs = generateDoubleElimination({
  eventId: 'champions-2026-playoffs',
  participants: qualifiersFromStandings({ standings: table, perGroup: 2 }),
  idFactory,
  grandFinal: 'single',
})
```

Formats mix in any combination: groups into a single elimination bracket,
a first-round knockout into a round robin final pool, three stages, or a
consolation bracket for the participants `qualifiersFromStandings` left behind.

### What the package does, and what your application does

Every function here is pure: participants and options go in, matches or rows
come out, and nothing is remembered between calls. That boundary is deliberate,
and it is what makes a mixed-format championship the application's to own.

The package handles the parts that are the same everywhere:

- generating each stage's fixtures
- ranking a stage that has been played
- deciding who advances, and what seeds they carry into the next stage

Your application handles the parts that are yours:

- **storage** — the matches and the results live in your database
- **lifecycle** — what "the group stage is finished" means for you, whether
  that is every result recorded, a deadline passing, or an admin pressing a
  button
- **generating the next stage at the right moment**, since stage 2 does not
  exist until stage 1 is decided
- **overrides** — withdrawals, disqualifications, wildcards, a qualifier you
  replace by hand
- **scheduling, venues and presentation**

Give each stage its own `eventId` — `'champions-2026-groups'` and
`'champions-2026-playoffs'` above — so its matches stay easy to query, and
store the relationship between stages in your own schema. The package never
needs to know that the two are connected.

## Seeding

Brackets use standard tournament seeding, so the strongest seeds are kept apart
for as long as possible:

- **Seeds 1 and 2** can only meet in the final
- **Seeds 1–4** can only meet in the semifinals or later
- **Seeds 1–8** can only meet in the quarterfinals or later

For 8 participants, round 1 is `1v8, 4v5, 2v7, 3v6`. For 32, seed 1 leads the
top half, seed 2 the bottom half, and seeds 3–4 sit in the opposite quarters
from them.

Participants are ranked by seed before placement, so seed values only need to be
unique and correctly ordered — `[10, 20, 30]` and `[1, 2, 3]` produce the same
tournament. Byes go to the strongest seeds.

## Bye Handling

When the participant count isn't a power of 2, byes are created and resolved at
generation time — through the whole bracket, not just the first round:

```typescript
// 7 participants in a bracket of 8 = 1 bye
const matches = generateDoubleElimination({
  eventId: 'event-1',
  participants, // seeds 1-7
  idFactory: () => crypto.randomUUID(),
})

// Seed 1 vs seed 8 (missing) = seed 1 is already placed in round 2
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
no routing, which keeps round and position numbering stable for rendering. The
question your UI actually needs answered is whether an empty slot will ever be
filled — a slot nobody feeds and nobody occupies never will:

```typescript
const fed = new Set(
  matches.flatMap((m) => [
    m.winnerTo ? `${m.winnerTo}#${m.winnerToSlot}` : null,
    m.loserTo ? `${m.loserTo}#${m.loserToSlot}` : null,
  ])
)

const willFill = (match: TournamentMatch, slot: 1 | 2) =>
  (slot === 1 ? match.registration1Id : match.registration2Id) !== null ||
  fed.has(`${match.id}#${slot}`)

const statusOf = (match: TournamentMatch) => {
  const [one, two] = [willFill(match, 1), willFill(match, 2)]
  if (!one && !two) return 'unused' // byes emptied it out; skip it
  if (!one || !two) return 'walkover' // whoever arrives advances unopposed
  return 'playable'
}
```

Most walkovers are resolved for you, with the advancing player already placed in
the next match. The one that cannot be is a walkover whose entrant is still
unknown — a bracket so small that the bye reaches the last match, such as the
third place match in a 3-participant tournament. Treat it as a walkover for
whoever turns up.

Round robins need none of this: an odd field simply means each participant rests
for one round, and a rest is the absence of a fixture rather than an empty match.

## Performance

Generation is linear in the number of matches produced, with no runtime
dependencies. Measured on Node 22, best of 15 runs:

| Participants | Single elimination | Double elimination | Round robin              |
| ------------ | ------------------ | ------------------ | ------------------------ |
| 32           | 0.1 ms             | 0.2 ms             | 0.5 ms (496 matches)     |
| 128          | 0.4 ms             | 0.6 ms             | 2.8 ms (8,128 matches)   |
| 512          | 0.9 ms             | 1.4 ms             | 113 ms (130,816 matches) |
| 4096         | 5.7 ms             | 15.2 ms            | —                        |

A round robin is quadratic by nature — 512 participants really is 130,816
fixtures — which is exactly why large fields use `groupCount`. Building
standings from 32,640 played fixtures takes about 36 ms.

## Migrating from 1.x

`generateDoubleElimination` still takes the same options and produces the same
brackets, so most upgrades are just `npm install double-elimination@2`. Four
things changed:

1. **`bracketType` gained values.** It is now
   `'winners' | 'losers' | 'grandFinal' | 'roundRobin'`. TypeScript code that
   exhaustively narrows on it needs the new cases, even if you never enable them.
2. **Every match carries `group` and `leg`.** They are `null` and `1` in
   brackets. If you persist matches with a strict schema, add the columns or
   drop the fields.
3. **Types were renamed**, with the old names kept as deprecated aliases:
   `BracketMatch` → `TournamentMatch`, `BracketType` → `MatchType`,
   `GeneratorOptions` → `DoubleEliminationOptions`.
4. **The 1.x losers bracket layout changed for 32+ participants** as part of the
   rematch fix, and byes now resolve across the whole bracket. Finish in-flight
   tournaments on the version that created them.

Single elimination used to be spelled `losersStartRoundsBeforeFinal: 0`. That
still works, but `generateSingleElimination` says what it means:

```typescript
// 1.x
generateDoubleElimination({ ...options, losersStartRoundsBeforeFinal: 1 })

// 2.x
generateSingleElimination({ ...options, thirdPlaceMatch: true })
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md)
for details on our code of conduct and the process for submitting pull requests.

More worked examples live in [EXAMPLES.md](EXAMPLES.md), and
`npm run demo -- round-robin 10 groups=2` prints any tournament this package can
generate.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

## License

MIT
