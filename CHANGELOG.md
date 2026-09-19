# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`qualifiersFromStandings`**, the step between two stages of a championship:
  it turns a `Standing[]` into the seeded `Participant[]` the next stage needs,
  so a group stage can feed a bracket without hand-rolling the cut.
  - `perGroup` takes the top N of every group by `rank`; a table with no groups
    counts as one pool
  - `bestRemaining` additionally takes the best rows left behind, compared
    across groups — under the default order, the "best third-placed teams" rule
  - `order` seeds the qualifiers `1..N`: `'rankThenPoints'` (default) puts every
    group winner above every runner-up, `'pointsThenRank'` compares record
    first, and a comparator covers anything else
  - A tie across the cut line throws and names the tied participants, rather
    than advancing one of them by array order

## [2.0.0] - 2026-09-12

Three formats instead of one. `double-elimination` now generates single
elimination and round robin tournaments as well, all returning the same match
shape, plus a standings calculator for league and group play.

### Added

- **Round robin** via `generateRoundRobin`: circle-method fixtures seeded so the
  top two seeds meet in the final round, sides balanced as evenly as the round
  count allows, rests instead of empty matches for odd fields, multi-leg seasons
  (`legs`) that replay fixtures with the sides swapped, and snake-seeded group
  stages (`groupCount`).
- **Standings** via `calculateStandings`: points, wins, draws, losses, scores
  and ranks from whatever results exist so far, with a configurable points table
  and tiebreakers (`headToHead`, `scoreDifference`, `scoreFor`, `wins`, `seed`)
  applied in order, each only to the rows the previous one left level.
  Participants nothing separates share a rank.
- **Single elimination** via `generateSingleElimination`, with an optional
  `thirdPlaceMatch`. Previously this was only reachable through
  `losersStartRoundsBeforeFinal: 0`.
- **`generateTournament({ format, ... })`**, a discriminated union over all three
  formats, for applications that store the format as data.
- **Grand final support** for double elimination via the `grandFinal` option:
  - `'none'` (default) — the winners final decides 1st/2nd and the losers final
    decides 3rd/4th, as in 1.x
  - `'single'` — the winners final loser drops to the losers final and the two
    bracket winners meet once for the title
  - `'reset'` — as `'single'`, plus a bracket reset match, played only when the
    losers bracket representative wins the first grand final
- A `LICENSE` file, a CI workflow running typecheck, tests, build and a
  published-entry-point check on Node 18, 20 and 22, and an `npm run demo`
  script that prints any tournament the package can generate.

### Fixed

- **Byes no longer stall the losers bracket**: byes were only resolved in the
  first winners round, so with any participant count that isn't a power of 2 the
  losers bracket could contain matches that never became playable — a match
  waiting on a loser that does not exist, or a match with no entrants at all —
  and everything downstream of them stalled. Byes are now resolved through the
  whole bracket: walkover winners are pre-placed, a walkover no longer reserves a
  losers bracket slot (`loserTo` is `null`), and matches that could only ever
  receive one player are bypassed so the feeding match points at what came next.
  Unreachable matches are kept in the returned array with empty slots and no
  routing, so round and position numbering stays stable for rendering.
- **The published package now loads in Node**: the build emitted ES module syntax
  into a package with no `"type": "module"` and extensionless relative imports,
  so both `require('double-elimination')` and `import` failed outside a bundler.
  The package now ships separate ESM and CommonJS builds behind an `exports` map,
  verified on every CI run.
- **Rematch prevention in large brackets**: losers from winners round 3 onwards
  kept their bracket position, which let players meet opponents they had already
  beaten as early as losers round 4. Each wave of losers is now reordered on a
  rotating cycle (reverse, reverse-and-half-shift, half-shift, unchanged). Over
  200 random 64-player tournaments this moves the first possible rematch from
  losers round 4 to losers round 7 and cuts rematches from ~2.8 to ~0.4 per
  tournament. Brackets of 16 or fewer are unchanged.
- **Invalid participants are rejected instead of corrupting the bracket**: seeds
  that were not exactly `1..N` silently left participants out of the bracket, and
  duplicate seeds dropped players without warning. Participants are now ranked by
  seed, so any unique ascending seed values work, and duplicate seeds, duplicate
  `registrationId`s, non-numeric seeds, an `idFactory` that repeats ids, a
  missing `eventId`, and a fractional `losersStartRoundsBeforeFinal` all throw.
- **Exact bracket sizing**: `nextPowerOf2` used `Math.log2`, which is not
  guaranteed to be exact for large inputs; sizing is now integer arithmetic.

### Changed

- **`bracketType` is now `'winners' | 'losers' | 'grandFinal' | 'roundRobin'`.**
  TypeScript code that exhaustively narrows on it needs the new cases, even
  though neither value appears unless you ask for it.
- **Every match carries `group` and `leg`**, `null` and `1` respectively outside
  a round robin. Persisting matches with a strict schema means adding the
  columns or dropping the fields.
