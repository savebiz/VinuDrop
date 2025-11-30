import React, { useEffect } from 'react';
import { ShoppingBag, Zap, Crosshair, Flame } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from '@/lib/thirdweb';

export const ShopPanel: React.FC = () => {
    const { currentScore, isGameOver, targetingMode, setTargetingMode } = useGameStore();
    const { freeShakes, freeBlasts, useFreeShake, useFreeBlast, checkDailyRewards, syncWithDb } = useGameEconomy();
    const account = useActiveAccount();

    useEffect(() => {
        checkDailyRewards();
        if (account) {
            syncWithDb(account.address);
        }
    }, [account, checkDailyRewards, syncWithDb]);

    // Mock purchase functions for now
    const handleShake = () => {
        if (useFreeShake()) {
            window.dispatchEvent(new CustomEvent('powerup-shake'));
        } else {
            // Fallback to VC payment (mock)
            if (confirm("Pay 200 VC for Shake?")) {
                window.dispatchEvent(new CustomEvent('powerup-shake'));
            }
        }
    };

    const handlePrecisionStrike = () => {
        if (useFreeBlast()) {
            setTargetingMode(!targetingMode);
        } else {
            if (confirm("Pay 400 VC for Precision Strike?")) {
                setTargetingMode(!targetingMode);
            }
        }
    };

    const handleRevive = () => {
        // Revive is always paid (premium)
        if (confirm("Pay 1000 VC to Revive?")) {
            window.dispatchEvent(new CustomEvent('powerup-revive'));
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl w-full h-full min-h-[400px] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <ShoppingBag className="text-purple-400" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Power-Ups</h2>
                </div>
                <div className="scale-75 origin-right">
                    <ConnectButton client={client} />
                </div>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">

                {/* Shake */}
                <button
                    onClick={handleShake}
                    disabled={isGameOver}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-sky-500/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 group-hover:scale-110 transition-transform">
                            <Zap size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-slate-200 font-bold text-sm">Shake</div>
                            <div className="text-xs text-slate-500">Unstuck orbs</div>
                        </div>
                    </div>
                    <div className="text-right">
                        {freeShakes > 0 ? (
                            <span className="text-green-400 font-bold text-xs bg-green-900/30 px-2 py-1 rounded-full">FREE ({freeShakes})</span>
                        ) : (
                            <div className="text-sky-400 font-mono text-sm">200 VC</div>
                        )}
                    </div>
                </button>

                {/* Precision Strike */}
                <button
                    onClick={handlePrecisionStrike}
                    disabled={isGameOver}
                    className={`flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border transition-all group disabled:opacity-50 disabled:cursor-not-allowed
            ${targetingMode ? 'border-red-500 bg-red-900/20' : 'border-slate-700 hover:border-sky-500/50'}
          `}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:scale-110 transition-transform">
                            <Crosshair size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-slate-200 font-bold text-sm">Strike</div>
                            <div className="text-xs text-slate-500">Remove one orb</div>
                        </div>
                    </div>
                    <div className="text-right">
                        {freeBlasts > 0 ? (
                            <span className="text-green-400 font-bold text-xs bg-green-900/30 px-2 py-1 rounded-full">FREE ({freeBlasts})</span>
                        ) : (
                            <div className="text-sky-400 font-mono text-sm">400 VC</div>
                        )}
                    </div>
                </button>

                {/* Revive */}
                <button
                    onClick={handleRevive}
                    disabled={!isGameOver}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-sky-500/50 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
                            <Flame size={20} />
                        </div>
                        <div className="text-left">
                            <div className="text-slate-200 font-bold text-sm">Revive</div>
                            <div className="text-xs text-slate-500">Remove top 3</div>
                        </div>
                    </div>
                    <div className="text-sky-400 font-mono text-sm">1000 VC</div>
                </button>

            </div>
        </div>
    );
};
