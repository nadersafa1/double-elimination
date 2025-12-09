export interface Participant {
    registrationId: string;
    seed: number;
}
export interface BracketMatch {
    id: string;
    eventId: string;
    round: number;
    matchNumber: number;
    registration1Id: string | null;
    registration2Id: string | null;
    bracketPosition: number;
    winnerTo: string | null;
    winnerToSlot: number | null;
    loserTo: string | null;
    loserToSlot: number | null;
    bracketType: 'winners' | 'losers';
}
export type IdFactory = () => string;
export interface GeneratorOptions {
    eventId: string;
    participants: Participant[];
    idFactory: IdFactory;
}
