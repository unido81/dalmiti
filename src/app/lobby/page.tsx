"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useSocket } from '@/hooks/useSocket';

export default function Lobby() {
    const router = useRouter();
    const { socket, isConnected } = useSocket();
    const [nickname, setNickname] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('player_joined', (player) => {
                console.log('Player joined:', player);
            });

            // Listen for successful join/create confirmation if needed
            // For now we just redirect immediately after emitting
        }
    }, [socket]);

    const handleCreateRoom = () => {
        if (!nickname) return alert('닉네임을 입력해주세요');
        if (!socket) return;

        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        socket.emit('join_room', { roomId: newRoomId, nickname });
        router.push(`/game/${newRoomId}?name=${encodeURIComponent(nickname)}`);
    };

    const handleJoinRoom = () => {
        if (!nickname) return alert('닉네임을 입력해주세요');
        if (!roomId) return alert('방 ID를 입력해주세요');
        if (!socket) return;

        socket.emit('join_room', { roomId, nickname });
        router.push(`/game/${roomId}?name=${encodeURIComponent(nickname)}`);
    };

    return (
        <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <h1 className="text-3xl font-bold text-center mb-8 text-slate-800">게임 대기실</h1>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="이름을 입력하세요"
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="border-t border-slate-200 my-6"></div>

                    <div className="space-y-4">
                        <Button
                            onClick={handleCreateRoom}
                            className="w-full"
                            variant="primary"
                            disabled={!isConnected}
                        >
                            방 만들기
                        </Button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">또는</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                placeholder="방 ID"
                                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Button
                                onClick={handleJoinRoom}
                                variant="secondary"
                                disabled={!isConnected}
                            >
                                참가
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                        상태: {isConnected ? '서버 연결됨' : '연결 중...'}
                    </p>
                </div>
            </div>
        </main>
    );
}
