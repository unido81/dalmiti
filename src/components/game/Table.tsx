import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from './Card';
import { Card as CardType } from '@/types/game';
import { TurnTimer } from './TurnTimer';

interface TableProps {
    lastPlayedCards: CardType[] | null;
    status: 'waiting' | 'playing' | 'finished';
    currentTurnPlayerName?: string;
    turnTimeLimit?: number;
    turnStartTime?: number;
}

export const Table: React.FC<TableProps> = ({
    lastPlayedCards,
    status,
    currentTurnPlayerName,
    turnTimeLimit,
    turnStartTime
}) => {
    return (
        <div className="relative w-full max-w-4xl h-96 flex items-center justify-center">
            {/* Turn Timer */}
            {status === 'playing' && currentTurnPlayerName && (
                <TurnTimer
                    startTime={turnStartTime}
                    limit={turnTimeLimit}
                    currentPlayerName={currentTurnPlayerName}
                />
            )}

            <div className="mb-8 text-center bg-black/40 p-4 rounded-xl backdrop-blur-sm border border-amber-900/30">
                <h2 className="text-3xl font-bold text-amber-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2 font-serif">
                    {status === 'waiting' ? '대기실' :
                        status === 'finished' ? '게임 종료!' :
                            `현재 차례: ${currentTurnPlayerName}`}
                </h2>
                {status === 'playing' && !lastPlayedCards && (
                    <p className="text-amber-200 font-serif italic text-lg">새로운 라운드 - 카드를 내주세요</p>
                )}
            </div>

            <div className="relative w-full max-w-xl h-64 flex items-center justify-center bg-[#3e2f22] rounded-[3rem] border-8 border-[#5a4632] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                {/* Wood texture or felt overlay could go here */}
                <AnimatePresence mode='wait'>
                    {lastPlayedCards && lastPlayedCards.length > 0 ? (
                        <motion.div
                            key={lastPlayedCards[0].rank} // Key changes when rank changes
                            initial={{ scale: 0.8, opacity: 0, y: -50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, x: 100 }}
                            className="flex items-center justify-center"
                        >
                            {lastPlayedCards.map((card, index) => (
                                <Card key={index} card={card} index={index} isPlayable={false} />
                            ))}
                        </motion.div>
                    ) : (
                        <div className="text-[#8b5a2b] font-bold text-2xl font-serif opacity-30 select-none">빈 테이블</div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
