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
    // Calculate overlap based on card count to fit screen
    // Max width for hand is usually screen width - padding
    // If cards * width > screen width, we need negative margin

    // Simple heuristic: if cards > 5, start overlapping more
    const getCardStyle = (index: number, total: number) => {
        const baseOverlap = -30; // Default overlap
        const mobileOverlap = total > 5 ? -50 + (total * -2) : -20; // Increase overlap as cards increase

        // This is a simplified approach. Ideally we use a container and calc width.
        // For Tailwind, we can use dynamic classes or inline styles.
        return {
            marginLeft: index === 0 ? 0 : `${Math.max(mobileOverlap, -80)}px`,
            zIndex: index
        };
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 flex justify-center items-end bg-gradient-to-t from-black/80 via-[#2c1e14]/50 to-transparent pointer-events-none h-64 z-10">
            <motion.div
                className="flex items-end pointer-events-auto pb-4 max-w-full overflow-x-auto no-scrollbar px-4 pt-10"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
            >
                {cards.map((card, index) => {
                    const isSelected = selectedCards.some(c => c.id === card.id);
                    // Dynamic negative margin for mobile responsiveness
                    // We use inline style for precise control based on card count
                    const marginValue = cards.length > 5
                        ? (window.innerWidth < 640 ? -40 - (cards.length * 1.5) : -30)
                        : (window.innerWidth < 640 ? -20 : -10);

                    return (
                        <div
                            key={card.id || index}
                            style={{
                                marginLeft: index === 0 ? 0 : `${Math.max(marginValue, -70)}px`,
                                zIndex: index,
                                transition: 'margin 0.3s ease'
                            }}
                        >
                            <Card
                                card={card}
                                index={index}
                                isSelected={isSelected}
                                onClick={() => onToggleSelect(card)}
                                isPlayable={isMyTurn}
                            />
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};
