export const createLosersBracket = (eventId, bracketSize, rounds, idFactory) => {
    const matches = [];
    const matchIdMap = new Map();
    // Calculate matches per round
    // Odd rounds (crossover): receive fresh losers, fewer matches
    // Even rounds (consolidation): no new entries
    for (let round = 1; round <= rounds; round++) {
        const matchCount = getLosersMatchCount(bracketSize, round);
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
                bracketType: 'losers',
            });
        }
    }
    // Wire winner routing within losers bracket
    wireLosersBracketWinners(matches, matchIdMap, rounds);
    return matches;
};
const getLosersMatchCount = (bracketSize, round) => {
    // Pattern: pairs of rounds with same match count, then halves
    // R1,R2: bracketSize/4, R3,R4: bracketSize/8, R5,R6: bracketSize/16...
    // Formula: bracketSize / 2^(ceil(round/2) + 1)
    return bracketSize / Math.pow(2, Math.ceil(round / 2) + 1);
};
const wireLosersBracketWinners = (matches, idMap, totalRounds) => {
    for (const match of matches) {
        if (match.round >= totalRounds)
            continue;
        const isOddRound = match.round % 2 === 1;
        let nextPos;
        let nextSlot;
        if (isOddRound) {
            // Odd → Even (within pair): same position, slot 1
            nextPos = match.bracketPosition;
            nextSlot = 1;
        }
        else {
            // Even → Odd (crossing pairs): halve position, alternating slots
            nextPos = Math.floor(match.bracketPosition / 2);
            nextSlot = (match.bracketPosition % 2) + 1;
        }
        const nextMatchId = idMap.get(`${match.round + 1}-${nextPos}`);
        if (nextMatchId) {
            match.winnerTo = nextMatchId;
            match.winnerToSlot = nextSlot;
        }
    }
};
