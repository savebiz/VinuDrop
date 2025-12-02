import React, { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Clock } from 'lucide-react';

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
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1 opacity-70">
                <Clock size={12} className="text-cyan-300" />
                <h3 className="text-cyan-300 text-[10px] uppercase tracking-widest">Mission Time</h3>
            </div>
            <div className="text-2xl font-mono text-white tabular-nums tracking-wider drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                {formatTime(elapsedTime)}
            </div>
        </div>
    );
};
