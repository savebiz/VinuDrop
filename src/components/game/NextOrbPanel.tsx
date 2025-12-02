import React from 'react';
import { ORBS } from '@/lib/constants';
import { useGameStore } from '@/store/gameStore';
import { Scan } from 'lucide-react';

export const NextOrbPanel: React.FC = () => {
    const { nextOrbLevel } = useGameStore();
    const nextOrb = ORBS.find(o => o.level === nextOrbLevel) || ORBS[0];

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl flex flex-col items-center gap-6 w-full relative overflow-hidden group">
            <div className="flex items-center gap-2 relative z-10">
                <Scan size={14} className="text-cyan-400 animate-pulse" />
                <h3 className="text-cyan-200 text-xs font-bold uppercase tracking-[0.2em]">INCOMING</h3>
            </div>

            {/* Gravity Field Container */}
            <div className="relative w-32 h-32 flex items-center justify-center z-10">
                {/* Rotating Rings */}
                <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-2 border border-cyan-500/20 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 border-t-2 border-cyan-400/50 rounded-full animate-[spin_3s_linear_infinite]"></div>

                {/* Scanner Line */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-[float_2s_ease-in-out_infinite] h-1/2 w-full top-0 pointer-events-none"></div>

                {/* The Orb */}
                <div
                    className="rounded-full animate-float transition-all duration-500 relative z-20"
                    style={{
                        width: nextOrb.radius * 2.5, // 2.5x scale
                        height: nextOrb.radius * 2.5,
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), ${nextOrb.color})`,
                        boxShadow: `0 0 30px ${nextOrb.color}, inset 0 0 20px rgba(255,255,255,0.5)`
                    }}
                >
                    {/* Specular Highlight */}
                    <div className="absolute top-[15%] left-[15%] w-[40%] h-[25%] bg-white/40 rounded-[50%] rotate-[-45deg] blur-[1px]"></div>
                </div>
            </div>

            <div className="text-white font-bold text-sm text-center tracking-wide relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                {nextOrb.name}
            </div>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl -z-0" />
        </div>
    );
};
