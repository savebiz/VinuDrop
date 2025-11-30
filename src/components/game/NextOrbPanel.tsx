import React from 'react';
import { ORBS } from '@/lib/constants';
import { useGameStore } from '@/store/gameStore';

export const NextOrbPanel: React.FC = () => {
    const { nextOrbLevel } = useGameStore();
    const nextOrb = ORBS.find(o => o.level === nextOrbLevel) || ORBS[0];

    return (
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
            <h3 className="text-sky-300 text-sm uppercase tracking-widest">Next Drop</h3>
            <div className="relative w-24 h-24 flex items-center justify-center bg-slate-900/50 rounded-full border border-white/5 shadow-inner">
                <div
                    className="rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse"
                    style={{
                        width: nextOrb.radius * 2,
                        height: nextOrb.radius * 2,
                        background: nextOrb.color,
                        transform: 'scale(0.8)' // Scale down slightly to fit nicely
                    }}
                />
            </div>
            <div className="text-slate-400 text-xs text-center">
                {nextOrb.name}
            </div>
        </div>
    );
};
