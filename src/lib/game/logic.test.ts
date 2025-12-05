import { describe, it, expect } from 'vitest';
import { isValidMove } from './logic';
import { Card } from '../../types/game';

// Helper to create cards
const createCard = (rank: number, name: string = 'Test'): Card => ({ rank, count: rank, name });

describe('Dalmuti Game Rules', () => {
    it('should allow any move if table is empty', () => {
        const cards = [createCard(10)];
        expect(isValidMove(cards, null)).toBe(true);
    });

    it('should allow playing lower rank (better) cards of same quantity', () => {
        const table = [createCard(10), createCard(10)];
        const hand = [createCard(9), createCard(9)];
        expect(isValidMove(hand, table)).toBe(true);
    });

    it('should REJECT playing higher rank (worse) cards', () => {
        const table = [createCard(10)];
        const hand = [createCard(11)];
        expect(isValidMove(hand, table)).toBe(false);
    });

    it('should REJECT playing different quantity', () => {
        const table = [createCard(10), createCard(10)];
        const hand = [createCard(9)]; // Only 1
        expect(isValidMove(hand, table)).toBe(false);
    });

    it('should REJECT playing mixed ranks', () => {
        const hand = [createCard(10), createCard(11)];
        expect(isValidMove(hand, null)).toBe(false);
    });
});
