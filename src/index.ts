export { generateTournament } from './generateTournament.js'
export { generateSingleElimination } from './generateSingleElimination.js'
export { generateDoubleElimination } from './generateDoubleElimination.js'
export { generateRoundRobin } from './generateRoundRobin.js'
export { calculateStandings } from './calculateStandings.js'
export { qualifiersFromStandings } from './qualifiersFromStandings.js'
export { recordResult } from './recordResult.js'

export type {
  // Core
  Participant,
  TournamentMatch,
  MatchType,
  IdFactory,
  // Options
  BaseOptions,
  TournamentOptions,
  TournamentFormat,
  SingleEliminationOptions,
  DoubleEliminationOptions,
  RoundRobinOptions,
  GrandFinalFormat,
  // Standings
  MatchResult,
  PointsConfig,
  Tiebreaker,
  StandingsOptions,
  Standing,
  // Qualifiers
  QualifiersOptions,
  QualifierOrder,
  QualifierComparator,
  // Deprecated aliases, kept so existing imports keep working
  BracketMatch,
  BracketType,
  GeneratorOptions,
} from './types.js'
