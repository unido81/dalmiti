import React from 'react';
import { Player, CHARACTERS } from '@/types/game';

interface PlayerListProps {
    players: Player[];
    currentTurnIndex: number;
    myId: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentTurnIndex, myId }) => {
    const getCharacterImage = (charId: string) => {
        const char = CHARACTERS.find(c => c.id === charId);
        return char ? char.image : '/avatars/peasant.png';
    };

    return (
        <div className="absolute top-20 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
            {players.filter(p => p.id !== myId).map((player, index) => {
                const isTurn = players[currentTurnIndex]?.id === player.id;
                return (
                    <div
                        key={player.id}
                        className={`
                            pointer-events-auto relative p-4 rounded-lg shadow-lg border-2 transition-all min-w-[120px] flex flex-col items-center
                            ${isTurn ? 'border-amber-400 bg-[#fbf5e6] scale-105 ring-4 ring-amber-400/30' : 'border-[#8b5a2b] bg-[#f4e4bc]'}
                            ${player.hasPassed ? 'opacity-60 grayscale' : ''}
                            ${player.hand.length === 0 ? 'bg-amber-200 border-yellow-500' : ''}
                        `}
                    >
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-[#8b5a2b] mb-2 overflow-hidden relative">
                            {/* Placeholder for real image */}
                            <div className="w-full h-full flex items-center justify-center text-2xl bg-amber-900/20 text-amber-900">
                                {player.characterId && player.characterId[0].toUpperCase()}
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="font-bold text-[#4a3a2a] font-serif truncate max-w-[100px]">{player.name}</p>
                            <p className="text-sm text-[#8b5a2b] font-serif">
                                {player.hand.length === 0 ? (
                                    <span className="font-bold text-red-600">Finished!</span>
                                ) : (
                                    `${player.hand.length} 장`
                                )}
                            </p>
                        </div>

                        {/* Rank Badge if finished */}
                        {player.finishedRank && (
                            <div className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-yellow-500 text-amber-900 font-bold rounded-full border-2 border-white shadow-md z-10">
                                {player.finishedRank}
                            </div>
                        )}

                        {player.hasPassed && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg backdrop-blur-[1px]">
                                <span className="text-white font-bold text-lg rotate-[-15deg] border-2 border-white px-2 py-1 rounded">PASS</span>
                            </div>
                        )}

                        {/* Turn Order Badge */}
                        <div className="absolute top-2 left-2 bg-[#8b5a2b] text-[#f4e4bc] text-xs font-bold px-1.5 py-0.5 rounded border border-[#d4c5a3] shadow-sm">
                            #{players.findIndex(p => p.id === player.id) + 1}
                        </div>

                        {isTurn && (
                            <div className="absolute -bottom-2 transform translate-y-full">
                                <span className="text-2xl animate-bounce">⚔️</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
