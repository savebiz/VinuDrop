import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
    currentScore: number;
    bestScore: number;
    currentOrbLevel: number;
    nextOrbLevel: number;
    isGameOver: boolean;
    lastMergedLevel: number | undefined;

    // Timer State
    isPlaying: boolean;
    startTime: number | null;
    elapsedTime: number; // in seconds

    // Shop State
    shopMode: boolean;
    targetingMode: boolean;

    // Pause & Persistence
    isPaused: boolean;
    savedBoardState: { x: number; y: number; level: number; id: number; velocity: { x: number; y: number } }[];
    resetKey: number;

    // Actions
    nextTurn: () => void;
    setGameOver: (status: boolean) => void;
    setLastMerged: (level: number) => void;
    resetGame: () => void;
    addScore: (points: number) => void;

    // Timer Actions
    startGame: () => void;
    stopGame: () => void;
    tickTimer: () => void;

    // Shop Actions
    toggleShop: () => void;
    setTargetingMode: (enabled: boolean) => void;

    // Pause Actions
    togglePause: () => void;
    setPaused: (paused: boolean) => void;
    saveBoard: (bodies: { x: number; y: number; level: number; id: number; velocity: { x: number; y: number } }[]) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            currentScore: 0,
            bestScore: 0,
            currentOrbLevel: 1,
            nextOrbLevel: Math.floor(Math.random() * 5) + 1,
            isGameOver: false,
            lastMergedLevel: 0,

            // Timer Initial State
            isPlaying: false,
            startTime: null,
            elapsedTime: 0,

            // Shop Initial State
            shopMode: false,
            targetingMode: false,

            // Pause & Persistence Initial State
            isPaused: false,
            savedBoardState: [],
            resetKey: 0,

            nextTurn: () => set((state) => ({
                currentOrbLevel: state.nextOrbLevel,
                nextOrbLevel: Math.floor(Math.random() * 5) + 1,
            })),

            setGameOver: (status) => {
                set({ isGameOver: status, isPlaying: false });
                if (status) {
                    const { currentScore, bestScore } = get();
                    if (currentScore > bestScore) {
                        set({ bestScore: currentScore });
                    }
                }
            },

            setLastMerged: (level) => set({ lastMergedLevel: level }),

            resetGame: () => set((state) => ({
                currentScore: 0,
                isGameOver: false,
                currentOrbLevel: 1,
                nextOrbLevel: Math.floor(Math.random() * 5) + 1,
                lastMergedLevel: 0,
                isPlaying: true,
                startTime: Date.now(),
                elapsedTime: 0,
                shopMode: false,
                targetingMode: false,
                isPaused: false,
                savedBoardState: [],
                resetKey: state.resetKey + 1 // Increment to force re-render
            })),

            addScore: (points) => set((state) => ({ currentScore: state.currentScore + points })),

            startGame: () => set({ isPlaying: true, startTime: Date.now() }),
            stopGame: () => set({ isPlaying: false }),
            tickTimer: () => set((state) => ({
                elapsedTime: state.isPlaying ? state.elapsedTime + 1 : state.elapsedTime
            })),

            toggleShop: () => set((state) => ({ shopMode: !state.shopMode })),
            setTargetingMode: (enabled) => set({ targetingMode: enabled }),

            togglePause: () => set((state) => ({ isPaused: !state.isPaused, isPlaying: state.isPaused })), // If pausing, stop playing. If unpausing, start playing.
            setPaused: (paused) => set({ isPaused: paused, isPlaying: !paused }),
            saveBoard: (bodies) => set({ savedBoardState: bodies }),
        }),
        {
            name: 'vinudrop-storage',
            partialize: (state) => ({
                bestScore: state.bestScore,
                currentScore: state.currentScore,
                currentOrbLevel: state.currentOrbLevel,
                nextOrbLevel: state.nextOrbLevel,
                elapsedTime: state.elapsedTime,
                savedBoardState: state.savedBoardState,
                isPaused: state.isPaused
            }),
        }
    )
);
