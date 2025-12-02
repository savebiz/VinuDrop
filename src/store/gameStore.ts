import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Matter from 'matter-js';
import { ORBS } from '@/lib/constants';

interface GameState {
    currentScore: number;
    bestScore: number;
    currentOrbLevel: number;
    nextOrbLevel: number;
    isGameOver: boolean;
    highestOrbLevel: number;
    lastMergedLevel: number;

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
    addScore: (points: number, level: number) => void; // Fixed signature

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

    // Leaderboard Actions
    isLeaderboardModalOpen: boolean;
    toggleLeaderboardModal: () => void;

    // Persistence Actions
    saveGameState: (world: Matter.World) => void;
    loadGameState: (world: Matter.World) => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            currentScore: 0,
            bestScore: 0,
            currentOrbLevel: 1,
            nextOrbLevel: 1,
            isGameOver: false,
            highestOrbLevel: 1,
            lastMergedLevel: 0,
            isPlaying: false,
            startTime: null,
            elapsedTime: 0,
            shopMode: false,
            targetingMode: false,
            isPaused: false,
            savedBoardState: [],
            resetKey: 0,
            isLeaderboardModalOpen: false,

            nextTurn: () => set((state) => {
                const next = Math.floor(Math.random() * Math.min(5, state.highestOrbLevel + 1)) + 1;
                return {
                    currentOrbLevel: state.nextOrbLevel,
                    nextOrbLevel: next
                };
            }),

            setGameOver: (status) => set({ isGameOver: status, isPlaying: !status }),

            setLastMerged: (level) => set({ lastMergedLevel: level }),

            resetGame: () => set((state) => ({
                currentScore: 0,
                currentOrbLevel: 1,
                nextOrbLevel: 1,
                isGameOver: false,
                highestOrbLevel: 1,
                lastMergedLevel: 0,
                elapsedTime: 0,
                startTime: Date.now(),
                isPlaying: true,
                resetKey: state.resetKey + 1, // Force remount of physics engine
                savedBoardState: [], // Clear saved state
            })),

            addScore: (points, level) => set((state) => {
                const newScore = state.currentScore + points;
                return {
                    currentScore: newScore,
                    bestScore: Math.max(newScore, state.bestScore),
                    highestOrbLevel: Math.max(state.highestOrbLevel, level)
                };
            }),

            startGame: () => set({ isPlaying: true, startTime: Date.now() }),
            stopGame: () => set({ isPlaying: false }),
            tickTimer: () => set((state) => ({ elapsedTime: state.elapsedTime + 1 })),

            toggleShop: () => set((state) => ({ shopMode: !state.shopMode })),
            setTargetingMode: (enabled) => set({ targetingMode: enabled }),

            togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
            setPaused: (paused) => set({ isPaused: paused }),

            saveBoard: (bodies) => set({ savedBoardState: bodies }),

            toggleLeaderboardModal: () => set((state) => ({ isLeaderboardModalOpen: !state.isLeaderboardModalOpen })),

            saveGameState: (world: Matter.World) => {
                const bodies = Matter.Composite.allBodies(world)
                    .filter((b) => b.label.startsWith('orb-'))
                    .map((b) => ({
                        x: b.position.x,
                        y: b.position.y,
                        level: parseInt(b.label.split('-')[1]),
                        id: b.id,
                        velocity: { x: b.velocity.x, y: b.velocity.y }
                    }));
                set({ savedBoardState: bodies });
            },

            loadGameState: (world: Matter.World) => {
                const { savedBoardState } = get();
                if (!savedBoardState || savedBoardState.length === 0) return;

                // Clear existing orbs first to avoid duplicates
                const existingOrbs = Matter.Composite.allBodies(world).filter(b => b.label.startsWith('orb-'));
                Matter.World.remove(world, existingOrbs);

                savedBoardState.forEach(orbData => {
                    const orbInfo = ORBS.find(o => o.level === orbData.level);
                    if (orbInfo) {
                        const body = Matter.Bodies.circle(orbData.x, orbData.y, orbInfo.radius, {
                            restitution: 0.3,
                            friction: 0.1,
                            label: `orb-${orbData.level}`,
                            render: {
                                fillStyle: orbInfo.solidColor
                            }
                        });
                        // Restore velocity
                        Matter.Body.setVelocity(body, orbData.velocity);
                        Matter.World.add(world, body);
                    }
                });
            }
        }),
        {
            name: 'vinu-drop-storage',
            partialize: (state) => ({ bestScore: state.bestScore, savedBoardState: state.savedBoardState }),
        }
    )
);
