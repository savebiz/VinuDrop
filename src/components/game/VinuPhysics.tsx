import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { ORBS, GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS } from '@/lib/constants';
import { useGameStore } from '@/store/gameStore';

export const VinuPhysics: React.FC = () => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);

    const {
        addScore,
        currentOrbLevel,
        nextOrbLevel,
        nextTurn,
        setGameOver,
        isGameOver,
        setLastMerged,
        resetGame,
        startGame,
        stopGame,
        targetingMode,
        setTargetingMode,
        isPaused,
        saveBoard,
        savedBoardState
    } = useGameStore();

    // Local state for the spawner position (visual only)
    const [spawnerX, setSpawnerX] = useState(GAME_WIDTH / 2);
    const [canDrop, setCanDrop] = useState(true);

    // Start game timer on mount
    useEffect(() => {
        if (!isPaused && !isGameOver) {
            startGame();
        }
        return () => stopGame();
    }, [startGame, stopGame, isPaused, isGameOver]);

    // Handle Pause/Resume of Engine
    useEffect(() => {
        if (!runnerRef.current || !engineRef.current) return;

        if (isPaused) {
            Matter.Runner.stop(runnerRef.current);
            // Save state when pausing
            const bodies = Matter.Composite.allBodies(engineRef.current.world)
                .filter(b => b.label.startsWith('orb-'))
                .map(b => ({
                    x: b.position.x,
                    y: b.position.y,
                    level: parseInt(b.label.split('-')[1]),
                    id: b.id,
                    velocity: { x: b.velocity.x, y: b.velocity.y }
                }));
            saveBoard(bodies);
        } else {
            Matter.Runner.run(runnerRef.current, engineRef.current);
        }
    }, [isPaused, saveBoard]);

    useEffect(() => {
        if (!sceneRef.current) return;

        // 1. Setup Matter.js
        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            Events = Matter.Events,
            World = Matter.World,
            Body = Matter.Body,
            Query = Matter.Query;

        const engine = Engine.create();
        const world = engine.world;
        engineRef.current = engine;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio
            }
        });
        renderRef.current = render;

        // 2. Create Walls (U-shape)
        const ground = Bodies.rectangle(GAME_WIDTH / 2, GAME_HEIGHT + WALL_THICKNESS / 2 - 10, GAME_WIDTH, WALL_THICKNESS, {
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });

        const leftWall = Bodies.rectangle(0 - WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, {
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });

        const rightWall = Bodies.rectangle(GAME_WIDTH + WALL_THICKNESS / 2, GAME_HEIGHT / 2, WALL_THICKNESS, GAME_HEIGHT, {
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });

        Composite.add(world, [ground, leftWall, rightWall]);

        // 2.5 Load Saved State if exists
        if (savedBoardState && savedBoardState.length > 0) {
            const loadedBodies = savedBoardState.map(data => {
                const orbInfo = ORBS.find(o => o.level === data.level);
                if (!orbInfo) return null;
                const body = Bodies.circle(data.x, data.y, orbInfo.radius, {
                    restitution: 0.3,
                    friction: 0.1,
                    label: `orb-${data.level}`,
                    render: { fillStyle: orbInfo.solidColor }
                });
                Body.setVelocity(body, data.velocity);
                return body;
            }).filter(b => b !== null) as Matter.Body[];

            Composite.add(world, loadedBodies);
        }

        // 3. Collision Handling (Merging)
        Events.on(engine, 'collisionStart', (event) => {
            const pairs = event.pairs;

            for (let i = 0; i < pairs.length; i++) {
                const { bodyA, bodyB } = pairs[i];

                // Check if both are orbs and have same level
                if (bodyA.label.startsWith('orb-') && bodyB.label.startsWith('orb-') && bodyA.label === bodyB.label) {
                    const level = parseInt(bodyA.label.split('-')[1]);

                    // Don't merge if max level
                    if (level >= 11) continue;

                    // Remove old bodies
                    Composite.remove(world, [bodyA, bodyB]);

                    // Calculate midpoint
                    const midX = (bodyA.position.x + bodyB.position.x) / 2;
                    const midY = (bodyA.position.y + bodyB.position.y) / 2;

                    // Create new orb
                    const nextOrb = ORBS.find(o => o.level === level + 1);
                    if (nextOrb) {
                        const newBody = Bodies.circle(midX, midY, nextOrb.radius, {
                            restitution: 0.3,
                            label: `orb-${nextOrb.level}`,
                            render: {
                                fillStyle: nextOrb.solidColor
                            }
                        });

                        Composite.add(world, newBody);

                        // Update State
                        addScore(ORBS[level - 1].score);
                        setLastMerged(level + 1);
                    }
                }
            }
        });

        // 4. Game Over Logic
        const DANGER_Y = 150; // Top area
        let dangerTimer = 0;

        Events.on(engine, 'afterUpdate', () => {
            const bodies = Composite.allBodies(world);
            let danger = false;

            bodies.forEach(body => {
                if (body.label.startsWith('orb-') && !body.isSleeping) {
                    // If body is above line and relatively stable
                    if (body.position.y < DANGER_Y && Math.abs(body.velocity.y) < 0.2) {
                        danger = true;
                    }
                }
            });

            if (danger) {
                dangerTimer += 16.67; // approx ms per frame
                if (dangerTimer > 3000) { // 3 seconds
                    setGameOver(true);
                }
            } else {
                dangerTimer = 0;
            }
        });

        // Power-Up Listeners
        const onShake = () => {
            const bodies = Composite.allBodies(world);
            bodies.forEach(body => {
                if (!body.isStatic) {
                    const forceMagnitude = 0.05 * body.mass;
                    Body.applyForce(body, body.position, {
                        x: (Math.random() - 0.5) * forceMagnitude,
                        y: -forceMagnitude // Upward kick
                    });
                }
            });
        };

        const onRevive = () => {
            const bodies = Composite.allBodies(world).filter(b => b.label.startsWith('orb-'));
            // Sort by Y (ascending = top)
            bodies.sort((a, b) => a.position.y - b.position.y);

            // Remove top 3
            const toRemove = bodies.slice(0, 3);
            Composite.remove(world, toRemove);

            // Resume game
            setGameOver(false);
            startGame();
        };

        window.addEventListener('powerup-shake', onShake);
        window.addEventListener('powerup-revive', onRevive);

        // Run the engine
        Render.run(render);
        const runner = Runner.create();
        runnerRef.current = runner;

        // Only run if not paused
        if (!isPaused) {
            Runner.run(runner, engine);
        }

        return () => {
            window.removeEventListener('powerup-shake', onShake);
            window.removeEventListener('powerup-revive', onRevive);
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            World.clear(world, false);
            Engine.clear(engine);
        };
    }, [setGameOver, startGame]); // Removed isPaused from dependency array to prevent re-init

    // Mouse Control
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isGameOver) return;
        const rect = sceneRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            // Clamp to bounds
            const clampedX = Math.max(WALL_THICKNESS, Math.min(x, GAME_WIDTH - WALL_THICKNESS));
            setSpawnerX(clampedX);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!engineRef.current) return;

        // Precision Strike Logic
        if (targetingMode) {
            const rect = sceneRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const bodies = Matter.Composite.allBodies(engineRef.current.world);
                const clickedBodies = Matter.Query.point(bodies, { x, y });

                if (clickedBodies.length > 0) {
                    const bodyToRemove = clickedBodies[0];
                    if (bodyToRemove.label.startsWith('orb-')) {
                        Matter.Composite.remove(engineRef.current.world, bodyToRemove);
                        setTargetingMode(false); // Disable after use
                    }
                }
            }
            return; // Don't drop orb
        }

        if (isGameOver || !canDrop) return;

        setCanDrop(false);

        // Spawn CURRENT orb
        const orbInfo = ORBS.find(o => o.level === currentOrbLevel) || ORBS[0];

        const body = Matter.Bodies.circle(spawnerX, 50, orbInfo.radius, {
            restitution: 0.3,
            friction: 0.1,
            label: `orb-${orbInfo.level}`,
            render: {
                fillStyle: orbInfo.solidColor
            }
        });

        Matter.Composite.add(engineRef.current.world, body);

        // Prepare next turn (Current <- Next, Next <- Random)
        nextTurn();

        // Cooldown
        setTimeout(() => setCanDrop(true), 500);
    };

    return (
        <div className="relative mx-auto" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            {/* Glass Container Overlay */}
            <div className="absolute inset-0 pointer-events-none border-b-8 border-l-8 border-r-8 border-sky-500/30 rounded-b-3xl z-20 shadow-[0_0_50px_rgba(56,189,248,0.2)]" />

            {/* Danger Line */}
            <div className="absolute top-[150px] left-0 w-full border-t-2 border-dashed border-red-500 z-10 pointer-events-none opacity-70">
                <div className="absolute w-full -top-6 text-center">
                    <span className="text-red-500 text-xs font-bold uppercase tracking-widest bg-black/50 px-2 py-1 rounded">Danger Zone</span>
                </div>
            </div>

            {/* Spawner Visual */}
            <div
                className="absolute top-4 -ml-6 w-12 h-12 z-30 pointer-events-none transition-transform duration-75"
                style={{ left: spawnerX }}
            >
                {/* UFO/Claw Icon */}
                <div className="w-full h-full bg-sky-400 rounded-full opacity-80 shadow-[0_0_15px_#38bdf8]" />

                {/* Current Orb Preview (In Hand) */}
                {canDrop && !targetingMode && (
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 rounded-full opacity-90 shadow-lg"
                        style={{
                            width: ORBS[currentOrbLevel - 1].radius * 2,
                            height: ORBS[currentOrbLevel - 1].radius * 2,
                            background: ORBS[currentOrbLevel - 1].color, // Use gradient for UI
                            transform: 'scale(0.8)'
                        }}
                    />
                )}
            </div>

            {/* Physics Canvas */}
            <div
                ref={sceneRef}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
                className={`absolute inset - 0 z - 10 ${targetingMode ? 'cursor-crosshair' : 'cursor-none'} `}
            />

            {isGameOver && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">Game Over</h2>
                        <div className="text-xl text-sky-300 mb-8">Score: {useGameStore.getState().currentScore}</div>
                        <button
                            onClick={() => {
                                window.location.reload();
                            }}
                            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(56,189,248,0.5)]"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
