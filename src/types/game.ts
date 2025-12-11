export type Rank =
  | 'Great Dalmuti' // 1
  | 'Lesser Dalmuti' // 2
  | 'Great Merchant' // 3
  | 'Lesser Merchant' // 4
  | 'Commoner' // 5-8
  | 'Peasant' // 9-11
  | 'Great Peasant' // 12
  | 'Jester'; // 13 (Wildcard)

export interface Card {
  id?: string; // Unique instance ID
  rank: number; // 1 to 12, 13 for Jester
  count: number; // Total count of this card in deck (e.g., rank 1 has 1 card, rank 12 has 12 cards)
  name: string;
  isJester?: boolean;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  rank?: number; // Previous game rank (1 = Dalmuti, etc.)
  isBot: boolean;
  hasPassed: boolean;
  finishedRank?: number; // Rank achieved in current game
  characterId: string; // ID for the visual avatar
  botDifficulty?: BotLevel; // If isBot is true
}

export type BotLevel = 'easy' | 'medium' | 'hard';

export interface Character {
  id: string;
  name: string;
  image: string; // Path or class for visualization
}

export const CHARACTERS: Character[] = [
  { id: 'king', name: '국왕', image: '/avatars/king.png' },
  { id: 'queen', name: '여왕', image: '/avatars/queen.png' },
  { id: 'knight', name: '기사', image: '/avatars/knight.png' },
  { id: 'merchant', name: '상인', image: '/avatars/merchant.png' },
  { id: 'peasant', name: '농부', image: '/avatars/peasant.png' },
  { id: 'jester', name: '광대', image: '/avatars/jester.png' },
  { id: 'wizard', name: '마법사', image: '/avatars/wizard.png' },
  { id: 'thief', name: '도적', image: '/avatars/thief.png' },
];

export interface GameState {
  roomId: string;
  players: Player[];
  currentTurnIndex: number;
  lastPlayedCards: Card[] | null;
  lastPlayerId: string | null; // Who played the last set of cards
  deck: Card[];
  status: 'waiting' | 'playing' | 'finished';
  round: number;
  winners: Player[]; // List of players who have finished in order
}

export const CARD_DEFINITIONS: Card[] = [
  { rank: 1, count: 1, name: '달무티' },
  { rank: 2, count: 2, name: '대주교' },
  { rank: 3, count: 3, name: '의전장관' },
  { rank: 4, count: 4, name: '남작부인' },
  { rank: 5, count: 5, name: '수녀원장' },
  { rank: 6, count: 6, name: '기사' },
  { rank: 7, count: 7, name: '재봉사' },
  { rank: 8, count: 8, name: '석공' },
  { rank: 9, count: 9, name: '요리사' },
  { rank: 10, count: 10, name: '양치기 소녀' },
  { rank: 11, count: 11, name: '채석공' },
  { rank: 12, count: 12, name: '농노' },
  { rank: 13, count: 2, name: '어릿광대', isJester: true },
];
