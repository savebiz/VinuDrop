import React, { useEffect } from 'react';
import { ShoppingBag, Zap, Crosshair, Flame } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from '@/lib/thirdweb';

export const ShopPanel: React.FC = () => {
    const { currentScore, isGameOver, targetingMode, setTargetingMode } = useGameStore();
    const { freeShakes, freeBlasts, extraShakes, extraBlasts, useShake, addExtraShakes, useBlast, addExtraBlasts, checkDailyRewards, syncWithDb } = useGameEconomy();
    const account = useActiveAccount();

    useEffect(() => {
        checkDailyRewards();
        if (account) {
            syncWithDb(account.address);
        }
    }, [account, checkDailyRewards, syncWithDb]);

    const handleBuyShakePack = () => {
        // Mock payment for now
        if (confirm("Pay 200 VC for 5 Shakes?")) {
            addExtraShakes(5);
        }
    };

    const handleUseShake = () => {
        if (useShake()) {
            window.dispatchEvent(new CustomEvent('powerup-shake'));
        }
    };

    const handleBuyStrikePack = () => {
        if (confirm("Pay 400 VC for 2 Precision Strikes?")) {
            addExtraBlasts(2);
        }
    };

    const handlePrecisionStrike = () => {
        if (!targetingMode) {
            // Trying to enable
            if (freeBlasts > 0 || extraBlasts > 0) {
                setTargetingMode(true);
            } else {
                // No charges, prompt to buy
                handleBuyStrikePack();
            }
        } else {
            // Disable
            setTargetingMode(false);
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

                {/* Shake Pack */}
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
                                <Zap size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-slate-200 font-bold text-sm">Shake Pack</div>
                                <div className="text-xs text-slate-500">Get 5 Shakes</div>
                            </div>
                        </div>
                        <button
                            onClick={handleBuyShakePack}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            200 VC
                        </button>
                    </div>

                    {/* Use Shake Button */}
                    <button
                        onClick={handleUseShake}
                        disabled={isGameOver || (freeShakes === 0 && extraShakes === 0)}
                        className="w-full mt-2 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        Use Shake
                        {(freeShakes > 0 || extraShakes > 0) && (
                            <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">
                                {freeShakes + extraShakes} Left
                            </span>
                        )}
                    </button>
                </div>

                {/* Precision Strike Pack */}
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                                <Crosshair size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-slate-200 font-bold text-sm">Strike Pack</div>
                                <div className="text-xs text-slate-500">Get 2 Strikes</div>
                            </div>
                        </div>
                        <button
                            onClick={handleBuyStrikePack}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                            400 VC
                        </button>
                    </div>

                    <button
                        onClick={handlePrecisionStrike}
                        disabled={isGameOver || (freeBlasts === 0 && extraBlasts === 0)}
                        className={`w-full mt-2 py-2 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                            ${targetingMode ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-slate-700 hover:bg-slate-600'}
                        `}
                    >
                        {targetingMode ? 'CANCEL STRIKE' : 'ACTIVATE STRIKE'}
                        {(freeBlasts > 0 || extraBlasts > 0) && (
                            <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">
                                {freeBlasts + extraBlasts} Left
                            </span>
                        )}
                    </button>
                </div>

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
