'use client';

import React from 'react';
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client, vinuChain, wallets } from '@/lib/thirdweb';
import { Rocket } from 'lucide-react';

export const LoginScreen: React.FC = () => {
    const account = useActiveAccount();

    if (account) return null; // Should be handled by parent to unmount/redirect

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="absolute inset-0 bg-[url('/stars.png')] opacity-30 animate-pulse" />

            <div className="glass-panel p-8 rounded-3xl w-full max-w-md flex flex-col items-center text-center relative z-10 border border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.2)]">
                <div className="w-20 h-20 bg-sky-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(56,189,248,0.4)] animate-bounce">
                    <Rocket size={40} className="text-sky-400" />
                </div>

                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    Vinu<span className="text-sky-400">Drop</span>
                </h1>
                <p className="text-slate-400 mb-8 text-lg">
                    Enter the VinuVerse
                </p>

                <div className="w-full">
                    <ConnectButton
                        client={client}
                        wallets={wallets}
                        chain={vinuChain}
                        connectButton={{
                            label: "Start Game",
                            className: "!w-full !py-4 !text-lg !font-bold !rounded-xl !bg-sky-500 hover:!bg-sky-400 !text-white !transition-all !shadow-lg hover:!shadow-sky-500/25",
                        }}
                        connectModal={{
                            size: "compact",
                            title: "Sign in to Play",
                            showThirdwebBranding: false,
                        }}
                    />
                </div>

                <p className="mt-6 text-xs text-slate-500">
                    Powered by VinuChain & Thirdweb
                </p>
            </div>
        </div>
    );
};
