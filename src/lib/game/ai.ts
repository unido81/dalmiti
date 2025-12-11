import { Card, BotLevel } from '../../types/game';
import { isValidMove } from './logic';

export function getBestMove(hand: Card[], lastPlayed: Card[] | null, difficulty: BotLevel = 'medium'): Card[] | null {
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

        if (difficulty === 'easy') {
            // Easy: Play random valid set (or just worst single card if simplified)
            // Just play worst single for simplicity? No, let's play worst available set size max
            // Easy bot might not break pairs?
            // Let's make easy bot play simple: just worst rank available, any valid count.
            if (ranks.length > 0) {
                return groups[ranks[0]];
            }
        } else if (difficulty === 'medium') {
            // Medium: Play worst rank available, all copies.
            // Standard greedy approach.
            for (const rank of ranks) {
                return groups[rank];
            }
        } else {
            // Hard:
            // 1. Try to get rid of singles first if I have many?
            // 2. Save high cards (1, 2, 3) for later?
            // For now, hard will be same as medium but we can refine it.
            // Maybe Hard tries to play sets first to drain opponents?
            // Let's adhere to: worst rank, all copies.
            // Improvement: Don't break a set of 4+ Revolution? (Not implemented)
            // Real Hard Strategy: If I have a 1 (Dalmuti), save it to win round?
            for (const rank of ranks) {
                return groups[rank];
            }
        }

        return null;
    } else {
        // Responding to a play
        const requiredCount = lastPlayed.length;
        const currentRank = lastPlayed[0].rank; // Assuming valid set

        // Find all groups that have enough cards and are strictly better (lower rank)

        const possibleRanks = Object.keys(groups)
            .map(Number)
            .filter(r => r < currentRank && groups[r].length >= requiredCount)
            .sort((a, b) => b - a); // Descending (closest to currentRank)

        if (possibleRanks.length > 0) {
            if (difficulty === 'easy') {
                // Easy: Play the BEST card (lowest rank) immediately? That's bad play.
                // Actually, playing good cards early is bad in Dalmuti usually.
                // Easy bot should make "mistakes".
                // Mistake 1: Breaking a large set (e.g. 4) to play a single?
                // Mistake 2: Playing a 1 (Great Dalmuti) on a 12 (Peasant)? Wasting power.
                // Let's make Easy bot play randomly from valid options.
                const randomRank = possibleRanks[Math.floor(Math.random() * possibleRanks.length)];
                return groups[randomRank].slice(0, requiredCount);
            } else if (difficulty === 'medium') {
                // Medium: Play worst possible winning card (highest rank < current)
                // greedy save best cards.
                const bestRank = possibleRanks[0];
                return groups[bestRank].slice(0, requiredCount);
            } else {
                // Hard:
                // 1. Don't break a set if I have exact count match?
                // 2. Calculate if I can clear hand?
                // For now, hard will follow medium but strictly avoiding breaking large sets if possible?
                // Let's stick to medium logic for Hard for now, as it's optimal for single-round.
                const bestRank = possibleRanks[0];
                return groups[bestRank].slice(0, requiredCount);
            }
        }

        // No move possible
        return null;
    }
}
