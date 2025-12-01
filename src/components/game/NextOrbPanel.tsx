import React from 'react';
import { ORBS } from '@/lib/constants';
import { useGameStore } from '@/store/gameStore';

export const NextOrbPanel: React.FC = () => {
    const { nextOrbLevel } = useGameStore();
    const nextOrb = ORBS.find(o => o.level === nextOrbLevel) || ORBS[0];

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl flex flex-col items-center gap-6 w-full relative overflow-hidden">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest relative z-10">INCOMING DROP</h3>

            {/* Porthole Container */}
            <div className="relative w-32 h-32 flex items-center justify-center bg-black/40 rounded-full border-4 border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-10">
                {/* Glass Reflection Overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none z-20" />

                {/* The Orb */}
                <div
                    className="rounded-full shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pulse-fast transition-all duration-500"
                    style={{
                        width: nextOrb.radius * 2.5, // 2.5x scale
                        height: nextOrb.radius * 2.5,
                        background: nextOrb.color,
                        boxShadow: `0 0 20px ${nextOrb.color}, inset 0 -5px 10px rgba(0,0,0,0.5)`
                    }}
                />
            </div>

            <div className="text-white font-bold text-sm text-center tracking-wide relative z-10">
                {nextOrb.name}
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-neon-cyan/5 rounded-full blur-3xl -z-0" />
        </div>
    );
};
