export const processByes = (matches) => {
    const matchMap = new Map(matches.map((m) => [m.id, m]));
    const processed = new Set();
    // Process all round 1 winners bracket matches first
    const round1Winners = matches.filter((m) => m.bracketType === 'winners' && m.round === 1);
    for (const match of round1Winners) {
        processMatchBye(match, matchMap, processed);
    }
    // Continue processing any cascading byes
    let changed = true;
    while (changed) {
        changed = false;
        for (const match of matches) {
            if (!processed.has(match.id) && isByeMatch(match)) {
                processMatchBye(match, matchMap, processed);
                changed = true;
            }
        }
    }
};
const isByeMatch = (match) => {
    const has1 = match.registration1Id !== null;
    const has2 = match.registration2Id !== null;
    // Bye: exactly one participant
    return (has1 && !has2) || (!has1 && has2);
};
const processMatchBye = (match, matchMap, processed) => {
    if (processed.has(match.id))
        return;
    const has1 = match.registration1Id !== null;
    const has2 = match.registration2Id !== null;
    if (!has1 && !has2)
        return; // No players yet
    if (has1 && has2)
        return; // Both players present, not a bye
    // Auto-advance the present player
    const winnerId = match.registration1Id ?? match.registration2Id;
    processed.add(match.id);
    // Advance winner
    if (match.winnerTo && match.winnerToSlot && winnerId) {
        const targetMatch = matchMap.get(match.winnerTo);
        if (targetMatch) {
            if (match.winnerToSlot === 1) {
                targetMatch.registration1Id = winnerId;
            }
            else {
                targetMatch.registration2Id = winnerId;
            }
        }
    }
    // No loser to advance for a bye
};
