import React from 'react';
import { ORBS } from '@/lib/constants';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { Orbit } from 'lucide-react';

export const EvolutionCircle: React.FC = () => {
    const { lastMergedLevel, highestOrbLevel } = useGameStore();
    const radius = 100; // Radius of the circle arrangement
    const center = 150; // Center of the SVG

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl w-full h-full flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4 relative z-10">
                <Orbit size={14} className="text-purple-400 animate-spin-slow" />
                <h3 className="text-purple-200 text-xs font-bold uppercase tracking-[0.2em]">EVOLUTION</h3>
            </div>

            <div className="relative w-[300px] h-[300px] z-10 flex items-center justify-center">
                {/* Rotating Rings Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                    <div className="w-[240px] h-[240px] border border-purple-500/30 rounded-full animate-[spin_20s_linear_infinite]"></div>
                    <div className="w-[180px] h-[180px] border border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                </div>

                <svg width="300" height="300" className="absolute top-0 left-0 pointer-events-none">
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </svg>

                {ORBS.map((orb, index) => {
                    const angle = (index / ORBS.length) * 2 * Math.PI - Math.PI / 2; // Start from top
                    const x = center + radius * Math.cos(angle);
                    const y = center + radius * Math.sin(angle);

                    const isReached = orb.level <= highestOrbLevel;
                    const isJustMerged = lastMergedLevel === orb.level;
                    const isHighest = orb.level === highestOrbLevel;

                    return (
                        <motion.div
                            key={orb.level}
                            className={`absolute flex items-center justify-center rounded-full transition-all duration-500`}
                            style={{
                                left: x,
                                top: y,
                                width: isHighest ? 40 : 24, // Highlight current max
                                height: isHighest ? 40 : 24,
                                marginLeft: isHighest ? -20 : -12,
                                marginTop: isHighest ? -20 : -12,
                                background: isReached
                                    ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${orb.color})`
                                    : '#0f172a', // Dark slate for unreached
                                opacity: isReached ? 1 : 0.5,
                                zIndex: isHighest ? 20 : 10,
                                boxShadow: isJustMerged
                                    ? `0 0 30px 10px ${orb.color}`
                                    : isReached
                                        ? `0 0 15px ${orb.color}`
                                        : 'inset 0 0 5px rgba(255,255,255,0.1)',
                                border: isJustMerged
                                    ? '2px solid white'
                                    : isReached
                                        ? '1px solid rgba(255,255,255,0.5)'
                                        : '1px solid rgba(255,255,255,0.1)'
                            }}
                            animate={{
                                scale: isJustMerged ? 1.5 : (isHighest ? 1.1 : 1),
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            {isReached && (
                                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-white/40 rounded-full blur-[1px]" />
                            )}

                            {isHighest && (
                                <div className="absolute -inset-2 border border-white/20 rounded-full animate-ping" />
                            )}
                        </motion.div>
                    );
                })}

                {/* Center Sun/Star */}
                <div className="absolute w-16 h-16 bg-gradient-to-br from-amber-300 to-orange-600 rounded-full blur-md opacity-20 animate-pulse"></div>
            </div>

            {/* Background Glow */}
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-0" />
        </div>
    );
};
