"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { GameState, Card as CardType, Player } from '@/types/game';
import { Hand } from '@/components/game/Hand';
import { Table } from '@/components/game/Table';
import { PlayerList } from '@/components/game/PlayerList';
import { Button } from '@/components/ui/Button';
import { GameEndModal } from '@/components/game/GameEndModal';

export default function GameRoom() {
    const { roomId } = useParams();
    const searchParams = useSearchParams();
    const nickname = searchParams.get('name');
    const router = useRouter();
    const { socket, isConnected } = useSocket();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
    const [myPlayer, setMyPlayer] = useState<Player | null>(null);

    useEffect(() => {
        if (!socket || !nickname || !roomId) return;

        // Re-join on refresh (simple handling)
        socket.emit('join_room', { roomId, nickname });

        socket.on('game_state_update', (newState: GameState) => {
            // Patch missing IDs if necessary (for hot-reload/no-restart support)
            newState.players.forEach(p => {
                p.hand.forEach((c, i) => {
                    if (!c.id) c.id = `temp-${c.rank}-${i}-${Math.random()}`;
                });
            });

            setGameState(newState);
            const me = newState.players.find(p => p.id === socket.id);
            setMyPlayer(me || null);
        });

        return () => {
            socket.off('game_state_update');
        };
    }, [socket, roomId, nickname]);

    const handleStartGame = () => {
        if (socket && roomId) {
            socket.emit('start_game', roomId);
        }
    };

    const handleToggleSelect = (card: CardType) => {
        setSelectedCards(prev => {
            const isSelected = prev.some(c => c.id === card.id);
            if (isSelected) {
                return prev.filter(c => c.id !== card.id);
            } else {
                // Only allow selecting same rank (unless Jester logic, but keeping simple for now)
                if (prev.length > 0 && prev[0].rank !== card.rank && !card.isJester && !prev[0].isJester) {
                    // Auto-clear if selecting different rank (UX choice)
                    return [card];
                }
                return [...prev, card];
            }
        });
    };

    const handlePlayCards = () => {
        if (socket && roomId && selectedCards.length > 0) {
            socket.emit('play_cards', { roomId, cards: selectedCards });
            setSelectedCards([]); // Clear selection
        }
    };

    const handlePass = () => {
        if (socket && roomId) {
            socket.emit('pass_turn', roomId);
            setSelectedCards([]);
        }
    };

    if (!isConnected) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500">서버 연결 중...</div>;
    }

    if (!gameState) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500">게임 정보 불러오는 중...</div>;
    }

    const isMyTurn = gameState.status === 'playing' &&
        gameState.players[gameState.currentTurnIndex]?.id === socket?.id;

    const currentTurnPlayer = gameState.players[gameState.currentTurnIndex];

    const sortedWinners = [...gameState.winners].sort((a, b) => (a.finishedRank || 0) - (b.finishedRank || 0));

    return (
        <main className="min-h-screen bg-[#2c1e14] overflow-hidden relative flex flex-col font-serif text-amber-100">
            {/* Medieval Background */}
            <div className="absolute inset-0 opacity-20 bg-[url('/bg-texture.png')] pointer-events-none mix-blend-overlay"></div>

            {/* Game Info - Parchment Style */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#f4e4bc] px-8 py-3 rounded-lg text-amber-900 text-lg font-bold border-4 border-[#8b5a2b] shadow-xl z-10 flex items-center gap-4">
                <span className="opacity-70">Room: {roomId}</span>
                <span className="w-px h-6 bg-amber-900/30"></span>
                <span>Round {gameState.round}</span>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <Button
                    onClick={() => {
                        if (confirm('정말 게임을 포기하고 나가시겠습니까?')) {
                            socket?.emit('leave_room', roomId);
                            router.push('/lobby');
                        }
                    }}
                    variant="secondary"
                    size="sm"
                    className="bg-red-900/80 hover:bg-red-800 text-red-100 border-red-950 font-serif"
                >
                    포기하기 🏳️
                </Button>
            </div>

            {/* Game End Modal */}
            {gameState.status === 'finished' && (
                <GameEndModal
                    winners={sortedWinners}
                    onReturnToLobby={() => router.push('/lobby')}
                />
            )}

            {/* Opponents */}
            <PlayerList
                players={gameState.players}
                currentTurnIndex={gameState.currentTurnIndex}
                myId={socket?.id || ''}
            />

            {/* Game Table (Center) */}
            <div className="flex-1 flex items-center justify-center z-0 relative">
                <Table
                    lastPlayedCards={gameState.lastPlayedCards}
                    status={gameState.status}
                    currentTurnPlayerName={currentTurnPlayer?.name}
                />
            </div>

            {/* Controls */}
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
                {gameState.status === 'waiting' && (
                    <div className="flex gap-4">
                        <Button onClick={() => socket?.emit('add_bot', roomId)} variant="secondary" size="lg" className="border-amber-700 text-amber-900 bg-[#f4e4bc] hover:bg-[#e6d0a0]">
                            봇 추가 🤖
                        </Button>
                        <Button onClick={handleStartGame} size="lg" className="animate-bounce bg-amber-600 border-amber-800 hover:bg-amber-700 text-white shadow-xl">
                            게임 시작 ⚔️
                        </Button>
                    </div>
                )}

                {isMyTurn && (
                    <>
                        <Button
                            onClick={handlePlayCards}
                            disabled={selectedCards.length === 0}
                            variant="primary"
                            className="shadow-xl bg-amber-600 border-amber-800 hover:bg-amber-700 text-white px-8 py-3 text-lg"
                        >
                            선택한 카드 내기 ({selectedCards.length})
                        </Button>
                        <Button
                            onClick={handlePass}
                            variant="secondary"
                            className="shadow-xl bg-[#5a4632] border-[#3e2f22] text-amber-200 hover:bg-[#4a3a2a] px-6"
                        >
                            패스 🚫
                        </Button>
                    </>
                )}
            </div>

            {/* My Hand */}
            {myPlayer && (
                <Hand
                    cards={myPlayer.hand}
                    selectedCards={selectedCards}
                    onToggleSelect={handleToggleSelect}
                    isMyTurn={isMyTurn}
                />
            )}
        </main>
    );
}
