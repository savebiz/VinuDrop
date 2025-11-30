import React, { useEffect, useState } from 'react';
import { ShoppingBag, Zap, Crosshair, Flame, Loader2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { ConnectButton, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareTransaction, toWei } from "thirdweb";
import { client, vinuChain as chain } from '@/lib/thirdweb';

// Placeholder Treasury Address - Replace with actual address
const TREASURY_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export const ShopPanel: React.FC = () => {
    const { currentScore, isGameOver, targetingMode, setTargetingMode } = useGameStore();
    const { freeShakes, freeBlasts, extraShakes, extraBlasts, useShake, addExtraShakes, useBlast, addExtraBlasts, checkDailyRewards, syncWithDb } = useGameEconomy();
    const account = useActiveAccount();

    const { mutate: sendTransaction, isPending } = useSendTransaction();
    const [purchasingItem, setPurchasingItem] = useState<string | null>(null);

    useEffect(() => {
        checkDailyRewards();
        if (account) {
            syncWithDb(account.address);
        }
    }, [account, checkDailyRewards, syncWithDb]);

    const handlePurchase = async (item: string, cost: string, onSuccess: () => void) => {
        if (!account) {
            alert("Please connect your wallet first!");
            return;
        }

        setPurchasingItem(item);

        try {
            const transaction = prepareTransaction({
                to: TREASURY_ADDRESS,
                chain: chain,
                client: client,
                value: toWei(cost), // Cost in VC (ETH/Native token)
            });

            sendTransaction(transaction, {
                onSuccess: () => {
                    onSuccess();
                    setPurchasingItem(null);
                    alert(`Successfully purchased ${item}!`);
                },
                onError: (error) => {
                    console.error("Transaction failed:", error);
                    alert("Transaction failed. Please try again.");
                    setPurchasingItem(null);
                }
            });
        } catch (e) {
            console.error("Error preparing transaction:", e);
            setPurchasingItem(null);
        }
    };

    const handleBuyShakePack = () => {
        handlePurchase("Shake Pack", "200", () => addExtraShakes(5));
    };

    const handleBuyStrikePack = () => {
        handlePurchase("Strike Pack", "400", () => addExtraBlasts(2));
    };

    const handleRevive = () => {
        handlePurchase("Revive", "1000", () => {
            window.dispatchEvent(new CustomEvent('powerup-revive'));
        });
    };

    const handleUseShake = () => {
        if (useShake()) {
            window.dispatchEvent(new CustomEvent('powerup-shake'));
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
                            disabled={isPending && purchasingItem === "Shake Pack"}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isPending && purchasingItem === "Shake Pack" ? <Loader2 size={12} className="animate-spin" /> : null}
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
                            disabled={isPending && purchasingItem === "Strike Pack"}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            {isPending && purchasingItem === "Strike Pack" ? <Loader2 size={12} className="animate-spin" /> : null}
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
                    disabled={!isGameOver || (isPending && purchasingItem === "Revive")}
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
                    <div className="text-sky-400 font-mono text-sm flex items-center gap-2">
                        {isPending && purchasingItem === "Revive" ? <Loader2 size={12} className="animate-spin" /> : null}
                        1000 VC
                    </div>
                </button>

            </div>
        </div>
    );
};
