"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player, CHARACTERS } from '@/types/game';
import { Button } from '@/components/ui/Button';

interface GameEndModalProps {
    winners: Player[];
    onReturnToLobby: () => void;
}

export function GameEndModal({ winners, onReturnToLobby }: GameEndModalProps) {
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        // Stop confetti after 5 seconds to reduce load
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const getCharacterImage = (charId: string) => {
        const char = CHARACTERS.find(c => c.id === charId);
        return char ? char.image : '/avatars/peasant.png'; // Fallback
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                {/* Confetti Effect (Simple CSS or SVG overlay) */}
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(50)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: -20,
                                    opacity: 1
                                }}
                                animate={{
                                    y: window.innerHeight + 20,
                                    rotate: 360,
                                    opacity: 0
                                }}
                                transition={{
                                    duration: Math.random() * 2 + 3,
                                    repeat: Infinity,
                                    delay: Math.random() * 5
                                }}
                                style={{
                                    backgroundColor: ['#FFD700', '#FF4500', '#00BFFF', '#32CD32'][Math.floor(Math.random() * 4)],
                                    left: `${Math.random() * 100}%`
                                }}
                            />
                        ))}
                    </div>
                )}

                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-[url('/parchment.png')] bg-cover bg-center p-8 rounded-xl shadow-2xl max-w-2xl w-full border-4 border-amber-900 text-center relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-amber-100/30"></div>

                    <div className="relative z-10">
                        <h2 className="text-4xl font-serif font-bold text-amber-900 mb-2 drop-shadow-md">
                            게임 종료!
                        </h2>
                        <p className="text-amber-800 mb-8 font-serif italic text-lg">
                            새로운 계급이 정해졌습니다.
                        </p>

                        <div className="space-y-4 mb-8">
                            {winners.map((player, index) => {
                                const rank = index + 1;
                                const isWinner = rank === 1;
                                return (
                                    <motion.div
                                        key={`${player.id}-${index}`}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.2 }}
                                        className={`flex items-center gap-4 p-3 rounded-lg border ${isWinner
                                            ? 'bg-amber-200/50 border-amber-500 shadow-md'
                                            : 'bg-white/40 border-amber-200'
                                            }`}
                                    >
                                        <div className={`
                                            flex items-center justify-center w-10 h-10 rounded-full font-bold text-xl font-serif
                                            ${isWinner ? 'bg-yellow-400 text-amber-900' : 'bg-slate-300 text-slate-700'}
                                        `}>
                                            {rank}
                                        </div>

                                        {/* Avatar Placeholder */}
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 border border-slate-400">
                                            {/* Ideally use Next.js Image or img tag with player.characterId */}
                                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                                                {player.characterId ? player.characterId[0].toUpperCase() : '?'}
                                            </div>
                                        </div>

                                        <div className="text-left flex-1">
                                            <div className="font-bold text-slate-800">{player.name}</div>
                                            <div className="text-xs text-slate-600">
                                                {isWinner ? '위대한 달무티' : `${rank}등`}
                                            </div>
                                        </div>

                                        {isWinner && (
                                            <div className="text-2xl">👑</div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        <Button
                            onClick={onReturnToLobby}
                            size="lg"
                            className="bg-amber-700 hover:bg-amber-800 text-amber-100 font-serif border-2 border-amber-900 shadow-lg"
                        >
                            로비로 돌아가기
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
