# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

