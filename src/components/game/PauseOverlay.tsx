import React from 'react';
import { Play, X } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

interface PauseOverlayProps {
    onResume: () => void;
    onEndGame: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({ onResume, onEndGame }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-panel p-8 rounded-3xl text-center max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-300">
                <h2 className="text-3xl font-bold text-white mb-2">Game Paused</h2>
                <p className="text-slate-400 mb-8">Your progress is saved.</p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={onResume}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-sky-500/25"
                    >
                        <Play size={20} fill="currentColor" />
                        Resume Game
                    </button>

                    <button
                        onClick={onEndGame}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl font-bold transition-all"
                    >
                        <X size={20} />
                        End Game
                    </button>
                </div>
            </div>
        </div>
    );
};
