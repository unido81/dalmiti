"use client";

import React, { useEffect, useState } from 'react';

interface TurnTimerProps {
    startTime?: number;
    limit?: number;
    currentPlayerName: string;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({ startTime, limit, currentPlayerName }) => {
    const [timeLeft, setTimeLeft] = useState(limit || 0);

    useEffect(() => {
        if (!limit || limit <= 0 || !startTime) {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, limit - elapsed);
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [startTime, limit]);

    if (!limit || limit <= 0) return null;

    return (
        <div className={`
            absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2
            px-4 py-1 rounded-full font-bold text-sm shadow-md transition-colors
            border-2
            ${timeLeft <= 5 ? 'bg-red-500 text-white border-red-700 animate-pulse' : 'bg-white text-slate-800 border-slate-300'}
        `}>
            ⏳ {timeLeft}초
        </div>
    );
};
