import { Card, CARD_DEFINITIONS, Player } from '../../types/game';

export function createDeck(): Card[] {
    const deck: Card[] = [];
    CARD_DEFINITIONS.forEach((def) => {
        for (let i = 0; i < def.count; i++) {
            deck.push({ ...def, id: `${def.rank}-${i}` });
        }
    });
    return deck;
}

export function shuffle(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

export function dealCards(players: Player[], deck: Card[]): Player[] {
    const shuffled = shuffle(deck);
    const newPlayers = players.map(p => ({ ...p, hand: [] as Card[], hasPassed: false, finishedRank: undefined }));

    let playerIndex = 0;
    while (shuffled.length > 0) {
        const card = shuffled.pop();
        if (card) {
            newPlayers[playerIndex].hand.push(card);
            playerIndex = (playerIndex + 1) % newPlayers.length;
        }
    }

    // Sort hands
    newPlayers.forEach(p => {
        p.hand.sort((a, b) => a.rank - b.rank);
    });

    return newPlayers;
}

export function isValidMove(
    selectedCards: Card[],
    lastPlayedCards: Card[] | null
): boolean {
    if (selectedCards.length === 0) return false;

    // All selected cards must be the same rank (or Jesters acting as wildcards)
    // Simplified logic: Check if all non-Jester cards are same rank
    const nonJesters = selectedCards.filter(c => !c.isJester);

    // If only jesters, they count as 13 (unless played as wildcards, which is complex, 
    // but usually Jesters are played alone or with other cards to match count)
    // Standard rule: Jesters match the rank of the other cards played with them.
    // If played alone, they are rank 13.

    let moveRank = 13;
    if (nonJesters.length > 0) {
        const firstRank = nonJesters[0].rank;
        if (!nonJesters.every(c => c.rank === firstRank)) {
            return false; // Mixed ranks not allowed
        }
        moveRank = firstRank;
    }

    // If it's the first move (or free turn), any valid set is okay
    if (!lastPlayedCards) {
        return true;
    }

    // Must match the quantity of the last played cards
    if (selectedCards.length !== lastPlayedCards.length) {
        return false;
    }

    // Must be a lower rank (better card) than the last played
    // Note: In Dalmuti, lower number is better. 1 is best, 12 is worst.
    // Exception: Jester (13) is worst if played alone.

    const lastRank = lastPlayedCards.find(c => !c.isJester)?.rank || 13;

    return moveRank < lastRank;
}
