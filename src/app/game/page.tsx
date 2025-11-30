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
import { useGameEconomy } from '@/hooks/useGameEconomy';
import { UserPen, Pause, Play } from 'lucide-react';
import { useActiveAccount } from "thirdweb/react";

export default function GamePage() {
    const { isPaused, togglePause, setGameOver, resetGame, resetKey, isGameOver, currentScore } = useGameStore();
    const { username, setUsername } = useGameEconomy();
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const account = useActiveAccount();
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

    if (!isMounted) return null; // Prevent hydration mismatch

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 lg:p-8 overflow-hidden relative transition-colors duration-500">
            {!account && <LoginScreen />}

            <UsernameModal
                isOpen={showUsernameModal}
                currentName={username || ''}
                onSave={setUsername}
                onClose={() => setShowUsernameModal(false)}
            />

            {showBiometricToast && (
                <Toast
                    message="Enable FaceID for faster login next time?"
                    actionLabel="Enable"
                    onAction={() => {
                        // Trigger passkey flow (mock for now as SDK handles it in connect)
                        alert("Passkey registration would start here.");
                        handleCloseToast();
                    }}
                    onClose={handleCloseToast}
                />
            )}

            {/* Background Elements */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--bg-secondary)] via-[var(--bg-primary)] to-[var(--bg-primary)] -z-20 transition-colors duration-500" />
            <div className="absolute inset-0 bg-[url('/stars.png')] opacity-20 dark:opacity-40 -z-10" />

            {/* Header Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
                {account && (
                    <button
                        onClick={() => setShowUsernameModal(true)}
                        className="flex items-center gap-2 px-3 py-2 glass-panel rounded-full hover:bg-white/10 transition-colors text-white text-sm font-medium"
                    >
                        <UserPen size={16} />
                        {username || "Set Name"}
                    </button>
                )}
                <button
                    onClick={togglePause}
                    className="p-3 glass-panel rounded-full hover:bg-white/10 transition-colors text-white"
                >
                    {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                </button>
                <ThemeToggle />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-8 w-full max-w-7xl items-start">

                {/* Left Column: Stats */}
                <div className="hidden lg:flex flex-col gap-6 animate-in slide-in-from-left duration-700">
                    <ScorePanel />
                    <LeaderboardPanel />
                </div>

                {/* Center Column: The Game */}
                <div className="flex flex-col items-center justify-center relative">
                    {/* Mobile Score (Visible only on small screens) */}
                    <div className="lg:hidden mb-4 w-full max-w-md flex justify-between items-center glass-panel p-4 rounded-xl">
                        <ScorePanel />
                    </div>

                    <div className="relative reactor-core rounded-b-[3rem] p-1 shadow-[0_0_50px_rgba(56,189,248,0.1)] origin-top scale-[0.85] sm:scale-90 md:scale-100 lg:scale-100 xl:scale-110 transition-transform">
                        <VinuPhysics key={resetKey} />
                        {isPaused && (
                            <PauseOverlay
                                onResume={togglePause}
                                onEndGame={handleEndGame}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column: Info */}
                <div className="hidden lg:flex flex-col gap-6 animate-in slide-in-from-right duration-700">
                    <NextOrbPanel />
                    <ShopPanel />
                    <EvolutionCircle />
                </div>
            </div>

            <ConfirmationModal
                isOpen={showEndGameModal}
                title="End Game?"
                message="Are you sure you want to end the current game? Your progress will be lost."
                confirmText="Save & End Game"
                cancelText="Return to Game"
                isDestructive={true}
                onConfirm={confirmEndGame}
                onCancel={() => setShowEndGameModal(false)}
            />
        </main>
    );
}
