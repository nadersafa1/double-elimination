import {
  BaseOptions,
  IdFactory,
  Participant,
  TournamentMatch,
} from './types.js'

/**
 * Validates the options every format shares and re-ranks participants to 1..N.
 *
 * Callers commonly pass sparse or 0-based seeds; ranking makes those behave the
 * same as 1..N instead of silently leaving participants out of the tournament.
 */
export const rankParticipants = (options: BaseOptions): Participant[] => {
  const { eventId, participants, idFactory } = options

  if (typeof eventId !== 'string' || eventId.length === 0) {
    throw new Error('eventId must be a non-empty string')
  }
  if (typeof idFactory !== 'function') {
    throw new Error('idFactory must be a function returning unique ids')
  }
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('At least 2 participants required')
  }

  const seenIds = new Set<string>()
  const seenSeeds = new Set<number>()

  for (const participant of participants) {
    if (
      !participant ||
      typeof participant.registrationId !== 'string' ||
      participant.registrationId.length === 0
    ) {
      throw new Error('Every participant needs a non-empty registrationId')
    }
    if (
      typeof participant.seed !== 'number' ||
      !Number.isFinite(participant.seed)
    ) {
      throw new Error(
        `Participant "${participant.registrationId}" has a non-numeric seed`
      )
    }
    if (seenIds.has(participant.registrationId)) {
      throw new Error(
        `Duplicate registrationId: "${participant.registrationId}"`
      )
    }
    if (seenSeeds.has(participant.seed)) {
      throw new Error(`Duplicate seed: ${participant.seed}`)
    }
    seenIds.add(participant.registrationId)
    seenSeeds.add(participant.seed)
  }

  return [...participants]
    .sort((a, b) => a.seed - b.seed)
    .map((participant, index) => ({
      registrationId: participant.registrationId,
      seed: index + 1,
    }))
}

/** Reads an option that must be a whole number at or above `minimum`. */
export const readInteger = (
  value: number | undefined,
  fallback: number,
  minimum: number,
  name: string
): number => {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer of at least ${minimum}`)
  }
  return value
}

/** A repeating idFactory would silently cross-wire the tournament. */
export const assertUniqueIds = (matches: TournamentMatch[]): void => {
  const ids = new Set<string>()
  for (const match of matches) {
    if (typeof match.id !== 'string' || match.id.length === 0) {
      throw new Error('idFactory must return non-empty string ids')
    }
    if (ids.has(match.id)) {
      throw new Error(`idFactory returned a duplicate id: "${match.id}"`)
    }
    ids.add(match.id)
  }
}

/**
 * Builds a match, defaulting every field a format does not care about.
 *
 * Written out key by key rather than spread over defaults so that every match
 * in a tournament shares one object shape, which keeps large fields fast to
 * build and to iterate.
 */
export const createMatch = (
  fields: Pick<
    TournamentMatch,
    'eventId' | 'round' | 'bracketPosition' | 'bracketType'
  > &
    Partial<TournamentMatch>,
  idFactory: IdFactory
): TournamentMatch => ({
  id: idFactory(),
  eventId: fields.eventId,
  round: fields.round,
  matchNumber: fields.matchNumber ?? fields.bracketPosition + 1,
  registration1Id: fields.registration1Id ?? null,
  registration2Id: fields.registration2Id ?? null,
  bracketPosition: fields.bracketPosition,
  winnerTo: fields.winnerTo ?? null,
  winnerToSlot: fields.winnerToSlot ?? null,
  loserTo: fields.loserTo ?? null,
  loserToSlot: fields.loserToSlot ?? null,
  bracketType: fields.bracketType,
  group: fields.group ?? null,
  leg: fields.leg ?? 1,
})
