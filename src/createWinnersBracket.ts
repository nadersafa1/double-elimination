import { BracketMatch, IdFactory } from './types';

export const createWinnersBracket = (
  eventId: string,
  bracketSize: number,
  rounds: number,
  idFactory: IdFactory
): BracketMatch[] => {
  const matches: BracketMatch[] = [];
  const matchIdMap = new Map<string, string>(); // key: "round-position" -> matchId

  // Create matches for each round
  for (let round = 1; round <= rounds; round++) {
    const matchCount = bracketSize / Math.pow(2, round);

    for (let pos = 0; pos < matchCount; pos++) {
      const matchId = idFactory();
      matchIdMap.set(`${round}-${pos}`, matchId);

      matches.push({
        id: matchId,
        eventId,
        round,
        matchNumber: pos + 1,
        registration1Id: null,
        registration2Id: null,
        bracketPosition: pos,
        winnerTo: null,
        winnerToSlot: null,
        loserTo: null,
        loserToSlot: null,
        bracketType: 'winners',
      });
    }
  }

  // Wire winner routing within winners bracket
  for (const match of matches) {
    if (match.round < rounds) {
      const nextPos = Math.floor(match.bracketPosition / 2);
      const nextSlot = (match.bracketPosition % 2) + 1;
      const nextMatchId = matchIdMap.get(`${match.round + 1}-${nextPos}`);

      if (nextMatchId) {
        match.winnerTo = nextMatchId;
        match.winnerToSlot = nextSlot;
      }
    }
  }

  return matches;
};

