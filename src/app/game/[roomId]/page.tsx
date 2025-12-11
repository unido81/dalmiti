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
import { Chat } from '@/components/game/Chat';

export default function GameRoom() {
    const { roomId } = useParams();
    const searchParams = useSearchParams();
    const nickname = searchParams.get('name');
    const router = useRouter();
    const { socket, isConnected } = useSocket();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [selectedCards, setSelectedCards] = useState<CardType[]>([]);
    const [showBotMenu, setShowBotMenu] = useState(false);
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

    const startGame = () => {
        if (socket && roomId) {
            socket.emit('start_game', roomId);
        }
    };

    const addBot = (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
        if (socket && roomId) {
            socket.emit('add_bot', { roomId: roomId, difficulty });
            setShowBotMenu(false);
        }
    };

    const handleLeaveRoom = () => {
        if (confirm('정말 게임을 포기하고 나가시겠습니까?')) {
            socket?.emit('leave_room', roomId);
            router.push('/lobby');
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
    const players = gameState.players; // For waiting room player count

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
                    onClick={handleLeaveRoom}
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
                {/* Waiting Room Controls */}
                {gameState.status === 'waiting' && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full max-w-md">
                        <div className="bg-[#f4e4bc] p-8 rounded-xl shadow-2xl border-4 border-[#8b5a2b] relative">
                            {/* Decorative Elements */}
                            <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#d4c5a3]"></div>
                            <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#d4c5a3]"></div>
                            <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#d4c5a3]"></div>
                            <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#8b5a2b] rounded-full border-2 border-[#d4c5a3]"></div>

                            <h2 className="text-3xl font-bold text-[#4a3a2a] mb-6 font-serif tracking-wide">대기실</h2>

                            <div className="space-y-4">
                                <Button
                                    onClick={startGame}
                                    variant="primary"
                                    className="w-full text-xl py-4 shadow-lg hover:scale-105 transition-transform"
                                    disabled={players.length < 2}
                                >
                                    {players.length < 2 ? '플레이어 부족 (최소 2명)' : '게임 시작 ⚔️'}
                                </Button>

                                <div className="relative">
                                    <Button
                                        onClick={() => setShowBotMenu(!showBotMenu)}
                                        variant="secondary"
                                        className="w-full text-lg border-2 border-[#8b5a2b] text-[#5a4632] hover:bg-[#e6d5aa]"
                                    >
                                        봇 추가하기 🤖
                                    </Button>

                                    {/* Bot Difficulty Menu */}
                                    {showBotMenu && (
                                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-amber-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                            <div className="p-2 space-y-1">
                                                <button onClick={() => addBot('easy')} className="w-full text-left px-4 py-2 hover:bg-green-50 text-green-700 font-bold rounded">
                                                    🌱 쉬움 (Easy)
                                                </button>
                                                <button onClick={() => addBot('medium')} className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-bold rounded">
                                                    ⚖️ 보통 (Medium)
                                                </button>
                                                <button onClick={() => addBot('hard')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 font-bold rounded">
                                                    🔥 어려움 (Hard)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleLeaveRoom}
                                    className="w-full bg-red-800/80 hover:bg-red-900 text-amber-100 border-none"
                                >
                                    나가기
                                </Button>
                            </div>

                            <div className="mt-6 text-[#8b5a2b]/70 font-serif italic">
                                현재 인원: {players.length}명
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
                {/* The waiting room controls are now handled by the absolute positioned div above */}
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
            {/* Chat Component */}
            <Chat socket={socket} roomId={roomId as string} nickname={myPlayer?.name || 'Guest'} />
        </main>
    );
}
