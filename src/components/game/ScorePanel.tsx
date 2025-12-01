import React from 'react';
import { TimerDisplay } from './TimerDisplay';
import { useGameStore } from '@/store/gameStore';
import { Trophy } from 'lucide-react';

export const ScorePanel: React.FC = () => {
    const { currentScore, bestScore } = useGameStore();

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl w-full flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">Current Score</div>
            <div className="text-6xl font-black text-indigo-600 dark:text-white font-mono mb-4 tracking-tighter dark:text-neon drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                {currentScore.toLocaleString()}
            </div>

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10">
                <Trophy className="w-4 h-4 text-amber-500 dark:text-golden-yellow" />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Best: {bestScore.toLocaleString()}</span>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent w-full my-4" />

            <TimerDisplay />
        </div>
    );
};
