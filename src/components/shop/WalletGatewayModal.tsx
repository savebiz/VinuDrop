import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Wallet, Copy, AlertTriangle, Check } from 'lucide-react';
import { PayEmbed, useActiveAccount } from "thirdweb/react";
import { client } from '@/lib/thirdweb';
import { defineChain } from "thirdweb";
import QRCode from "react-qr-code";
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { useTheme } from 'next-themes';

interface WalletGatewayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WalletGatewayModal: React.FC<WalletGatewayModalProps> = ({ isOpen, onClose }) => {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<'fiat' | 'crypto'>('fiat');
    const account = useActiveAccount();
    const { balance, syncWithDb } = useGameEconomy();
    const [initialBalance, setInitialBalance] = useState<string>('0');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Track balance to auto-close on success
    useEffect(() => {
        if (isOpen && balance) {
            setInitialBalance(balance);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && balance && initialBalance && parseFloat(balance) > parseFloat(initialBalance)) {
            // Balance increased!
            const timer = setTimeout(() => {
                onClose();
                alert("Funds received! Payment successful.");
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [balance, initialBalance, isOpen, onClose]);

    // Poll for balance updates
    useEffect(() => {
        if (!isOpen || !account) return;

        const interval = setInterval(() => {
            syncWithDb(account.address);
        }, 5000);

        return () => clearInterval(interval);
    }, [isOpen, account, syncWithDb]);

    const handleCopy = () => {
        if (account?.address) {
            navigator.clipboard.writeText(account.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel-cosmic w-full max-w-md rounded-3xl overflow-hidden relative border border-white/10 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white tracking-wide">ADD FUNDS</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-slate-400" size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-black/20">
                    <button
                        onClick={() => setActiveTab('fiat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'fiat'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        <CreditCard size={18} />
                        BUY $VC
                    </button>
                    <button
                        onClick={() => setActiveTab('crypto')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'crypto'
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        <Wallet size={18} />
                        TRANSFER
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'fiat' ? (
                            <motion.div
                                key="fiat"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full flex flex-col"
                            >
                                <PayEmbed
                                    client={client}
                                    payOptions={{
                                        mode: "fund_wallet",
                                        metadata: { name: "Vinu Drop Coins" },
                                        prefillBuy: {
                                            token: {
                                                symbol: "VC",
                                                address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native Token Address
                                                name: "VinuChain",
                                            },
                                            chain: defineChain(207),
                                            allowEdits: { chain: false, token: false, amount: false }
                                        }
                                    }}
                                    theme={mounted && resolvedTheme === 'dark' ? "dark" : "light"}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="crypto"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="p-4 bg-white rounded-2xl shadow-xl">
                                    {account?.address && (
                                        <QRCode
                                            value={account.address}
                                            size={200}
                                            level="H"
                                        />
                                    )}
                                </div>

                                <div className="w-full space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Deposit Address</label>
                                    <div className="flex items-center gap-2 p-3 bg-black/30 rounded-xl border border-white/10">
                                        <code className="flex-1 text-sm text-slate-300 font-mono break-all">
                                            {account?.address}
                                        </code>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-400"
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="w-full p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs text-amber-200/80 leading-relaxed">
                                        Send only <strong className="text-amber-200">VinuChain (VC)</strong> assets to this address.
                                        Sending other tokens may result in permanent loss.
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-2 text-slate-400 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Watching for deposit...
                                    <span className="ml-auto font-mono text-white">
                                        {parseFloat(balance || '0').toFixed(4)} VC
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
