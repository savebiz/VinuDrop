import React from 'react';
import { TimerDisplay } from './TimerDisplay';
import { useGameStore } from '@/store/gameStore';
import { Trophy, Sparkles } from 'lucide-react';

export const ScorePanel: React.FC = () => {
    const { currentScore, bestScore } = useGameStore();

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl w-full flex flex-col items-center justify-center relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-cyan-500/20 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-cyan-200/70">Current Score</div>

            <div className="relative">
                <div className="text-6xl font-black text-white font-mono mb-4 tracking-tighter text-neon-cyan drop-shadow-[0_0_25px_rgba(0,240,255,0.6)] animate-pulse-slow">
                    {currentScore.toLocaleString()}
                </div>
                {/* Sparkles decoration */}
                <Sparkles className="absolute -top-2 -right-6 text-yellow-300 w-6 h-6 animate-pulse" />
            </div>

            <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-amber-500/20 px-5 py-2 rounded-full border border-amber-500/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                <div className="p-1 bg-amber-500/20 rounded-full">
                    <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-sm font-bold text-amber-200 tracking-wide">BEST: <span className="text-white">{bestScore.toLocaleString()}</span></span>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-6" />

            <TimerDisplay />
        </div>
    );
};
