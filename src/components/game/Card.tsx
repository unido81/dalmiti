import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '@/types/game';

interface CardProps {
    card: CardType;
    isSelected?: boolean;
    onClick?: () => void;
    isPlayable?: boolean;
    index?: number;
}

const getCardColors = (rank: number) => {
    if (rank === 1) return { border: 'border-purple-700', bg: 'bg-purple-100', text: 'text-purple-900', accent: 'bg-purple-200' }; // Dalmuti
    if (rank === 2) return { border: 'border-yellow-700', bg: 'bg-yellow-50', text: 'text-yellow-900', accent: 'bg-yellow-200' }; // Archbishop
    if (rank === 3) return { border: 'border-red-700', bg: 'bg-red-50', text: 'text-red-900', accent: 'bg-red-200' }; // Earl Marshal
    if (rank === 12) return { border: 'border-stone-600', bg: 'bg-stone-200', text: 'text-stone-800', accent: 'bg-stone-300' }; // Peasant
    if (rank === 13) return { border: 'border-green-600', bg: 'bg-green-100', text: 'text-green-900', accent: 'bg-green-200' }; // Jester

    // Default for others
    return { border: 'border-amber-700', bg: 'bg-amber-50', text: 'text-amber-900', accent: 'bg-amber-100' };
};

export const Card: React.FC<CardProps> = ({
    card,
    isSelected = false,
    onClick,
    isPlayable = true,
    index = 0
}) => {
    const colors = getCardColors(card.rank);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{
                opacity: 1,
                y: isSelected ? -30 : 0,
                scale: isSelected ? 1.1 : 1,
                zIndex: isSelected ? 50 : index
            }}
            whileHover={{ y: -15, zIndex: 40, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={isPlayable ? onClick : undefined}
            className={`
                relative w-32 h-48 rounded-lg shadow-xl cursor-pointer select-none
                border-[6px] ${colors.border} ${colors.bg}
                flex flex-col justify-between overflow-hidden
                ${isSelected ? 'ring-4 ring-yellow-400 shadow-2xl' : ''}
                ${isPlayable ? 'hover:shadow-2xl' : 'opacity-60 grayscale-[0.5] cursor-not-allowed'}
            `}
            style={{
                marginLeft: index === 0 ? 0 : '-55px', // More overlap for tighter hand
                transformOrigin: 'bottom center'
            }}
        >
            {/* Inner Border/Frame Effect */}
            <div className="absolute inset-1 border border-black/20 rounded-sm pointer-events-none" />

            {/* Top Row */}
            <div className={`flex justify-between items-center px-1 pt-1 ${colors.text}`}>
                <span className="font-serif font-bold text-xl leading-none">{card.rank}</span>
                <span className="font-serif text-[10px] uppercase tracking-tighter font-bold opacity-80 truncate max-w-[60px]">{card.name}</span>
                <span className="font-serif font-bold text-xl leading-none">{card.rank}</span>
            </div>

            {/* Center Content (Illustration Placeholder) */}
            <div className={`
                flex-1 mx-2 my-1 rounded border-2 border-black/10 flex items-center justify-center
                ${colors.accent} relative overflow-hidden
            `}>
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

                {/* Large Rank Number */}
                <span className={`font-serif font-black text-6xl ${colors.text} opacity-90 drop-shadow-md`}>
                    {card.rank}
                </span>
            </div>

            {/* Bottom Row (Inverted) */}
            <div className={`flex justify-between items-center px-1 pb-1 ${colors.text} rotate-180`}>
                <span className="font-serif font-bold text-xl leading-none">{card.rank}</span>
                <span className="font-serif text-[10px] uppercase tracking-tighter font-bold opacity-80 truncate max-w-[60px]">{card.name}</span>
                <span className="font-serif font-bold text-xl leading-none">{card.rank}</span>
            </div>
        </motion.div>
    );
};
