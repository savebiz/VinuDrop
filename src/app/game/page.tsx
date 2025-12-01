'use client';

import React, { useState, useEffect } from 'react';
import { VinuPhysics } from '@/components/game/VinuPhysics';
import { ScorePanel } from '@/components/game/ScorePanel';
import { LeaderboardPanel } from '@/components/game/LeaderboardPanel';
import { NextOrbPanel } from '@/components/game/NextOrbPanel';
import { EvolutionCircle } from '@/components/game/EvolutionCircle';
import { ShopPanel } from '@/components/game/ShopPanel';
import { useGameStore } from '@/store/gameStore';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PauseOverlay } from '@/components/game/PauseOverlay';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { Toast } from '@/components/ui/Toast';
import { UsernameModal } from '@/components/ui/UsernameModal';
import { FullLeaderboardModal } from '@/components/leaderboard/FullLeaderboardModal';
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { UserPen, Pause, Play, LogOut } from 'lucide-react';
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { WalletGatewayModal } from '@/components/shop/WalletGatewayModal';

export default function GamePage() {
    const { isPaused, togglePause, setGameOver, resetGame, resetKey, isGameOver, currentScore } = useGameStore();
    const { username, setUsername } = useGameEconomy();
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [showWalletGateway, setShowWalletGateway] = useState(false);
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const { disconnect } = useDisconnect();
    const [isMounted, setIsMounted] = useState(false);
    const [showBiometricToast, setShowBiometricToast] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (account) {
            // Check session storage to see if we already showed it
            const hasShown = sessionStorage.getItem('biometric_toast_shown');
            if (!hasShown) {
                const timer = setTimeout(() => {
                    setShowBiometricToast(true);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [account]);

    const handleCloseToast = () => {
        setShowBiometricToast(false);
        sessionStorage.setItem('biometric_toast_shown', 'true');
    };

    const submitScore = async () => {
        if (account && currentScore > 0) {
            try {
                await fetch('/api/submit-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        walletAddress: account.address,
                        score: currentScore,
                        playerName: username || "Player"
                    })
                });
            } catch (e) {
                console.error("Failed to save score:", e);
            }
        }
    };

    // Auto-submit score on Game Over
    useEffect(() => {
        if (isGameOver) {
            submitScore();
        }
    }, [isGameOver]);

    const handleEndGame = () => {
        setShowEndGameModal(true);
    };

    const confirmEndGame = async () => {
        await submitScore();
        resetGame(); // Reset game state (score, time, etc)
        setShowEndGameModal(false);
    };

    const handleLogoutClick = () => {
        setShowLogoutConfirmation(true);
    };

    const confirmLogout = async () => {
        if (currentScore > 0) {
            await submitScore();
        }
        resetGame();
        if (wallet) {
            disconnect(wallet);
        }
        setShowLogoutConfirmation(false);
    };

    if (!isMounted) return null; // Prevent hydration mismatch

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 overflow-hidden relative bg-slate-50 dark:bg-[#0B0B15] font-sans transition-colors duration-500">
            {/* Light Mode Mesh Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-white opacity-100 dark:opacity-0 transition-opacity duration-500 pointer-events-none" />

            {/* Dark Mode Stars (Existing) */}
            <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500 pointer-events-none">
                {/* ... existing stars logic if any, or just keep the bg color ... */}
            </div>
            {!account && <LoginScreen />}

            <UsernameModal
                isOpen={showUsernameModal}
                currentName={username || ''}
                onSave={setUsername}
                onClose={() => setShowUsernameModal(false)}
            />

            <FullLeaderboardModal />

            <WalletGatewayModal
                isOpen={showWalletGateway}
                onClose={() => setShowWalletGateway(false)}
            />

            {showBiometricToast && (
                <Toast
                    message="Enable FaceID for faster login next time?"
                    actionLabel="Enable"
                    onAction={() => {
                        alert("Passkey registration would start here.");
                        handleCloseToast();
                    }}
                    onClose={handleCloseToast}
                />
            )}

            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.15)_0%,_transparent_70%)] -z-20" />
            <div className="absolute inset-0 bg-[url('/stars.png')] opacity-40 -z-10 animate-pulse-slow" />

            {/* Header Controls (Top Right) */}
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
                <ThemeToggle />
                {account && (
                    <button
                        onClick={() => setShowUsernameModal(true)}
                        className="flex items-center gap-2 px-4 py-2 glass-panel-cosmic rounded-full hover:bg-white/10 transition-colors text-white text-sm font-bold tracking-wide"
                    >
                        <UserPen size={16} className="text-neon-cyan" />
                        {username || "Set Name"}
                    </button>
                )}
                <button
                    onClick={togglePause}
                    className="p-3 glass-panel-cosmic rounded-full hover:bg-white/10 transition-colors text-white"
                >
                    {isPaused ? <Play size={24} fill="currentColor" className="text-neon-cyan" /> : <Pause size={24} fill="currentColor" className="text-neon-cyan" />}
                </button>
                {account && (
                    <button
                        onClick={handleLogoutClick}
                        className="p-3 glass-panel-cosmic rounded-full hover:bg-red-500/20 transition-colors text-white hover:text-red-400"
                        title="Log Out & Save"
                    >
                        <LogOut size={24} />
                    </button>
                )}
            </div>

            {/* Main Cockpit Container */}
            <div className="grid grid-cols-1 lg:grid-cols-[350px_500px_350px] gap-6 w-full max-w-[1400px] h-[calc(100vh-8rem)] min-h-[700px]">

                {/* Left Column: Stats & Leaderboard */}
                <div className="hidden lg:flex flex-col gap-4 h-full animate-in slide-in-from-left duration-700">
                    <ScorePanel />
                    <div className="flex-1 min-h-0">
                        <LeaderboardPanel />
                    </div>
                </div>

                {/* Center Column: The Game Board */}
                <div className="flex flex-col items-center justify-center h-full">
                    {/* Mobile Top Bar (Score & Next) */}
                    <div className="lg:hidden w-full flex justify-between items-center mb-4 px-2">
                        <div className="glass-panel-cosmic px-4 py-2 rounded-xl">
                            <span className="text-xs text-slate-400 uppercase font-bold">Score</span>
                            <div className="text-2xl font-bold text-neon-cyan font-mono">{currentScore.toLocaleString()}</div>
                        </div>
                        <div className="glass-panel-cosmic p-2 rounded-full">
                            {/* Mini Next Orb Preview could go here */}
                        </div>
                    </div>

                    <div className="relative reactor-core rounded-b-[4rem] p-2 origin-center transition-transform duration-300">
                        <VinuPhysics key={resetKey} />
                        {isPaused && (
                            <PauseOverlay
                                onResume={togglePause}
                                onEndGame={handleEndGame}
                            />
                        )}
                    </div>

                    {/* Mobile Bottom Controls (Shop & Leaderboard Toggles) */}
                    <div className="lg:hidden w-full mt-6 grid grid-cols-2 gap-4">
                        <button className="glass-panel-cosmic p-4 rounded-xl text-center font-bold text-white active:scale-95 transition-transform">
                            Shop
                        </button>
                        <button className="glass-panel-cosmic p-4 rounded-xl text-center font-bold text-white active:scale-95 transition-transform">
                            Leaderboard
                        </button>
                    </div>
                </div>

                {/* Right Column: Shop & Next */}
                <div className="hidden lg:flex flex-col gap-4 h-full animate-in slide-in-from-right duration-700">
                    <NextOrbPanel />
                    <ShopPanel onOpenWalletGateway={() => setShowWalletGateway(true)} />
                    <div className="flex-1 min-h-0">
                        <EvolutionCircle />
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showEndGameModal}
                title="ABORT MISSION?"
                message="Ending the run now will save your current score but lose all progress."
                confirmText="SAVE & EXIT"
                cancelText="RESUME"
                isDestructive={true}
                onConfirm={confirmEndGame}
                onCancel={() => setShowEndGameModal(false)}
            />

            <ConfirmationModal
                isOpen={showLogoutConfirmation}
                title="LOG OUT?"
                message="Are you sure you want to log out? Your current score will be saved."
                confirmText="LOG OUT"
                cancelText="CANCEL"
                isDestructive={false}
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutConfirmation(false)}
            />
        </main>
    );
}
