import React, { useEffect, useState } from 'react';
import { ShoppingBag, Zap, Crosshair, Flame, Loader2, Vibrate, Bomb, Plus } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { ConnectButton, useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareTransaction, toWei } from "thirdweb";
import { client, vinuChain as chain } from '@/lib/thirdweb';

// Treasury & Economy Configuration
const TREASURY_ADDRESS = "0x9d754Ffd84c5A8925FEad37bf7B1Fd4FbA40f48e";
const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";
// Reward Pool Address (Contract Address or separate wallet) - Placeholder for now
const REWARD_POOL_ADDRESS = "0x9d754Ffd84c5A8925FEad37bf7B1Fd4FbA40f48e";

const SPLIT_CONFIG = {
    treasury: 100, // 100%
    burn: 0,       // 0%
    rewardPool: 0  // 0%
};

const GAS_BUFFER = 0.01; // VC buffer for gas fees

interface ShopPanelProps {
    onOpenWalletGateway: () => void;
}

export const ShopPanel: React.FC<ShopPanelProps> = ({ onOpenWalletGateway }) => {
    const { currentScore, isGameOver, targetingMode, setTargetingMode } = useGameStore();
    const { freeShakes, freeBlasts, extraShakes, extraBlasts, useShake, addExtraShakes, useBlast, addExtraBlasts, checkDailyRewards, syncWithDb, balance } = useGameEconomy();
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

        // Check for insufficient funds locally before trying transaction
        // Include a small buffer for gas to prevent "Insufficient funds" error from wallet
        if (balance && parseFloat(balance) < (parseFloat(cost) + GAS_BUFFER)) {
            onOpenWalletGateway();
            return;
        }

        setPurchasingItem(item);

        try {
            // For now, since Treasury is 100%, we just send one transaction.
            // In the future, if split logic changes, we might need a contract to handle the split 
            // or send multiple transactions (less ideal due to gas).
            // Assuming for this phase we just direct funds based on the dominant split or primary receiver.

            // If we strictly follow the request "tweak the split logic... to ensure that in future, I am able to modify accordingly":
            // We can prepare the transaction target based on the config.

            let targetAddress = TREASURY_ADDRESS;
            if (SPLIT_CONFIG.burn === 100) targetAddress = BURN_ADDRESS;
            else if (SPLIT_CONFIG.rewardPool === 100) targetAddress = REWARD_POOL_ADDRESS;

            // NOTE: Real split payment usually requires a smart contract payment gateway. 
            // For frontend-only logic, we can only easily send to one destination per user action without multiple signatures.
            // Since the request is 100% to Treasury, this works fine.

            const transaction = prepareTransaction({
                to: targetAddress,
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
                    // If error suggests insufficient funds (though tricky to detect reliably from generic error), 
                    // we could open gateway. For now, rely on pre-check.
                    alert("Transaction failed. Please try again.");
                    setPurchasingItem(null);
                }
            });
        } catch (e) {
            console.error("Error preparing transaction:", e);
            setPurchasingItem(null);
        }
    };

    const PACKS = [
        {
            id: 'shake_pack',
            name: 'Shake Pack',
            desc: 'Get 5 Shakes',
            cost: '200', // VC
            icon: Vibrate,
            action: () => addExtraShakes(5),
            color: 'text-yellow-400',
            bg: 'bg-yellow-400/20',
            border: 'border-yellow-400/30'
        },
        {
            id: 'strike_pack',
            name: 'Strike Pack',
            desc: 'Get 2 Strikes',
            cost: '400', // VC
            icon: Crosshair,
            action: () => addExtraBlasts(2),
            color: 'text-red-400',
            bg: 'bg-red-400/20',
            border: 'border-red-400/30'
        },
        {
            id: 'revive',
            name: 'Revive',
            desc: 'Remove top 3',
            cost: '1000', // VC
            icon: Flame,
            action: () => console.log("Revive logic here"), // Placeholder
            color: 'text-orange-400',
            bg: 'bg-orange-400/20',
            border: 'border-orange-400/30',
            disabled: true // Coming soon
        }
    ];

    const canAffordShake = freeShakes > 0 || extraShakes > 0;
    const canAffordBlast = freeBlasts > 0 || extraBlasts > 0;

    return (
        <div className="glass-panel-cosmic p-6 rounded-3xl w-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-hot-pink/20 rounded-xl border border-pink-200 dark:border-hot-pink/30 shadow-sm dark:shadow-[0_0_15px_rgba(255,0,153,0.3)]">
                        <ShoppingBag className="text-pink-600 dark:text-hot-pink" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">Power-Ups</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Not Connected'}
                            </span>
                            {account && (
                                <span className="text-xs font-bold text-indigo-600 dark:text-neon-cyan bg-indigo-100 dark:bg-neon-cyan/10 px-2 py-0.5 rounded-full">
                                    {balance ? parseFloat(balance).toFixed(2) : '0'} VC
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Top Up Button */}
                    {account && (
                        <button
                            onClick={onOpenWalletGateway}
                            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                            title="Add Funds"
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
                {/* Connect Wallet Prompt */}
                {!account && (
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                        <p className="text-sm text-indigo-300 mb-3">Connect wallet to purchase power-ups</p>
                        <ConnectButton client={client} chain={chain} />
                    </div>
                )}

                {/* Shop Items */}
                {PACKS.map((pack) => (
                    <div key={pack.id} className="group relative">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-neon-cyan/50 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-300">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${pack.bg} ${pack.color} border ${pack.border}`}>
                                    <pack.icon size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700 dark:text-white text-sm">{pack.name}</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{pack.desc}</div>
                                </div>
                            </div>

                            <button
                                disabled={!account || pack.disabled || purchasingItem === pack.id || isPending}
                                onClick={() => handlePurchase(pack.name, pack.cost, pack.action)}
                                className={`
                                    px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1
                                    ${!account || pack.disabled
                                        ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95'}
                                `}
                            >
                                {purchasingItem === pack.name ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <>
                                        {pack.cost} VC
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ))}

                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                {/* Active Power-Ups Controls */}
                <div className="space-y-3">
                    {/* Shake Control */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-900/20 border border-indigo-500/20">
                        <div className="flex items-center gap-2">
                            <Vibrate size={16} className="text-indigo-400" />
                            <span className="text-xs font-bold text-indigo-200">Use Shake</span>
                        </div>
                        <button
                            disabled={!canAffordShake || isGameOver}
                            onClick={useShake}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${canAffordShake
                                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 active:scale-95'
                                : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {freeShakes > 0 ? `${freeShakes} Left` : `${extraShakes} Left`}
                        </button>
                    </div>

                    {/* Blast Control */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-red-900/20 border border-red-500/20">
                        <div className="flex items-center gap-2">
                            <Crosshair size={16} className="text-red-400" />
                            <span className="text-xs font-bold text-red-200">ACTIVATE STRIKE</span>
                        </div>
                        <button
                            disabled={!canAffordBlast || isGameOver}
                            onClick={() => {
                                if (targetingMode) {
                                    setTargetingMode(false);
                                } else {
                                    setTargetingMode(true);
                                }
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${canAffordBlast
                                ? targetingMode
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/30 active:scale-95'
                                : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {targetingMode ? 'CANCEL' : (freeBlasts > 0 ? `${freeBlasts} Left` : `${extraBlasts} Left`)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
