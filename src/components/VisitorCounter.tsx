"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

export const VisitorCounter = () => {
    const { socket } = useSocket();
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (!socket) return;

        // Ask for initial count if needed, or just wait for update
        socket.on('visitor_count', (newCount: number) => {
            setCount(newCount);
        });

        return () => {
            socket.off('visitor_count');
        };
    }, [socket]);

    if (count === null) return null;

    return (
        <div className="absolute top-4 left-4 z-50 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/80 font-mono text-sm shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span>Visitors: {count.toLocaleString()}</span>
        </div>
    );
};
