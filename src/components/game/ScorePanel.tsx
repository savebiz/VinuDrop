import React from 'react';
import { TimerDisplay } from './TimerDisplay';
import { useGameStore } from '@/store/gameStore';

export const ScorePanel: React.FC = () => {
    const { currentScore, bestScore } = useGameStore();

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 w-full max-w-xs mx-auto">
            <div className="text-center">
                <h3 className="text-sky-300 text-sm uppercase tracking-widest mb-1">Current Score</h3>
                <div className="text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {currentScore}
                </div>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <div className="text-center">
                <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-1">Best Score</h3>
                <div className="text-2xl font-bold text-slate-200">
                    {bestScore}
                </div>
            </div>
            <div className="h-px bg-white/10 w-full" />
            <TimerDisplay />
        </div>
    );
};
