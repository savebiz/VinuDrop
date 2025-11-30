import React, { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export const TimerDisplay: React.FC = () => {
    const { elapsedTime, isPlaying, tickTimer } = useGameStore();

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isPlaying) {
            interval = setInterval(() => {
                tickTimer();
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isPlaying, tickTimer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="text-center mt-4">
            <h3 className="text-sky-300 text-xs uppercase tracking-widest mb-1">Time</h3>
            <div className="text-xl font-mono text-slate-200 tabular-nums">
                {formatTime(elapsedTime)}
            </div>
        </div>
    );
};
