import React from 'react';
import { Card as CardType } from '@/types/game';
import { Card } from './Card';
import { motion } from 'framer-motion';

interface HandProps {
    cards: CardType[];
    selectedCards: CardType[];
    onToggleSelect: (card: CardType) => void;
    isMyTurn: boolean;
}

export const Hand: React.FC<HandProps> = ({
    cards,
    selectedCards,
    onToggleSelect,
    isMyTurn
}) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center items-end bg-gradient-to-t from-black/80 via-[#2c1e14]/50 to-transparent pointer-events-none h-48 z-10">
            <motion.div
                className="flex items-end pointer-events-auto pb-4"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
            >
                {cards.map((card, index) => {
                    const isSelected = selectedCards.some(c => c.id === card.id);
                    return (
                        <Card
                            key={card.id || index}
                            card={card}
                            index={index}
                            isSelected={isSelected}
                            onClick={() => onToggleSelect(card)}
                            isPlayable={isMyTurn}
                        />
                    );
                })}
            </motion.div>
        </div>
    );
};