- **Types renamed**, with the old names kept as deprecated aliases:
  `BracketMatch` → `TournamentMatch`, `BracketType` → `MatchType`,
  `GeneratorOptions` → `DoubleEliminationOptions`.
- Brackets of 32 or more participants have a different losers bracket layout
  because of the routing fix above. A bracket generated with an earlier version
  will not match one regenerated with this version — finish in-flight
  tournaments on the version that created them.
- The package is published as ESM with a CommonJS fallback; `src` is published
  alongside `dist` so source maps resolve.
- The package description and keywords now cover all three formats. The npm
  name stays `double-elimination`.

### Migration

`generateDoubleElimination` takes the same options and produces the same
brackets for 16 participants or fewer, so most upgrades are just the install.
See [Migrating from 1.x](README.md#migrating-from-1x) for the four things to
check.

## [1.2.2] - 2024-12-16

### Changed

- **Website integration**: Moved interactive demo website into the main repository
- **Documentation**: Updated homepage URL to point to the new website location at `https://nadersafa1.github.io/double-elimination/`
- **Deployment**: Website now automatically deploys from the main repository via GitHub Actions

## [1.2.1] - 2024-12-15

### Added

- **Single elimination support**: Extended `losersStartRoundsBeforeFinal` to support values 0 and 1:
  - `losersStartRoundsBeforeFinal: 0` - Pure single elimination (no losers bracket)
  - `losersStartRoundsBeforeFinal: 1` - Single elimination with 3rd place match (only semifinal losers go to losers bracket)
  - Previously, the minimum value was 2 (delayed double elimination)

### Changed

- **Simplified API**: Removed `includeThirdPlaceMatch` option. The 3rd place match is now always included when a losers bracket exists. This simplifies the API while maintaining the same default behavior.

### Breaking Changes

- Removed `includeThirdPlaceMatch` option from `GeneratorOptions`. If you were using `includeThirdPlaceMatch: false`, you'll need to use `losersStartRoundsBeforeFinal: 0` for pure single elimination instead.

## [1.2.0] - 2024-12-11

### Fixed

- **Critical rematch prevention fix**: Fixed incorrect loser routing that caused early rematches in the losers bracket. The routing now follows the correct double elimination pattern:
  - **Round 1 losers**: Grouped by position (floor(position/2)) - unchanged
  - **Round 2 losers**: REVERSED positions to prevent rematches between players from the same bracket half
    - Example: WB R2 pos 0 (top half) → LB R2 pos N-1 (bottom half)
    - Example: WB R2 pos N-1 (bottom half) → LB R2 pos 0 (top half)
  - **Round 3+ losers**: Use SAME positions (not mirrored) to continue the crossover pattern correctly
  - This ensures players from opposite sides of the winners bracket meet in the losers bracket, preventing early rematches
  - Works correctly with delayed losers bracket (`losersStartRoundsBeforeFinal`)

### Added

- Comprehensive test suite to verify rematch prevention for various bracket sizes

## [1.1.2] - 2024-12-09

### Fixed

- **Losers bracket position routing**: Fixed incorrect position mapping when winners bracket losers drop to the losers bracket. Previously, players from the same side of the bracket could face each other in the losers bracket (potential rematches). Now positions are mirrored to create proper cross-bracket matchups.
  - WB R2+ losers are now routed to mirrored positions in the LB
  - Example: WB R2 pos 0 (top half) now faces LB R1 pos 1 winner (bottom half) instead of LB R1 pos 0 winner (same half)
  - Works correctly with delayed losers bracket (`losersStartRoundsBeforeFinal`)

## [1.1.1] - 2024-12-09

### Fixed

- **Critical seeding bug**: Fixed incorrect seed placement for brackets larger than 8 participants. Previously, seeds 1 and 2 could meet as early as quarterfinals in a 32-team bracket. Now correctly places seeds in opposite halves so they can only meet in the finals.
  - Seeds 1 and 2 are guaranteed to be in opposite halves of the bracket
  - Seeds 1-4 are guaranteed to be in different quarters
  - Proper standard tournament seeding ensures higher seeds only meet in later rounds

### Changed

- Replaced recursive seeding algorithm with iterative standard tournament seeding algorithm

## [1.1.0] - 2024-12-08

### Added

- **Delayed losers bracket start** (`losersStartRoundsBeforeFinal` option): Allows the tournament to start as single elimination, with losers bracket only beginning from a specified round before the finals
- Validation for `losersStartRoundsBeforeFinal` parameter (minimum 2, less than winnersRounds)

## [1.0.0] - 2024-12-07

### Added

- Initial release
- Double elimination bracket generation
- Standard tournament seeding (1v8, 4v5, 2v7, 3v6 pattern for 8 teams)
- Automatic bye handling and advancement
- Winners and losers bracket routing
- TypeScript support with full type definitions
- Simplified format: WB Finals winner = 1st, loser = 2nd; LB Finals winner = 3rd, loser = 4th
