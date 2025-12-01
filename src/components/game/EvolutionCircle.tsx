import React from 'react';
import { ORBS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export const EvolutionCircle: React.FC = () => {
    const { lastMergedLevel, highestOrbLevel } = useGameStore();
    const radius = 120; // Radius of the circle arrangement
    const center = 150; // Center of the SVG

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 relative z-10">EVOLUTION TRACK</h3>

            <div className="relative w-[300px] h-[300px] z-10">
                <svg width="300" height="300" className="absolute top-0 left-0 pointer-events-none">
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="4 4" />
                </svg>

                {ORBS.map((orb, index) => {
                    const angle = (index / ORBS.length) * 2 * Math.PI - Math.PI / 2; // Start from top
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);

                    const isReached = orb.level <= highestOrbLevel;
                    const isJustMerged = lastMergedLevel === orb.level;

                    return (
                        <motion.div
                            key={orb.level}
                            className="absolute flex items-center justify-center rounded-full transition-all duration-500"
                            style={{
                                left: x,
                                top: y,
                                width: 30, // Fixed size for display
                                height: 30,
                                marginLeft: -15,
                                marginTop: -15,
                                background: isReached ? orb.color : '#1e293b', // Slate-800 for unreached
                                opacity: isReached ? 1 : 0.3,
                                zIndex: 10,
                                boxShadow: isJustMerged
                                    ? `0 0 20px 5px ${orb.color}`
                                    : isReached
                                        ? `0 0 5px ${orb.color}`
                                        : 'none',
                                border: isJustMerged
                                    ? '2px solid white'
                                    : isReached
                                        ? '1px solid rgba(255,255,255,0.2)'
                                        : '1px solid rgba(255,255,255,0.05)'
                            }}
                            animate={{
                                scale: isJustMerged ? 1.5 : 1,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <span className={`text-[10px] font-bold drop-shadow-md pointer-events-none ${isReached ? 'text-white' : 'text-slate-600'}`}>
                                {orb.level}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Background Glow */}
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-hot-pink/5 rounded-full blur-3xl -z-0" />
        </div>
    );
};
