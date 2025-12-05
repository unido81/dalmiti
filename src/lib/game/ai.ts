import { Card } from '../../types/game';
import { isValidMove } from './logic';

export function getBestMove(hand: Card[], lastPlayed: Card[] | null): Card[] | null {
    // Group hand by rank
    const groups: Record<number, Card[]> = {};
    hand.forEach(card => {
        if (!groups[card.rank]) groups[card.rank] = [];
        groups[card.rank].push(card);
    });

    // Helper to get all possible sets from a group
    const getSets = (cards: Card[], size: number): Card[][] => {
        if (cards.length < size) return [];
        // Just take the first 'size' cards for simplicity
        return [cards.slice(0, size)];
    };

    if (!lastPlayed) {
        // Leading the turn
        // Strategy: Play the largest set of the worst rank (highest number) possible
        // Or just play the worst single/set available.
        // Let's try to play the worst rank available.

        const ranks = Object.keys(groups).map(Number).sort((a, b) => b - a); // Descending (12 -> 1)

        for (const rank of ranks) {
            const cards = groups[rank];
            // Play all of them if possible? Or just one?
            // In Dalmuti, playing more cards is usually harder to beat.
            // But maybe saving a pair is better?
            // Simple AI: Play the max amount of the worst rank.
            return cards;
        }
        return null; // Should not happen if hand not empty
    } else {
        // Responding to a play
        const requiredCount = lastPlayed.length;
        const currentRank = lastPlayed[0].rank; // Assuming valid set

        // Find all groups that have enough cards and are strictly better (lower rank)
        // We want to play the "worst" possible winning card (highest rank < currentRank)
        // to save our best cards (rank 1, 2) for later.

        const possibleRanks = Object.keys(groups)
            .map(Number)
            .filter(r => r < currentRank && groups[r].length >= requiredCount)
            .sort((a, b) => b - a); // Descending (closest to currentRank)

        if (possibleRanks.length > 0) {
            const bestRank = possibleRanks[0];
            return groups[bestRank].slice(0, requiredCount);
        }

        // No move possible
        return null;
    }
}
